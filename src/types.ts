export type SearchLanguage =
  | "en"
  | "es"
  | "de"
  | "fr"
  | "it"
  | "pt"
  | "ja"
  | "ru"
  | "af"
  | "da"
  | "zh"
  | "nl";

export enum SearchLanguages {
  EN = "en",
  ES = "es",
  DE = "de",
  FR = "fr",
  IT = "it",
  PT = "pt",
  JA = "ja",
  RU = "ru",
  AF = "af",
  DA = "da",
  ZH = "zh",
  NL = "nl",
}

export type Category =
  | "artsAndEntertainment"
  | "biographiesAndMemoirs"
  | "businessAndCareers"
  | "childrensAudiobooks"
  | "computersAndTechnology"
  | "educationAndLearning"
  | "erotica"
  | "heathAndWellness"
  | "history"
  | "homeAndGarden"
  | "lgbtq"
  | "literatureAndFiction"
  | "moneyAndFinance"
  | "mysteryThrillerAndSuspense"
  | "politicsAndSocialSciences"
  | "relationshipsParentingAndPersonalDevelopment"
  | "religionAndSpirituality"
  | "romance"
  | "scienceAndEngineering"
  | "scienceFictionAndFantasy"
  | "sportsAndOutdoors"
  | "teenAndYoungAdult"
  | "travelAndTourism";

export type Duration = "<1" | "1-3" | "3-6" | "6-10" | "10-20" | ">20";

/**
 * An object representing a genre that the book is classified under on Audible
 *
 * @example
 * ```ts
 * const genre: Genre = {
 *   name: "Children's Audiobooks",
 *   url: "https://www.audible.com/cat/Childrens-Audiobooks-Audiobooks/18572091011",
 * }
 * ```
 */
export interface Genre {
  /**
   * Audible's name for the genre
   */
  name: string;
  /**
   * The Audible link for the genre's page
   */
  url: string;
}

/**
 * An object representing the price range of the book
 *
 * @example
 * ```ts
 * const price: Price = {
 *   low: 14.95,
 *   high: 29.99,
 *   currency: "USD",
 * }
 * ```
 */
export type Price = {
  /**
   * The lowest price a book has been sold at
   */
  low: number;
  /**
   * The highest price a book has been sold at
   */
  high: number;
  /**
   * The code for the currency that the `low` and `high` represent
   */
  currency?: string;
};

/**
 * An object representing the aggregate rating of the book
 *
 * @example
 * ```ts
 * const rating: Rating = {
 *   value: 4.905927897411082,
 *   count: 144655,
 * }
 * ```
 */
export interface Rating {
  /**
   * The average user rating of the book
   */
  value: number;
  /**
   * The total number of ratings the book has received represented by an integer
   */
  count: number;
}

/**
 * An object representing the language the book is read in, with its name and ISO 639 language codes
 *
 * @example
 * ```ts
 * const language: BookLanguage = {
 *   name: "English",
 *   iso639_1: "en",
 *   iso639_2_T: "eng",
 *   iso639_2_B: "eng",
 *   iso639_3: "eng",
 * }
 * ```
 */
export interface BookLanguage {
  /**
   * The name of the language written with Latin characters
   */
  name: string;
  /**
   * The [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for the language
   */
  iso639_1: string;
  /**
   * The [ISO 639-2-T code](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) for the language
   */
  iso639_2_T: string;
  /**
   * The [ISO 639-2-B code](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) for the language
   */
  iso639_2_B: string;
  /**
   * The [ISO 639-3 code](https://en.wikipedia.org/wiki/List_of_ISO_639-3_codes) for the language
   */
  iso639_3: string;
}

/**
 * An object representing a book's place in a series
 *
 * @example
 * ```ts
 * const series: Series = {
 *   name: "Harry Potter",
 *   url: "https://www.audible.com/series/Harry-Potter-Audiobooks/B0182NWM9I",
 *   part: 1,
 * }
 * ```
 */
export interface Series {
  /**
   * The name of the series
   */
  name: string;
  /**
   * The Audible link to the full series listing
   */
  url?: string;
  /**
   * The book's place in the order of the series
   */
  part?: number;
}

