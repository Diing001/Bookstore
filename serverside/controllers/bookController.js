const Book = require("../models/Book");
const { embed } = require("../services/embeddings");

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const MIN_SIMILARITY = 0.2;   // starting guess; tune it by trying queries

exports.searchBooks = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ message: "Type something to search" });

    const queryVector = await embed(q);

    const results = await Book.aggregate([
      {
        $vectorSearch: {
          index: "book_vector_index",   // must match the index name in Atlas
          path: "embedding",
          queryVector,
          numCandidates: 50,
          limit: 5,
        },
      },
      {
        $project: {
          title: 1,
          author: 1,
          price: 1,
          description: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const books = results
      .map((b) => ({ ...b, score: b.score * 2 - 1 }))   // undo Atlas's 0–1 rescaling → plain cosine
      .filter((b) => b.score >= MIN_SIMILARITY);

    res.json(books);
  } catch (err) {
    console.error("Search error:", err.message, err.cause || "");
    res.status(500).json({ message: "Search failed" });
  }
};