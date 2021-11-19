export const cleanDescription = (description) => {
  if (!description) {
    return null;
  }

  let synopsis = description;
  // Remove any inline tags
  synopsis = synopsis.replace(/<\/?(i|em|u|b|strong)>/gi, "");
  // Remove all empty tags (used for spacing on audible)
  synopsis = synopsis.replace(/<\w+><\/\w+>/g, "");
  // Remove the openings of any block level elements (and surrounding spaces)
  synopsis = synopsis.replace(/\s*<(ul|ol)>\s*/gi, "");
  // Repace the starts/ends of any paragraphs (and surrounding spaces) with a double new line
  synopsis = synopsis.replace(/\s*<\/?p>\s*/gi, "\n\n");
  // Repace the ends of any list elements (and surrounding spaces) with a new line
  synopsis = synopsis.replace(/\s*<\/(ul|ol|li)>\s*/gi, "\n");
  // Repace any break tag (and surrounding spaces) with a new line
  synopsis = synopsis.replace(/ *<br(\s*\/?)?> */gi, "\n");
  // Replace the start of any list items with a bullet character
  synopsis = synopsis.replace(/<li>\s*/gi, " • ");
  // Repace the any instances of 3 or more newline characters with 2 newline characters
  synopsis = synopsis.replace(/\n{3,}/g, "\n\n");
  // Remove any trailing or leading spaces
  synopsis = synopsis.trim();
  return synopsis;
};

export const stripDiacretics = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const removeNonWordChars = (str) => str.replace(/\W+/g, " ");

export const removeSpaces = (str) => str.replace(/\s/g, "");

export const simplify = (str) =>
  removeSpaces(removeNonWordChars(stripDiacretics(str).toLowerCase()));

export const fuzzyMatch = (str1, str2, checkIncludes = false) => {
  const simpleStr1 = simplify(str1);
  const simpleStr2 = simplify(str2);

  return (
    simpleStr1 === simpleStr2 ||
    (checkIncludes &&
      (simpleStr1.includes(simpleStr2) || simpleStr2.includes(simpleStr1)))
  );
};

export const cleanTitle = (title) => {
  if (!title) {
    return title;
  }

  let newTitle = title.trim();

  // If the title ends with a series part, remove it
  // works for "Book 1" and "Book One"
  newTitle = newTitle.replace(/, book [\w\s-]+$/i, "").trim();

  // If the title ends with "unabridged", with or without parenthesis
  // remove them; case insensitive
  newTitle = newTitle.replace(/\(?unabridged\)?$/i).trim();

  // If there are 2 or more spaces in a row, replace them with a single space
  newTitle = newTitle.replace(/\s{2,}/g, " ");

  return newTitle;
};

export const getCopyrightYear = (copyright) => {
  if (!copyright) {
    return "";
  }

  const yearMatch = copyright.match(/\d{4}/);

  if (yearMatch) {
    return yearMatch[0];
  }

  return "";
};

export const checkAuthorOverlap = (authors1, authors2) => {
  for (let i = 0; i < authors1.length; i += 1) {
    for (let j = 0; j < authors2.length; j += 1) {
      if (fuzzyMatch(authors1[i].name, authors2[j].name)) {
        return true;
      }
    }
  }

  return false;
};

export const cleanUrl = (url) => url.replace(/\?.*$/, "").trim();

export const cleanNarratorUrl = (url) => url.replace(/[?&]ref=.*$/, "").trim();