/**
 * A creator of the audiobook, either Author or Narrator
 *
 * @example
 * ```ts
 * const author: Creator = {
 *   {
 *     "name": "J. K. Rowling",
 *     "url": "https://www.audible.com/author/J-K-Rowling/B000AP9A6K",
 *     "id": "B000AP9A6K",
 *     "bio": "J.K. Rowling is best-known as the author of the seven Harry Potter books, which were published between 1997 and 2007. The enduringly popular adventures of Harry, Ron and Hermione have gone on to sell over 500 million copies, be translated into over 80 languages and made into eight blockbuster films. \n\nAlongside the Harry Potter series, J.K. Rowling also wrote three short companion volumes for charity: Quidditch Through the Ages and Fantastic Beasts and Where to Find Them, in aid of Comic Relief, and The Tales of Beedle the Bard, in aid of Lumos.  The companion books and original series are all available as audiobooks.\n\nIn 2016, J.K. Rowling collaborated with playwright Jack Thorne and director John Tiffany to continue Harry’s story in a stage play, Harry Potter and the Cursed Child, which opened in London, followed by the USA and Australia. \n\nIn the same year, she made her debut as a screenwriter with the film Fantastic Beasts and Where to Find Them.  Inspired by the original companion volume, it was the first in a series of new adventures featuring wizarding world magizoologist Newt Scamander.  The second, Fantastic Beasts: The Crimes of Grindelwald, was released in 2018.   \n\nBoth the screenplays, as well as the script of Harry Potter and the Cursed Child, are also available as books.\n\nFans of Fantastic Beasts and Harry Potter can find out more at www.wizardingworld.com.\n\nJ.K. Rowling also writes novels for adults. The Casual Vacancy was published in 2012 and adapted for television in 2015.  Under the pseudonym Robert Galbraith, she is the author of the highly acclaimed ‘Strike’ crime series, featuring private detective Cormoran Strike and his partner Robin Ellacott.  The first of these, The Cuckoo’s Calling, was published to critical acclaim in 2013, at first without its author’s true identity being known.   The Silkworm followed in 2014, Career of Evil in 2015 and Lethal White in 2018.  All four books have been adapted for television by the BBC and HBO.  The fifth book, Troubled Blood, is now out and was also an instant bestseller.  \n\nJ.K. Rowling’s 2008 Harvard Commencement speech was published in 2015 as an illustrated book, Very Good Lives: The Fringe Benefits of Failure and the Importance of Imagination, sold in aid of Lumos and university-wide financial aid at Harvard.\n\nIn 2020, J.K. Rowling released in free online instalments, The Ickabog, an original fairy tale, which she wrote over ten years ago as a bedtime story for her younger children.  She decided to share the personal family favourite to help entertain children, parents and carers confined at home during the Covid-19 lockdown. \n\nThe story is now published as a book (hardback, ebook and audio) in the English language, and is translated into 26 languages, each edition with its own unique illustrations by children.  J.K. Rowling is donating her royalties from The Ickabog to her charitable trust, The Volant Charitable Trust, to assist vulnerable groups who have been particularly impacted by the Covid-19 pandemic in the UK and internationally.\n\nAs well as receiving an OBE and Companion of Honour for services to children’s literature, J.K. Rowling has received many other awards and honours, including France’s Legion d’Honneur, Spain’s Prince of Asturias Award and Denmark’s Hans Christian Andersen Award.\n\n\nwww.jkrowling.com\n\nImage:  Photography Debra Hurford Brown © J.K. Rowling 2018",
 *     "imageUrl": "https://images-na.ssl-images-amazon.com/images/S/amzn-author-media-prod/fvh43djng407r1iq142ng0sk5f.jpg"
 *     "thumbnailImageUrl": "https://images-na.ssl-images-amazon.com/images/S/amzn-author-media-prod/pkhkqpju402jii5i53t7vru84r._UX250.__01_SX120_CR0,0,120,120__.jpg",
 *   }
 * }
 * ```
 */
export interface Creator {
  /**
   * The creator's name
   */
  name: string;
  /**
   * The Audible URL of the creator's page with photo and bio
   */
  url?: string;
  /**
   * Amazon's unique identifier for the creator (Author only)
   */
  id?: string;
  /**
   * A description of the creator with HTML tags stripped (Author only)
   */
  bio?: string;
  /**
   * A full resolution photo of the creator (Author only)
   */
  imageUrl?: string;
  /**
   * A small resolution thumbnail of the creator's photo (usually 120x120) (Author only)
   */
  thumbnailImageUrl?: string;
}

/**
 * An object representing the complete details of an audible audiobook
 */
export type Book = {
  /**
   * "Amazon Standard Identification Number" for the book
   */
  asin?: string;
  /**
   * Amazon's "Stock Keeping Unit" for the book
   */
  sku?: string;
  /**
   * The Audible link where you can view the book
   */
  url?: string;
  /**
   * Audible's full title for the book
   */
  title?: string;
  /**
   * A simplified version of the title with extra information removed
   *
   * Removed information includes the terms abridged/unabridged, and the book number
   */
  cleanTitle?: string;
  /**
   * The date the book was published
   */
  datePublished?: Date;
  /**
   * Audible's description for the book with the HTML tags removed
   */
  description?: string;
  /**
   * A list of author's given credit for writing the book
   */
  authors: Creator[];
  /**
   * A list of narrators's given credit for reading the book
   */
  narrators: Creator[];
  /**
   * The publishing company for the audiobook
   */
  publisher?: string;
  /**
   * The copyright statement for the book
   */
  copyright?: string;
  /**
   * The year the original book was copyrighted
   */
  copyrightYear?: string;
  /**
   * The series' that the book is a part of on Audible
   */
  series?: Series[];
  /**
   * Whether or not the book is an abridged version
   */
  isAbridged?: boolean;
  /**
   * A link to a full sized image of the book's cover
   */
  coverUrl?: string;
  /**
   * An array of genres the book is a part of
   */
  genres?: Genre[];
  /**
   * The price range the book has been sold for
   */
  price?: Price;
  /**
   * The aggregate user rating of the book
   */
  rating?: Rating;
  /**
   * An object representing the language the book is read in
   */
  language?: BookLanguage;
  /**
   * The total length of the book in seconds
   */
  duration?: number;
};
