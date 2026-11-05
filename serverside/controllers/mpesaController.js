const Book = require("../models/Book");
const Order = require("../models/Order");
const { sendStkPush, queryStkStatus, formatPhone } = require("../services/mpesa");

// 1. The customer clicks "Pay": start the payment
exports.pay = async (req, res) => {
  try {
    const { bookId, phone } = req.body;

    const formatted = formatPhone(phone);
    if (!formatted) {
      return res.status(400).json({ message: "Enter a valid phone number, e.g. 0712345678" });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // the price comes from OUR database, never from the browser
    const order = await Order.create({
      user: req.user._id,
      book: book._id,
      amount: book.price,
      phone: formatted,
    });

    const result = await sendStkPush(formatted, book.price);

    if (result.ResponseCode !== "0") {
      order.status = "failed";
      order.failReason = result.errorMessage || result.CustomerMessage || "Could not start payment";
      await order.save();
      return res.status(400).json({ message: order.failReason });
    }

    order.checkoutRequestId = result.CheckoutRequestID;
    await order.save();

    res.status(201).json({ orderId: order._id });
  } catch (err) {
    console.error("Pay error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Safaricom calls this with the result (half 2 of the flow)
exports.callback = async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: "Accepted" }); // acknowledge first, work after

  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return;

    const order = await Order.findOne({ checkoutRequestId: cb.CheckoutRequestID });
    if (!order) return;

    if (cb.ResultCode === 0) {
      const items = cb.CallbackMetadata?.Item || [];
      order.mpesaReceipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
      order.status = "paid";
    } else if (order.status === "pending") {
      order.status = "failed";
      order.failReason = cb.ResultDesc;
    }
    await order.save();
  } catch (err) {
    console.error("Callback error:", err.message);
  }
};

// 3. The page asks "is my order paid yet?"
exports.getStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // safety net: if the callback hasn't arrived after 30s, ask Safaricom directly
    const ageSeconds = (Date.now() - order.createdAt.getTime()) / 1000;
    if (order.status === "pending" && order.checkoutRequestId && ageSeconds > 30) {
      try {
        const q = await queryStkStatus(order.checkoutRequestId);
        if (q.ResultCode !== undefined) {          // undefined = still being processed
          if (String(q.ResultCode) === "0") {
            order.status = "paid";
          } else {
            order.status = "failed";
            order.failReason = q.ResultDesc;
          }
          await order.save();
        }
      } catch (err) {
        // query failed: stay pending, the callback may still arrive
      }
    }

    res.json({
      status: order.status,
      mpesaReceipt: order.mpesaReceipt,
      failReason: order.failReason,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};