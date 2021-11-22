/* eslint-disable no-param-reassign */
import { load as loadPage } from "cheerio";
// @ts-ignore
import dJSON from "dirty-json";
import fetch from "node-fetch";
import { URL } from "url";
import { siteCountries } from "./data/audible-search-fields";
import { Book, Creator, Series } from "./types";
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
 * Get extended information about the author from their Audible URL
 *
 * @param {Creator} author An initial object of the creator to extend (reuired url)
 * @returns {Creator} An extended object of information about the author
 */
async function parseAuthorInfo(author: Creator): Promise<Creator> {
  try {
    if (!author.url) {
      return author;
    }

    const res = await fetch(author.url);
    const body = await res.text();

    const page = loadPage(body);

    let ldJsonList: any[] = [];
    page('script[type="application/ld+json"]').each((i, elSel) => {
      // Use dirty-json because the description section has line breaks instead of \n characters like it should
      const jsonObj = dJSON.parse(page(elSel).text());
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

    const newAuthor: Creator = { ...author };

    // Get author's name
    newAuthor.name = authorJson?.name || newAuthor.name;

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

type Options = {
  site?: string;
  getAuthors?: boolean;
};

/**
 * Get all Audible details about an Audiobook from its ASIN
 *
 * @param {string} asin Amazon Standard Identification Number, Amazon's unique ID that they assign to all of their products
 * @param {object} opts The optional arguments
 * @param {string} [opts.site=us] The audible site locality to get the book data from — Default: `us` | Options: `us`, `ca`, `gb`, `au`, `fr`, `de`, `it`
 * @param {boolean} [opts.getAuthors=false] Whether or not to get the full author information for each author.  This will add the author's bio and photo urls but it will take more time as their page must be pulled and parsed
 * @returns {Book} The parsed book data
 */
export default async function getAudibleBook(asin: string, opts: Options = {}) {
  try {
    const site = opts.site || "us";
    const getAuthors = opts.getAuthors || false;

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
    const book: Book = {
      url: page('link[rel="canonical"]').attr("href"),
      authors: [],
      narrators: [],
    };

    // Get Authors
    page(".authorLabel a", main).each((i, elSel) => {
      const el = page(elSel);

      const newAuthor: Creator = {
        name: el.text().trim(),
      };

      const authorUrlPath = el.attr("href");
      if (authorUrlPath) {
        newAuthor.url = cleanUrl(new URL(authorUrlPath, baseUrl).href);
      }

      book.authors.push(newAuthor);
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

      const newNarrator: Creator = {
        name: el.text().trim(),
      };

      const narratorUrlPath = el.attr("href");
      if (narratorUrlPath) {
        newNarrator.url = cleanNarratorUrl(
          new URL(narratorUrlPath, baseUrl).href
        );
      }

      book.narrators.push(newNarrator);
    });

    // Get series and series part
    try {
      const series: Series[] = [];

      page(".seriesLabel a", main).each((i, elSel) => {
        const el = page(elSel);

        const newSeries: Series = {
          name: el.text().trim(),
        };

        const seriesUrlPath = el.attr("href");
        if (seriesUrlPath) {
          newSeries.url = cleanUrl(new URL(seriesUrlPath, baseUrl).href);
        }

        series.push(newSeries);
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
      // console.warn(`ERROR PARSING AUDIBLE SERIES'\n${err.stack}`);
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

    let ldJsonList: any[] = [];
    page('script[type="application/ld+json"]').each((i, elSel) => {
      let jsonObj;
      try {
        jsonObj = JSON.parse(page(elSel).text());
      } catch (err) {
        jsonObj = dJSON.parse(page(elSel).text());
      }
      ldJsonList.push(jsonObj);
    });
    ldJsonList = ldJsonList.flat();

    // parse useful ld+json from the dom of the page

    // "@type": "BreadcrumbList"
    const breadcrumbJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "BreadcrumbList"
    );

    if (breadcrumbJson) {
      // Get Genres
      if (breadcrumbJson) {
        book.genres = breadcrumbJson.itemListElement
          .slice(1)
          .map((breadcrumb: any) => ({
            name: breadcrumb.item.name,
            url: `${baseUrl}${breadcrumb.item["@id"]}`,
          }));
      }
    }

    // "@type": "Product"
    const productJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "Product"
    );

    if (productJson) {
      // Get ASIN
      book.asin = productJson.productID;
      // Get SKU
      book.sku = productJson.sku;
    }

    // "@type": "Audiobook"
    const bookJson = ldJsonList.find(
      (jsonItem) => jsonItem["@type"] === "Audiobook"
    );

    if (bookJson) {
      // Get title
      book.title = bookJson.name;
      // Get clean title, without series part ("Book N") or "(Unabridged)"
      book.cleanTitle = cleanTitle(bookJson.name);
      // Get Publisher
      book.publisher = bookJson.publisher;
      // Get language and language codes
      const language = getLanguageByName(bookJson.inLanguage);
      if (language) {
        book.language = language;
      }
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
      // Get Abridgement
      book.isAbridged = bookJson.abridged === "true";
      // Get duration in seconds
      const durationStr = bookJson.duration;
      if (durationStr) {
        const hours = Number(durationStr.match(/\d+(?=H)/)?.[0] || 0);
        const minutes = Number(durationStr.match(/\d+(?=M)/)?.[0] || 0);
        book.duration = hours * SECONDS_IN_HOUR + minutes * SECONDS_IN_MINUTE;
      }
      // Get cover image URL
      book.coverUrl = bookJson.image;
    }

    return book;
  } catch (err) {
    console.error(`ERROR PARSING AUDIBLE BOOK FROM ASIN: ${asin}`);
    throw err;
  }
}
