import { load as loadPage } from "cheerio";
import fetch from "node-fetch";
import {
  abridged,
  audibleOriginal,
  audiobookFormat,
  pageSizes,
  plusCatalog,
  releaseTimes,
  searchCategories,
  searchDurations,
  searchLanguages,
  siteCountries,
  unabridged,
  whispersync,
} from "./data/audible-search-fields";
import getAudibleBook from "./get-audible-book";
import { parseLanguage } from "./utils/language";
import { cleanNarratorUrl, cleanUrl } from "./utils/string";
import { getDurationFromStr } from "./utils/time";

/**
 * An object representing the genres a book is a part of
 *
 * @typedef {object} Genre
 * @property {string} name Audible's name for the genre
 * @property {string} url The Audible link for the genre's page
 */

/**
 * An object representing the price range of the book
 *
 * @typedef {object} Price
 * @property {number} low The lowest price a book has been sold at
 * @property {number} high The highest price a book has been sold at
 * @property {string} currency The code for the currency that the `low` and `high` represent
 */

/**
 * An object representing the aggregate rating of the book
 *
 * @typedef {object} Rating
 * @property {number} value The average user rating of the book
 * @property {number} count The total number of ratings the book has received
 */

/**
 * An object representing the language the book is read in, with its name and ISO 639 language codes
 *
 * @typedef {object} Language
 * @property {string} name The name of the language written with Latin characters
 * @property {string} iso639_1 The ISO 639-1 code for the language - https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 * @property {string} iso639_2_T The ISO 639-2-T code for the language - https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
 * @property {string} iso639_2_B The ISO 639-2-B code for the language - https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
 * @property {string} iso639_3 The ISO 639-3 code for the language - https://en.wikipedia.org/wiki/List_of_ISO_639-3_codes
 */

/**
 * An object representing a book's place in a series
 *
 * @typedef {object} Series
 * @property {string} name The name of the series
 * @property {string} url The Audible link to the full series listing
 * @property {number} part The book's place in the order of the series
 */

/**
 * A creator of the audiobook, either Author or Narrator
 *
 * @typedef {object} Creator
 * @property {string} id Amazon's unique identifier for the creator (only applies to author)
 * @property {string} name The creator's name
 * @property {string} bio A description of the creator
 * @property {string} url The Audible URL of the creator's page with photo and bio
 * @property {string} imageUrl A full resolution photo of the creator
 * @property {string} thumbnailImageUrl A small resolution thumbnail of the creator's photo (usually 120x120)
 */

/**
 * An object representing the complete details of an audible audiobook
 *
 * @typedef {object} Book
 * @property {string} asin "Amazon Standard Identification Number" for the book
 * @property {string} sku Amazon's "Stock Keeping Unit" for the book
 * @property {string} url The Audible link where you can view the book
 * @property {string} title Audible's full title for the book
 * @property {Date} datePublished The date the book was published
 * @property {string} cleanTitle A simplified version of the title with extra information removed
 * @property {string} description Audible's description for the book with the HTML tags removed
 * @property {Creator[]} authors A list of author's given credit for writing the book
 * @property {Creator[]} narrators A list of narrators's given credit for reading the book
 * @property {string} publisher The publishing company for the audiobook
 * @property {string} copyright The copyright statement for the book
 * @property {string} copyrightYear The year the original book was copyrighted
 * @property {Series[]} series The series' that the book is a part of on Audible
 * @property {boolean} isAbridged Whether or not the book is an abridged version
 * @property {string} coverUrl A link to a full sized image of the book's cover
 * @property {Genre[]} genres An array of genres the book is a part of
 * @property {Price} price The price range the book has been sold for
 * @property {Rating} rating The aggregate user rating of the book
 * @property {Language} language An object representing the language the book is read in
 */

/**
 * Search the Audible website for a list of books matching your search criteria
 *
 * @param {object} options An object containing your search criteria
 * @param {string} options.keywords A general search string
 * @param {string} options.title A title of a book to search for
 * @param {string} options.author The name of an author to search for
 * @param {string} options.narrator The name of a narrator to search for
 * @param {string} options.publisher A publishing company to search for
 * @param {string} options.category One of a predefined list of strings representing top level categories on Audible
 * @param {boolean} [options.isAudibleOriginal=false] Whether or not to limit the search to Audible Originals
 * @param {boolean} [options.isPlusCatalog=false] whether or not to limit the search to Audible's Plus Catalog
 * @param {string} options.releaseTime A timeframe from a predefined list of when the book was released
 * @param {string[]} options.durations An array of strings representing the length of time the book can fall into
 * @param {string[]} options.languages An array of ISO 639-1 langauges codes to limit the books to from a pre-defined list
 * @param {boolean} [options.isWhisperSync=false] Whether or not to limit the results to Whisper Sync compatible books
 * @param {boolean} options.isAbridged Pass this as either true or false to limit the results to abridged or unabridged books respectively
 * @param {number} options.pageNum The page number of the search results to view
 * @param {number} options.pageSize The number of results to return — `20`, `30`, `40`, or `50` — Default: `20`
 * @param {boolean} [options.getFull=false] Whether or not to parse all of the information about each book from the search result, this will take much longer
 * @param {string} [options.site="us"] A ISO 3166-1 alpha-2 country code representing the Audible site to search — `us`, `ca`, `gb`, `au`, `fr`, `de`, `it` — Default: `us`
 * @returns {Book[]} An array of book objects from the search results
 */
