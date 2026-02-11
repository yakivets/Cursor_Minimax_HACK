const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding the Lore Echo library...\n");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "reader@loreecho.com" },
    update: {},
    create: {
      name: "Demo Reader",
      email: "reader@loreecho.com",
      password: hashedPassword,
    },
  });
  console.log(`📚 Created user: ${user.name} (${user.email})`);

  // Seed books with characters
  const booksData = [
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      description: "A classic tale of love and misunderstanding in Regency-era England.",
      analysis: "A witty exploration of social class, marriage, and the dangers of hasty judgment in early 19th-century English society.",
      characters: [
        {
          name: "Elizabeth Bennet",
          description: "The intelligent, witty second daughter of the Bennet family. Sharp-tongued and independent-minded.",
          personality: "Witty and quick with words, Elizabeth speaks with confident intelligence and playful irony. She is forthright in her opinions, occasionally sharp, but always warm beneath her arch exterior. She uses precise, elegant language with a hint of gentle mockery.",
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel — female hero
        },
        {
          name: "Mr. Darcy",
          description: "A wealthy, proud gentleman from Derbyshire. Tall, handsome, and initially aloof.",
          personality: "Reserved and formal in speech, Darcy chooses his words carefully. He speaks with quiet authority and precision, often seeming cold but revealing deep feeling when pressed. His speech is measured, dignified, and occasionally stiff.",
          voiceId: "ODq5zmih8GrVes37Dizd", // Patrick — male charming
        },
        {
          name: "Mr. Bennet",
          description: "The sardonic, bookish father of the Bennet family who retreats to his library.",
          personality: "Dry, sarcastic humor defines Mr. Bennet's speech. He delights in absurdity and often makes wry observations about human folly. His tone is detached and amused, treating life's chaos as entertainment.",
          voiceId: "VR6AewLTigWG4xSOukaG", // Arnold — male wise
        },
      ],
    },
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      description: "A tale of wealth, love, and the American Dream set in the Jazz Age.",
      analysis: "A haunting portrait of the American Dream's corruption, told through the eyes of an outsider observing the glittering yet hollow world of 1920s New York.",
      characters: [
        {
          name: "Jay Gatsby",
          description: "A mysterious millionaire known for throwing lavish parties in West Egg, Long Island.",
          personality: "Gatsby speaks with rehearsed charm and careful refinement, often using the phrase 'old sport.' His speech alternates between grand optimism and vulnerable longing. There is always something slightly performative yet deeply sincere about his words.",
          voiceId: "ODq5zmih8GrVes37Dizd", // Patrick — male charming
        },
        {
          name: "Nick Carraway",
          description: "The observant narrator from Minnesota, Gatsby's neighbor and Daisy's cousin.",
          personality: "Nick speaks thoughtfully and with measured reserve. He is honest, reflective, and slightly melancholic. His words carry a journalist's precision and a poet's sensitivity to beauty and decay.",
          voiceId: "ErXwobaYiN019PkySvjV", // Antoni — male young
        },
      ],
    },
    {
      title: "Hamlet",
      author: "William Shakespeare",
      description: "The tragedy of the Prince of Denmark, haunted by his father's ghost.",
      analysis: "Shakespeare's most philosophical tragedy, exploring themes of revenge, mortality, madness, and the paralyzing weight of indecision.",
      characters: [
        {
          name: "Hamlet",
          description: "The Prince of Denmark, brooding and intellectual, torn between action and contemplation.",
          personality: "Hamlet speaks with poetic eloquence and biting wit. His language shifts between philosophical meditation, dark humor, and passionate outbursts. He is prone to wordplay, riddles, and theatrical flourishes.",
          voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel — male dark/brooding
        },
        {
          name: "Ophelia",
          description: "A noblewoman of Denmark, daughter of Polonius, who loves Hamlet.",
          personality: "Ophelia speaks gently and with lyrical beauty. Her words are tender and obedient at first, becoming fragmented and haunting as she descends into madness. She often speaks in flowers and songs.",
          voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella — female gentle
        },
      ],
    },
  ];

  for (const bookData of booksData) {
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        analysis: bookData.analysis,
        userId: user.id,
        characters: {
          create: bookData.characters,
        },
      },
      include: { characters: true },
    });
    console.log(`📖 Created "${book.title}" with ${book.characters.length} characters`);
    book.characters.forEach((c) => console.log(`   🎭 ${c.name}`));
  }

  console.log("\n✨ Seeding complete! Login with: reader@loreecho.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
