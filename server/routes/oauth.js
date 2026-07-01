require("dotenv").config();
const express = require("express");
const Router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const Mailer = require("./Mailer");

Router.post(
  "/google/signup",
  [
    body("googleId", "Enter a valid googleID").isLength({ min: 15 }),
    body("email", "Enter a valid email address").isEmail(),
    body("phone", "Enter a valid 10-digit phone number").isLength({ min: 10, max: 10 }).isNumeric(),
    body("fname", "First name must be at least 2 characters").isLength({ min: 2 }),
    body("lname", "Last name must be at least 2 characters").isLength({ min: 2 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      // Check if user already exists
      let existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists. Please login.",
        });
      }

      const fullname = `${req.body.fname} ${req.body.lname}`;

      const user = await User.create({
        firstName: req.body.fname,
        lastName: req.body.lname,
        username: fullname,
        email: req.body.email,
        phone: req.body.phone,
        password: null,
        googleId: req.body.googleId,        // ← String mein rakha
      });

      const payload = { user: { id: user.id } };
      const authToken = jwt.sign(payload, JWT_SECRET);

      // Send Welcome Email
      const msg = `Dear ${fullname},<br><br>
                   Congratulations on joining us!<br>
                   Thank you for choosing TO-LET.<br><br>
                   Best regards,<br>Pradum Sonkar`;

      try {
        await Mailer(req.body.email, "Welcome to TO-LET!", msg);
      } catch (mailErr) {
        console.error("Email sending failed:", mailErr);
        // Don't fail the signup just because email failed
      }

      res.status(200).json({
        success: true,
        authToken,
        message: "User created successfully",
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

Router.post(
  "/google/signin",
  [
    body("googleId", "Enter a valid googleID").isLength({ min: 15 }),
    body("email", "Enter a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      const user = await User.findOne({ googleId: req.body.googleId });

      if (!user) {
        // Check if email exists with different login method
        const emailUser = await User.findOne({ email: req.body.email });
        if (emailUser) {
          return res.status(200).json({
            success: false,
            requireSignup: false,
            message: "User already exists with different login method.",
          });
        }
        return res.status(200).json({ success: false, requireSignup: true });
      }

      // User exists with Google
      const payload = { user: { id: user.id } };
      const authToken = jwt.sign(payload, JWT_SECRET);

      res.json({
        success: true,
        authToken,
        _id: user._id,
        username: user.username,
        email: user.email,
        pic: user.pic,
        message: "Login successful",
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

module.exports = Router;