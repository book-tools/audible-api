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
import { SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from "./utils/time";

const getDurationFromStr = (runtimeStr) => {
  let duration = 0;

  const hoursMatch = runtimeStr.match(/(\d+) hrs/);
  if (hoursMatch) {
    duration += Number(hoursMatch[1]) * SECONDS_IN_HOUR;
  }

  const minutesMatch = runtimeStr.match(/(\d+) mins/);
  if (minutesMatch) {
    duration += Number(minutesMatch[1]) * SECONDS_IN_MINUTE;
  }

  return duration;
};

// eslint-disable-next-line jsdoc/require-jsdoc
export default async function searchAudible({
  keywords,
  title,
  author,
  narrator,
  publisher,
  category,
  isAudibleOriginal,
  isPlusCatalog,
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
