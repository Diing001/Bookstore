require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");
const { embed } = require("./services/embeddings");

const books = [
  { title: "Things Fall Apart", author: "Chinua Achebe", price: 850,
    description: "A novel about Okonkwo, a proud wrestling champion in an Igbo village in Nigeria, and how colonialism and missionaries disrupt his community." },
  { title: "Weep Not, Child", author: "Ngũgĩ wa Thiong'o", price: 900,
    description: "A coming-of-age story about a Kenyan boy who dreams of education during the Mau Mau uprising against colonial rule." },
  { title: "Half of a Yellow Sun", author: "Chimamanda Ngozi Adichie", price: 1200,
    description: "A novel set during the Nigerian civil war, following three people whose lives are changed by the Biafran conflict." },
  { title: "Americanah", author: "Chimamanda Ngozi Adichie", price: 1300,
    description: "A love story about two Nigerians who move abroad, face questions of race and identity, and eventually reunite in Lagos." },
  { title: "Born a Crime", author: "Trevor Noah", price: 1500,
    description: "A funny and moving memoir about growing up mixed-race under apartheid in South Africa, raised by a determined mother." },
  { title: "The Lean Startup", author: "Eric Ries", price: 1400,
    description: "A guide to building a new business by testing ideas quickly with small experiments instead of big upfront plans." },
  { title: "Atomic Habits", author: "James Clear", price: 1600,
    description: "A practical system for building good habits and breaking bad ones through small daily changes." },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to:", mongoose.connection.host);

    for (const book of books) {
      console.log("Embedding:", book.title);
      book.embedding = await embed(`${book.title} by ${book.author}. ${book.description}`);
    }
    console.log("Vector size:", books[0].embedding.length);   // should print 384

    await Book.deleteMany();
    await Book.insertMany(books);
    console.log("Books added");
  } catch (err) {
    console.error("Seed failed:", err.message, err.cause || "");
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

run();