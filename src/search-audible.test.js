import searchAudible from "./search-audible";

describe("searchAudible tests", () => {
  test("returns a list of search results", async () => {
    const output = await searchAudible({
      keywords: "Harry Potter",
    });

    console.log(JSON.stringify(output, null, 2));

    expect(output.results.length).toBe(20);
    // expect(book.title).toBe("Harry Potter and the Sorcerer's Stone, Book 1");
    // expect(book.cleanTitle).toBe("Harry Potter and the Sorcerer's Stone");
    // expect(book.description).toBe(
    //   "A global phenomenon and cornerstone of contemporary children’s literature, J.K. Rowling’s Harry Potter series is both universally adored and critically acclaimed. Now, experience the magic as you’ve never heard it before. The inimitable Jim Dale brings to life an entire cast of characters - from the pinched, nasal whine of Petunia Dursley to the shrill huff of the Sorting Hat to the earnest, wondrous voice of the boy wizard himself.\n\nOrphaned as an infant, young Harry Potter has been living a less-than-fortunate life. Belittled by his pompous uncle and sniveling aunt (not to mention his absolute terror of a cousin, Dudley), Harry has resigned himself to a mediocre existence in the cupboard under the stairs. But then the letters start dropping on the doormat at Number Four, Privet Drive. Addressed to “Mr. H. Potter” and stamped shut with a purple wax seal, the peculiar envelopes are swiftly confiscated by his relentlessly cruel family. But nothing stops Rubeus Hagrid, a great beetle-eyed giant of a man, from kicking down the door and bursting in with astonishing news: Harry Potter is a wizard - and not only a wizard, he’s an incredibly famous wizard. Hagrid spirits him away to Hogwarts School of Witchcraft and Wizardry, setting into motion an incredible adventure (Banks run by goblins! Enchanted train platforms! Invisibility Cloaks!) that listeners won’t ever forget.\n\nHaving now become classics of our time, the Harry Potter audiobooks never fail to bring comfort and escapism to listeners of all ages. With its message of hope, belonging, and the enduring power of truth and love, the story of the Boy Who Lived continues to delight generations of new listeners."
    // );
    // expect(book.url).toBe(
    //   "https://www.audible.com/pd/Harry-Potter-and-the-Sorcerers-Stone-Book-1-Audiobook/B017V4IM1G"
    // );
    // expect(book.authors.length).toBe(1);
    // expect(book.authors[0].name).toBe("J. K. Rowling");
  });
});
