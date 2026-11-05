const router = require("express").Router();
const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); // protect runs first, then getMe

module.exports = router;