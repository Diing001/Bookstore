const router = require("express").Router();
const { getBooks, searchBooks } = require("../controllers/bookController");
const protect = require("../middlewares/authMiddleware");

router.get("/search", protect, searchBooks);
router.get("/", protect, getBooks);


module.exports = router;