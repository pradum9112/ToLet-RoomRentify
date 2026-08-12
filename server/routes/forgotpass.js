require("dotenv").config();
const express = require("express");
const Router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const PassValidator = require("../models/Forgotpass");
const bcrypt = require("bcryptjs");
const Mailer = require("./Mailer");


Router.post(
  "/",
  [body("email", "Enter a valid email address").isEmail()],
  async (req, res) => {
    console.log("👉 OTP Request Received for:", req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User with given email id does not exist.",
        });
      }

      await PassValidator.findOneAndDelete({ email: req.body.email });

      const authCode = Math.floor(100000 + Math.random() * 900000);

      const msg = `Oops, seems like you forgot your password. No worries, use the OTP below to reset your password:<br><br>
        <h2>${authCode}</h2><br>
        Best regards,<br>Pradum Sonkar`;

      const mailSent = await Mailer(
        req.body.email,
        "Dont Worry, We've Got You Covered!",
        msg
      );

      if (mailSent) {
        await PassValidator.create({
          email: req.body.email,
          authcode: authCode,
        });
        return res.json({ success: true, message: "Email Sent" });
      } else {
        return res
          .status(500)
          .json({ message: "Failed to send email", success: false });
      }
    } catch (error) {
      console.error("Error in /forgotpassword:", error.message);
      return res
        .status(500)
        .json({ message: "Some error occurred", success: false });
    }
  }
);

// 2. Verify OTP & Reset Password Route
// 🚨 Notice here: Path is "/verify" NOT "/forgotpassword/verify"
// Full URL -> POST http://localhost:5101/forgotpassword/verify
Router.post(
  "/verify",
  [
    body("authcode", "Enter a valid 6-digit verification code").isLength({
      min: 6,
      max: 6,
    }),
    body("password", "Enter a valid password of minimum 8 characters").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    console.log("👉 OTP Verify Request Received for:", req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      let storeAuthCode = await PassValidator.findOne({
        email: req.body.email,
      });

      if (!storeAuthCode) {
        return res.status(400).json({
          success: false,
          message: "No password reset request found for this email",
        });
      }

      if (String(storeAuthCode.authcode) === String(req.body.authcode)) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        await User.updateOne(
          { email: req.body.email },
          { password: hashedPassword }
        );

        const sub = "Your Password has been Successfully Reset!";
        const msg = `Success! Your password has been reset. You can now log in.`;
        Mailer(req.body.email, sub, msg);

        await PassValidator.deleteOne({ email: req.body.email });

        return res.json({ success: true, message: "verified" });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Auth Code" });
      }
    } catch (error) {
      console.error("Error in /forgotpassword/verify:", error.message);
      return res
        .status(500)
        .json({ message: "Some error occurred", success: false });
    }
  }
);

module.exports = Router;