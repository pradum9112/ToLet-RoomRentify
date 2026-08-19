require("dotenv").config();
const express = require("express");
const Router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");

// Models & Middleware Imports
const Booking = require("../models/Booking.js");
const Payment = require("../models/PaymentModel.js"); // 👈 FIX: Import added here
const fetchUser = require("../middleware/fetchUserFromToken");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ❌ FIX: console.log(razorpay) removed to stop logging keys

////////////////////////////// Create Order //////////////////////////////

Router.post("/create-order", fetchUser, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const amountRupees = Number(booking.price);
    const amountPaise = Math.round(amountRupees * 100);

    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `booking_${bookingId}`,
    });

    const payment = await Payment.create({
      booking: bookingId,
      user: req.userId,
      amount: amountRupees,
      currency: "INR",
      status: "created",
      method: "razorpay_test",
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      bookingId,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
});

////////////////////////////// Verify Payment //////////////////////////////

Router.post("/verify-payment", fetchUser, async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: "paid",
    });

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = Router;
