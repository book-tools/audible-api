import languages from "../data/iso-language-codes";

export const getLanguageByName = (name) => {
  if (!name) {
    return null;
  }

  const match = languages.find(
    (language) =>
      language.name.toLowerCase() === name.toLowerCase() ||
      language.nativeName.toLowerCase() === name.toLowerCase()
  );

  if (match) {
    return {
      name: match.name,
      iso639_1: match.iso639_1,
      iso639_2: match.iso639_2_T,
    };
  }

  return null;
};

export const getLanguageByIso1 = (code) => {
  if (!code) {
    return null;
  }

  const match = languages.find(
    (language) => language.iso639_1 === code.toLowerCase()
  );

  if (match) {
    return {
      name: match.name,
      iso639_1: match.iso639_1,
      iso639_2: match.iso639_2_T,
    };
  }

  return null;
};

export const parseLanguage = (lang) => {
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
    return {
      name: match.name,
      iso639_1: match.iso639_1,
      iso639_2: match.iso639_2_T,
    };
  }

  return null;
};
