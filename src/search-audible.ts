import { load as loadPage } from "cheerio";
import fetch from "node-fetch";
import { URL, URLSearchParams } from "url";
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
import {
  Book,
  Category,
  Creator,
  Duration,
  SearchLanguage,
  Series,
} from "./types";
import { parseLanguage } from "./utils/language";
import { cleanNarratorUrl, cleanTitle, cleanUrl } from "./utils/string";
import { getDurationFromStr } from "./utils/time";

/**
 * A set of parameters used to search the Audible website
 */
export interface SearchParams {
  /**
   * A general search string
   */
  keywords?: string;
  /**
   * A title of a book to search for
   */
  title?: string;
  /**
   * The name of an author to search for
   */
  author?: string;
  /**
   * The name of a narrator to search for
   */
  narrator?: string;
  /**
   * A publishing company to search for
   */
  publisher?: string;
  /**
   * One of a predefined list of strings representing top level categories on Audible
   */
  category?: Category;
  /**
   * Whether or not to limit the search to Audible Originals
   *
   * @defaultValue `false`
   */
  isAudibleOriginal?: boolean;
  /**
   * Whether or not to limit the search to Audible's Plus Catalog
   *
   * @defaultValue `false`
   */
  isPlusCatalog?: boolean;
  /**
   * A timeframe from a predefined list of when the book was released
   */
  releaseTime?: "soon" | "last30" | "last90";
  /**
   * An array of strings representing the length of time the book can fall into
   *
   * Options: `<1` | `1-3` | `3-6` | `6-10` | `10-20` | `>20`;
   */
  durations?: Duration[];
  /**
   * An array of ISO 639-1 langauges codes to limit the books to from a pre-defined list
   *
   * Options: `en` | `es` | `de` | `fr` | `it` | `pt` | `ja` | `ru` | `af` | `da` | `zh` | `nl`
   */
  languages?: SearchLanguage[];
  /**
   * Whether or not to limit the results to Whisper Sync compatible books
   */
  isWhisperSync?: boolean;
  /**
   * Pass this as either true or false to limit the results to abridged or unabridged books respectively
   */
  isAbridged?: boolean;
  /**
   * The page number of the search results to view
   */
  pageNum?: number;
  /**
   * The number of results to return
   *
   * @defaultValue `20`
   */
  pageSize?: 20 | 30 | 40 | 50;
  /**
   * Whether or not to parse all of the information about each book from the search result, this will take much longer
   *
   * @defaultValue `false`
   */
  getFull?: boolean;
  /**
   * A ISO 3166-1 alpha-2 country code representing the Audible site to search
   *
   * @defaultValue `us`
   */
  site?: "us" | "ca" | "gb" | "au" | "fr" | "de" | "it";
}

type SearchResults = {
  totalResults: number;
  results: Book[];
};

/**
 * Search the Audible website for a list of books matching your search criteria
 *
 * @param options - An object containing your search criteria
 * @returns A promise returning an array of book objects from the search results, along with total results
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
}: SearchParams = {}): Promise<SearchResults> {
  const { url: baseUrl } = siteCountries[site] || siteCountries.us;
  const baseSearchUrl = `${baseUrl}/search`;

  const realPageSize = pageSizes.includes(pageSize) ? pageSize : pageSizes[0];

  const paramsObj: Record<string, string> = {
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
    page: pageNum.toString(),
    pageSize: realPageSize.toString(),
    ipRedirectOverride: "true",
    ...audiobookFormat,
  };

  const params = new URLSearchParams(paramsObj);

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

  let audibleItems: Book[] = [];

  const resultsStr = page(".resultsSummarySubheading").eq(0).text().trim();

  const totalResultsMatch = resultsStr.match(/([0-9,]+) results$/);
  const totalResults = totalResultsMatch ? Number(totalResultsMatch[1]) : 0;

  page(".productListItem").each((i, elSel) => {
    const newBook: Book = {
      title: page("h3", elSel).text().trim(),
      coverUrl: page("img", elSel).attr("data-lazy"),
      authors: [],
      narrators: [],
    };

    // Get book's language
    const newLanguage = parseLanguage(
      page(".languageLabel", elSel).text().replace("Language:", "").trim()
    );
    if (newLanguage) {
      newBook.language = newLanguage;
    }

    // Get book's url
    const urlStr = page("h3 a", elSel).attr("href");
    if (urlStr) {
      newBook.url = cleanUrl(new URL(urlStr, baseUrl).href);
    }

    // Get book's clean title
    if (newBook.title) {
      newBook.cleanTitle = cleanTitle(newBook.title);
    }

    // Get the book's duration
    const runtimeStr = page(".runtimeLabel", elSel).text().trim();
    if (runtimeStr) {
      newBook.duration = getDurationFromStr(runtimeStr);
    }

    // Get the book's ASIN
    const asinMatch = newBook.url?.match(/\/([A-Z0-9]+)$/);
    if (asinMatch) {
      newBook.asin = asinMatch[1];
    }

    // Get the aggregate rating
    const ratingValueStr = page(".ratingsLabel .bc-pub-offscreen", elSel)
      .text()
      .trim();
    const ratingsValueMatch = ratingValueStr.match(/[0-9.]+/);
    const ratingValue = Number(ratingsValueMatch?.[0] || 0);

    const ratingCountStr = page(".ratingsLabel .bc-color-secondary", elSel)
      .text()
      .trim();
    const ratingCountMatch = ratingCountStr.match(/[0-9,]+/);
    const ratingCount = Number(ratingCountMatch?.[0].replace(/,/g, "") || 0);
    newBook.rating = { value: ratingValue, count: ratingCount };

    page(".authorLabel a", elSel).each((ii, authorSel) => {
      const authorEl = page(authorSel);

      const newAuthor: Creator = {
        name: authorEl.text().trim(),
      };

      const authorUrlPath = authorEl.attr("href");
      if (authorUrlPath) {
        newAuthor.url = cleanUrl(new URL(authorUrlPath, baseUrl).href);
      }

      newBook.authors.push(newAuthor);
    });

    page(".authorLabel a", elSel).each((ii, narratorSel) => {
      const narratorEl = page(narratorSel);

      const newNarrator: Creator = {
        name: narratorEl.text().trim(),
      };

      const narratorUrlPath = narratorEl.attr("href");
      if (narratorUrlPath) {
        newNarrator.url = cleanNarratorUrl(
          new URL(narratorUrlPath, baseUrl).href
        );
      }

      newBook.narrators.push(newNarrator);
    });

    // Get series and series part
    try {
      const series: Series[] = [];

      page(".seriesLabel a", elSel).each((iii, seriesSel) => {
        const el = page(seriesSel);

        const newSeries: Series = {
          name: el.text().trim(),
        };

        const seriesUrlPath = el.attr("href");
        if (seriesUrlPath) {
          newSeries.url = cleanUrl(new URL(seriesUrlPath, baseUrl).href);
        }

        series.push(newSeries);
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
      audibleItems.map((book) =>
        book.asin ? getAudibleBook(book.asin, { site }) : book
      )
    );
  }

  // console.log(JSON.stringify(audibleItems, null, 2));

  const searchResults: SearchResults = {
    totalResults,
    results: audibleItems,
  };

  return searchResults;
}
