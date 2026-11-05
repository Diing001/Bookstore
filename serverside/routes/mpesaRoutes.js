const router = require("express").Router();
const { pay, callback, getStatus } = require("../controllers/mpesaController");
const protect = require("../middlewares/authMiddleware");

router.post("/pay", protect, pay);
router.get("/status/:orderId", protect, getStatus);
router.post("/callback", callback);   // NO protect: Safaricom has no token from us

module.exports = router;