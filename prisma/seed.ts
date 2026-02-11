import bcrypt from "bcryptjs";
import prisma from "../lib/db";

async function main() {
  console.log("Seeding database...");

  // Create a demo user
  const passwordHash = await bcrypt.hash("demo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@bookalive.com" },
    update: {},
    create: {
      email: "demo@bookalive.com",
      name: "Demo Reader",
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create a sample book
  const book = await prisma.book.upsert({
    where: { title_author: { title: "Pride and Prejudice", author: "Jane Austen" } },
    update: {},
    create: {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      summary:
        "Pride and Prejudice follows the turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner. They must overcome the titular sins of pride and prejudice in order to fall in love and marry.",
      genre: "Classic Romance",
      coverImageUrl: "https://covers.openlibrary.org/b/id/12645114-L.jpg",
      addedById: user.id,
    },
  });

  console.log(`Created book: ${book.title}`);

  // Create sample characters
  const characters = [
    {
      name: "Elizabeth Bennet",
      role: "Protagonist",
      personalityTraits: JSON.stringify([
        "Witty",
        "Independent",
        "Intelligent",
        "Spirited",
        "Perceptive",
      ]),
      speakingStyle:
        "Clever and articulate with a sharp wit. Uses irony and humor freely. Speaks with confidence and doesn't shy from expressing her opinions.",
      background:
        "The second eldest of five sisters in the Bennet family. Known for her quick mind and tendency to judge based on first impressions. Initially dislikes Mr. Darcy due to his apparent pride.",
      relationships: JSON.stringify([
        "Second daughter of Mr. and Mrs. Bennet",
        "Love interest and later wife of Mr. Darcy",
        "Best friend of Charlotte Lucas",
        "Close to her elder sister Jane",
      ]),
    },
    {
      name: "Mr. Darcy",
      role: "Male Lead",
      personalityTraits: JSON.stringify([
        "Proud",
        "Reserved",
        "Loyal",
        "Honorable",
        "Passionate",
      ]),
      speakingStyle:
        "Formal and measured. Chooses words carefully. Can come across as aloof or haughty, but becomes more warm and open with those he trusts.",
      background:
        "A wealthy gentleman from Derbyshire with an estate called Pemberley. Initially appears proud and disdainful to those he meets at the Meryton assembly. His character is deeper than first impressions suggest.",
      relationships: JSON.stringify([
        "Master of Pemberley estate",
        "Falls in love with Elizabeth Bennet",
        "Devoted brother to Georgiana Darcy",
        "Close friend of Charles Bingley",
        "Antagonist to George Wickham",
      ]),
    },
    {
      name: "Jane Bennet",
      role: "Supporting Character",
      personalityTraits: JSON.stringify([
        "Kind",
        "Gentle",
        "Optimistic",
        "Beautiful",
        "Trusting",
      ]),
      speakingStyle:
        "Soft-spoken and always seeking the best in people. Diplomatic and sweet in her expressions. Rarely speaks ill of anyone.",
      background:
        "The eldest Bennet sister, considered the most beautiful. Falls in love with Mr. Bingley. Her gentle nature sometimes leads others to underestimate the depth of her feelings.",
      relationships: JSON.stringify([
        "Eldest Bennet sister",
        "Love interest of Mr. Bingley",
        "Closest to Elizabeth among her sisters",
      ]),
    },
  ];

  for (const char of characters) {
    await prisma.character.upsert({
      where: { bookId_name: { bookId: book.id, name: char.name } },
      update: {},
      create: {
        bookId: book.id,
        ...char,
      },
    });
    console.log(`Created character: ${char.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
