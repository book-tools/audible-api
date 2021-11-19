/* eslint-disable no-param-reassign */
import { load as loadPage } from "cheerio";
import dJSON from "dirty-json";
import fetch from "node-fetch";
import { URL } from "url";
import { siteCountries } from "./data/audible-search-fields";
import { getLanguageByName } from "./utils/language";
import {
  cleanDescription,
  cleanNarratorUrl,
  cleanTitle,
  cleanUrl,
  getCopyrightYear,
} from "./utils/string";
import { SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from "./utils/time";

/**
 * A creator of the audiobook, either Author or Narrator
 *
 * @typedef {object} Creator
 * @property {string} id Amazon's unique identifier for the creator (only applies to author)
 * @property {string} name The creator's name
 * @property {string} bio a description of the creator
 * @property {string} url The Audible URL of the creator's page with photo and bio
 * @property {string} imageUrl A full resolution photo of the creator
 * @property {string} thumbnailImageUrl A small resolution thumbnail of the creator's photo (usually 120x120)
 */

/**
 * Get extended information about the author from their Audible URL
 *
 * @param {Creator} author An initial object of the creator to extend (reuired url)
 * @returns {Creator} An extended object of information about the author
 */
async function parseAuthorInfo(/** @type {Creator} */ author) {
  try {
    const res = await fetch(author.url);
    const body = await res.text();

    const page = loadPage(body);

    let ldJsonList = [];
    page('script[type="application/ld+json"]').each((i, elSel) => {
      // Use dirty-json because the description section has line breaks instead of \n characters like it should
      const jsonObj = dJSON.parse(elSel.children[0].data);
      ldJsonList.push(jsonObj);
    });
    ldJsonList = ldJsonList.flat();

    // parse useful ld+json from the dom of the authors's page
    const authorJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "MusicGroup"
    );
    const personJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "Person"
    );

    const newAuthor = { ...author };

    // Get author's name
    newAuthor.name = authorJson.name || newAuthor.name;

    // Get author's bio
    newAuthor.bio = authorJson.description || newAuthor.bio;

    // Get author's amazon ID
    newAuthor.id = authorJson.url.split("/").pop();

    // Get Author's Images
    const main = ".adbl-main";
    newAuthor.thumbnailImageUrl = page("img.author-image-outline", main).attr(
      "src"
    );

    newAuthor.imageUrl = personJson.image;

    // Get clean author url
    newAuthor.url = authorJson.url || newAuthor.url;

    return newAuthor;
  } catch (err) {
    return author;
  }
}

/**
 * Get all Audible details about an Audiobook from its ASIN
 *
 * @param {string} asin   Amazon Standard Identification Number, Amazon's unique ID that they assign to all of their products
 * @param {string} [site=us] The audible site locality to get the book data from — Default: `us` | Options: `us`, `ca`, `gb`, `au`, `fr`, `de`, `it`
 * @param {boolean} [getAuthors=false] Whether or not to get the full author information for each author.  This will add the author's bio and photo urls but it will take more time as their page must be pulled and parsed
 * @returns {object} The parsed book data
 */
