import languages from "../data/iso-language-codes";
import { BookLanguage } from "../types";

export const getLanguageByName = (name: string): BookLanguage | null => {
  if (!name) {
    return null;
  }

  const match = languages.find(
    (language) =>
      language.name.toLowerCase() === name.toLowerCase() ||
      language.nativeName.toLowerCase() === name.toLowerCase()
  );

  if (match) {
    const langauge: BookLanguage = {
      name: match.name,
      iso639_1: match.iso639_1,
      iso639_2_T: match.iso639_2_T,
      iso639_2_B: match.iso639_2_B,
      iso639_3: match.iso639_3,
    };

    return langauge;
  }

  return null;
};

export const parseLanguage = (
  lang: string | undefined
): BookLanguage | null => {
  if (!lang || typeof lang !== "string") {
    return null;
  }

  let match;

  if (lang.length === 2) {
    match = languages.find(
      (language) => language.iso639_1 === lang.toLowerCase()
    );
  }

  if (!match && lang.length === 3) {
    match = languages.find(
      (language) =>
        language.iso639_2_T === lang.toLowerCase() ||
        language.iso639_2_B === lang.toLowerCase() ||
        language.iso639_2_B === lang.toLowerCase()
    );
  }

  if (!match) {
    match = languages.find(
      (language) =>
        language.name.toLowerCase() === lang.toLowerCase() ||
        language.nativeName.toLowerCase() === lang.toLowerCase()
    );
  }

  if (match) {
    const langauge: BookLanguage = {
      name: match.name,
      iso639_1: match.iso639_1,
      iso639_2_T: match.iso639_2_T,
      iso639_2_B: match.iso639_2_B,
      iso639_3: match.iso639_3,
    };

    return langauge;
  }

  return null;
};
