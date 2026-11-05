const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    checkoutRequestId: { type: String, index: true }, // links Safaricom's callback to this order
    mpesaReceipt: String,
    failReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);