export default async function getAudibleBook(
  asin,
  { site = "us", getAuthors = false } = {}
) {
  try {
    const {
      url: baseUrl,
      // language: siteLanguage,
    } = siteCountries[site] || siteCountries.us;

    const bookUrl = `${baseUrl}/pd/${asin}?ipRedirectOverride=true`;

    const res = await fetch(bookUrl);
    const body = await res.text();
    const page = loadPage(body);

    const main = 'div[role="main"]';

    // Get URL
    const book = {
      url: page('link[rel="canonical"]').attr("href"),
      authors: [],
      narrators: [],
    };

    // Get Authors
    page(".authorLabel a", main).each((i, elSel) => {
      const el = page(elSel);

      book.authors.push({
        name: el.text().trim(),
        url: cleanUrl(new URL(el.attr("href"), baseUrl).href),
      });
    });
    // Get extended author information
    if (getAuthors) {
      book.authors = await Promise.all(
        book.authors.map((author) => parseAuthorInfo(author))
      );
    }

    // Get narrators
    page(".narratorLabel a", main).each((i, elSel) => {
      const el = page(elSel);

      book.narrators.push({
        name: el.text().trim(),
        url: cleanNarratorUrl(new URL(el.attr("href"), baseUrl).href),
      });
    });

    // Get series and series part
    try {
      const series = [];

      page(".seriesLabel a", main).each((i, elSel) => {
        const el = page(elSel);

        series.push({
          name: el.text().trim(),
          url: cleanUrl(new URL(el.attr("href"), baseUrl).href),
        });
      });

      const seriesArr = page(".seriesLabel")
        .text()
        .replace(/\n/g, "")
        .trim()
        // remove the beginning text from the series
        .replace("Series: ", "")
        .split(", ")
        .map((item) => item.trim());

      seriesArr.forEach((seriesStr, i) => {
        if (seriesStr.includes("Book")) {
          const seriesPart = Number(seriesStr.replace("Book ", ""));
          if (seriesPart) {
            const matchingBookIndex = series.findIndex(
              (item) => item.name === seriesArr[i - 1]
            );
            if (matchingBookIndex > -1) {
              series[matchingBookIndex].part = seriesPart;
            }
          }
        }
      });

      book.series = series;
    } catch (err) {
      console.warn(`ERROR PARSING AUDIBLE SERIES'\n${err.stack}`);
    }

    // Get Copyright Info string and year
    try {
      const copyright = page(
        ".productPublisherSummary .bc-section > .bc-box:last-child"
      )
        .eq(0)
        .text()
        .trim();
      if (copyright && copyright.includes("©")) {
        book.copyright = copyright.replace(/\s+/g, " ");
        book.copyrightYear = getCopyrightYear(copyright);
      }
    } catch (err) {
      console.warn("Error parsing copyright", err);
    }

    let ldJsonList = [];
    page('script[type="application/ld+json"]').each((i, elSel) => {
      let jsonObj;
      try {
        jsonObj = JSON.parse(elSel.children[0].data);
      } catch (err) {
        jsonObj = dJSON.parse(elSel.children[0].data);
      }
      ldJsonList.push(jsonObj);
    });
    ldJsonList = ldJsonList.flat();

    // parse useful ld+json from the dom of the page
    const bookJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "Audiobook"
    );
    const breadcrumbJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "BreadcrumbList"
    );
    const productJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "Product"
    );

    // Get ASIN
    book.asin = productJson.productID;
    // Get SKU
    book.sku = productJson.sku;
    // Get title
    book.title = bookJson.name;
    // Get clean title, without series part ("Book N") or "(Unabridged)"
    book.cleanTitle = cleanTitle(bookJson.name);
    // Get Publisher
    book.publisher = bookJson.publisher;
    // Get language and language codes
    book.language = getLanguageByName(bookJson.inLanguage);
    // Get full description (without any html)
    book.description = cleanDescription(bookJson.description);
    // Get the date the book was published
    book.datePublished = new Date(bookJson.datePublished);
    // Get user rating
    if (bookJson.aggregateRating) {
      const { ratingValue, ratingCount } = bookJson.aggregateRating;
      book.rating = {
        value: parseFloat(ratingValue),
        count: Number(ratingCount),
      };
    }
    // Get pricing
    if (bookJson.offers) {
      const { lowPrice, highPrice, priceCurrency } = bookJson.offers;
      book.price = {
        low: Number(lowPrice),
        high: Number(highPrice),
        currency: priceCurrency,
      };
    }
    // Get Genres
    book.coverUrl = bookJson.image;
    if (breadcrumbJson) {
      book.genres = breadcrumbJson.itemListElement
        .slice(1)
        .map((breadcrumb) => ({
          name: breadcrumb.item.name,
          url: `${baseUrl}${breadcrumb.item["@id"]}`,
        }));
    }
    // Get Abridgement
    book.isAbridged = bookJson.abridged === "true";
    // Get duration in seconds
    const durationStr = bookJson.duration;
    if (durationStr) {
      const hours = Number(durationStr.match(/\d+(?=H)/)?.[0] || 0);
      const minutes = Number(durationStr.match(/\d+(?=M)/)?.[0] || 0);
      book.duration = hours * SECONDS_IN_HOUR + minutes * SECONDS_IN_MINUTE;
    }

    return book;
  } catch (err) {
    console.error(`ERROR PARSING AUDIBLE BOOK FROM ASIN: ${asin}`);
    throw err;
  }
}