export default async function searchAudible({
  keywords,
  title,
  author,
  narrator,
  publisher,
  category,
  isAudibleOriginal = false,
  isPlusCatalog = false,
  releaseTime,
  durations = [],
  languages = [],
  isWhisperSync = false,
  isAbridged,
  pageNum = 1,
  pageSize = 20,
  getFull = false,
  site = "us",
} = {}) {
  const {
    url: baseUrl,
    // language: siteLanguage,
  } = siteCountries[site] || siteCountries.us;
  const baseSearchUrl = `${baseUrl}/search`;

  const realPageSize = pageSizes.includes(pageSize) ? pageSize : pageSizes[0];

  const params = new URLSearchParams({
    ...(title && { title }),
    ...(keywords && { keywords }),
    ...(author && { searchAuthor: author }),
    ...(narrator && { narrator }),
    ...(publisher && { publisher }),
    ...(isAbridged === true && abridged),
    ...(isAbridged === false && unabridged),
    ...(isAudibleOriginal && audibleOriginal),
    ...(isPlusCatalog && plusCatalog),
    ...(isWhisperSync && whispersync),
    page: pageNum,
    pageSize: realPageSize,
    ipRedirectOverride: true,
    ...audiobookFormat,
  });

  if (releaseTime && releaseTimes[releaseTime]) {
    params.append("publication_date", releaseTimes[releaseTime]);
  }

  if (category && searchCategories[category]) {
    params.append("node", searchCategories[category]);
  }

  durations.forEach((duration) => {
    if (searchDurations[duration]) {
      params.append("feature_seven_browse-bin", searchDurations[duration]);
    }
  });

  languages.forEach((lang) => {
    const langCode = searchLanguages[lang.toLowerCase()];
    if (langCode) {
      params.append("feature_six_browse-bin", langCode);
    }
  });

  const searchUrl = `${baseSearchUrl}?${params.toString()}`;

  const res = await fetch(searchUrl);
  const body = await res.text();
  const page = loadPage(body);

  let audibleItems = [];

  const resultsStr = page(".resultsSummarySubheading").eq(0).text().trim();
  const totalResults = Number(resultsStr.match(/([0-9,]+) results$/)[1]) || 0;

  page(".productListItem").each((i, elSel) => {
    const newBook = {
      title: page("h3", elSel).text().trim(),
      coverUrl: page("img", elSel).attr("data-lazy"),
      language: parseLanguage(
        page(".languageLabel", elSel).text().replace("Language:", "").trim()
      ),
      authors: [],
      narrators: [],
      url: cleanUrl(new URL(page("h3 a", elSel).attr("href"), baseUrl).href),
    };

    const runtimeStr = page(".runtimeLabel", elSel).text().trim();
    newBook.duration = getDurationFromStr(runtimeStr);

    newBook.asin = newBook.url.match(/\/([A-Z0-9]+)$/)[1];

    try {
      const ratingValueStr = page(".ratingsLabel .bc-pub-offscreen", elSel)
        .text()
        .trim();
      const ratingValue = Number(ratingValueStr.match(/[0-9.]+/)[0]);

      const ratingCountStr = page(".ratingsLabel .bc-color-secondary", elSel)
        .text()
        .trim();
      const ratingCount = Number(
        ratingCountStr.match(/[0-9,]+/)[0].replace(/,/g, "")
      );
      newBook.rating = { value: ratingValue, count: ratingCount };
    } catch (err) {
      // Do Nothing
    }

    page(".authorLabel a", elSel).each((ii, authorSel) => {
      const authorEl = page(authorSel);
      newBook.authors.push({
        name: authorEl.text().trim(),
        url: cleanUrl(new URL(authorEl.attr("href"), baseUrl).href),
      });
    });

    page(".authorLabel a", elSel).each((ii, narratorSel) => {
      const narratorEl = page(narratorSel);
      newBook.narrators.push({
        name: narratorEl.text().trim(),
        url: cleanNarratorUrl(new URL(narratorEl.attr("href"), baseUrl).href),
      });
    });

    // Get series and series part
    try {
      const series = [];

      page(".seriesLabel a", elSel).each((iii, seriesSel) => {
        const el = page(seriesSel);

        series.push({
          name: el.text().trim(),
          url: cleanUrl(new URL(el.attr("href"), baseUrl).href),
        });
      });

      const seriesArr = page(".seriesLabel", elSel)
        .text()
        .replace(/\n/g, "")
        .trim()
        // remove the beginning text from the series
        .replace("Series: ", "")
        .split(", ")
        .map((item) => item.trim());

      seriesArr.forEach((seriesStr, seriesI) => {
        if (seriesStr.includes("Book")) {
          const seriesPart = Number(seriesStr.replace("Book ", ""));
          if (seriesPart) {
            const matchingBookIndex = series.findIndex(
              (item) => item.name === seriesArr[seriesI - 1]
            );
            if (matchingBookIndex > -1) {
              series[matchingBookIndex].part = seriesPart;
            }
          }
        }
      });

      newBook.series = series;
    } catch (err) {
      // console.warn(`ERROR PARSING AUDIBLE SERIES'\n${err.stack}`);
    }

    audibleItems.push(newBook);
  });

  if (getFull) {
    audibleItems = await Promise.all(
      audibleItems.map(({ asin }) => getAudibleBook(asin, { site }))
    );
  }

  // console.log(JSON.stringify(audibleItems, null, 2));

  return {
    totalResults,
    results: audibleItems,
  };
}
