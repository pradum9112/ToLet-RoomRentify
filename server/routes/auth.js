require("dotenv").config();
const express = require("express");
const Router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // generates a token to identify user,sort of cookie
const JWT_SECRET = process.env.JWT_SECRET; // for signing web token
const fetchUser = require("../middleware/fetchUserFromToken");
const PassValidator = require("../models/Forgotpass");
var nodemailer = require("nodemailer");
const Mailer = require("./Mailer");

// POST /auth/signup/email/verify
Router.post(
  "/signup/email/verify",(req, res, next) => {
    if (req.body.phone) {
      req.body.phone = String(req.body.phone).replace(/[\s-]/g, "");
    }
    next();
  },
  [
    body("email", "Enter a valid email address").isEmail(),
    body("password", "Password cannot be blank").exists(),
    body("password", "Enter a valid password of minimum 8 characters").isLength({
      min: 8,
    }),
    body("phone")
      .matches(/^\+[1-9]\d{7,14}$/)
      .withMessage("Enter a valid international phone number with country code"),
    body("fname", "Enter a valid first name of minimum 2 characters").isLength({
      min: 2,
    }),
    body("lname", "Enter a valid last name of minimum 2 characters").isLength({
      min: 2,
    }),
    body("authcode", "Enter 6 digit verification code sent to your email")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("Verification code must be 6 digits"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Validation failed",
      });
    }

    
    // Check if user already exists
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with given email id already exist. Please Login",
      });
    }

    try {
      let storeAuthCode = await PassValidator.findOne({
        email: req.body.email,
      });

      if (!storeAuthCode) {
        return res.status(400).json({
          success: false,
          message:
            "No such user with this email requested to create a new account",
        });
      }

      // String compare — type mismatch fix
      if (String(storeAuthCode.authcode) !== String(req.body.authcode)) {
        return res.status(400).json({
          success: false,
          message: "Wrong Verification code",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create user
      const fullname = `${req.body.fname} ${req.body.lname}`.trim();
      const newUser = await User.create({
        firstName: req.body.fname,
        lastName: req.body.lname,
        email: req.body.email,
        username: fullname,
        phone: req.body.phone, // e.g. +919876543210
        password: hashedPassword,
      });

      // Generate token
      const payload = { user: { id: newUser.id } };
      const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      // OTP record cleanup (optional but recommended)
      await PassValidator.deleteOne({ email: req.body.email });

      // Send welcome email (non-blocking)
      const msg = `Dear ${fullname},<br><br>Congratulations on taking the first step towards getting dream stays!`;
      Mailer(req.body.email, "Welcome to TO-LET site!", msg).catch((err) =>
        console.error("Email error:", err)
      );

      return res.status(200).json({
        success: true,
        authToken,
        message: "verified",
      });
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, message: "Some error occured" });
    }
  }
);

// POST /auth/signup/email
// Generates a 6-digit OTP, stores it in PassValidator, and emails it to the user.
Router.post(
  "/signup/email",
  [
    body("email", "Enter a valid email address").isEmail(),
  ],
  async (req, res) => {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Validation failed",
      });
    }

    const email = req.body.email.toLowerCase().trim();

    try {
      // 2. Reject if user already has an account
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with given email id already exist. Please Login",
        });
      }

      // 3. Generate a 6-digit numeric OTP
      const authcode = Math.floor(100000 + Math.random() * 900000).toString();

      // 4. Upsert into PassValidator so /verify can find it later
      //    (upsert handles both "first request" and "resend code" cases)
      await PassValidator.findOneAndUpdate(
        { email },
        {
          email,
          authcode,
          createdAt: new Date(), // optional, useful if you add TTL expiry
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 5. Send the code by email (non-blocking, same pattern as your welcome email)
      const msg = `Your verification code is: <b>${authcode}</b><br><br>This code will expire shortly. If you did not request this, please ignore this email.`;
      Mailer(email, "Your TO-LET RoomRentify verification code", msg).catch((err) =>
        console.error("Email error:", err)
      );

      // 6. Respond
      return res.status(200).json({
        success: true,
        message: "Verification code sent",
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        success: false,
        message: "Some error occured",
      });
    }
  }
);

// to authenticate a user while the user login  login is not required by user
Router.post(
  "/signin",
  [
    body("email", "Enter a valid email address").isEmail(),
    body("password", "Password cannot be blank").exists(),
    body("password", "Enter a valid password of minimum 8 digits").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User with given email id does not exist.",
        });
      }

      bcrypt.compare(
        req.body.password,
        user.password,
        async (error, compareResult) => {
          if (compareResult === false) {
            return res.status(400).json({
              success: false,
              message: "Invalid email or password",
            });
          }

          // FIXED PAYLOAD - Consistent with Google Login
          const payload = {
            user: {
              id: user.id, 
            },
          };

          const authToken = jwt.sign(payload, JWT_SECRET,{ expiresIn: "1h" });

          res.json({
            success: true,
            authToken,
            _id: user._id,
            username: user.username,
            email: user.email,
            pic: user.pic,
            message: "verified",
          });
        },
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Some error occured", success: false });
    }
  },
);

// Route -3 Obtaining details from jws token or decrypting token  login is required by user
Router.post("/verifyuser", fetchUser, async (req, res) => {
  try {
    const userId = req.userId;
    const userWithId = await User.findById(userId).select(
      "firstName lastName email",
    );
    if (!userWithId) {
      return res.status(401).send({
        message: "Please authenticate using a valid token",
        success: false,
      });
    } else {
      res.send({ success: true, message: "verified", data: userWithId });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Some error occured", success: false });
  }
});

Router.post(
  "/delete/email",
  [body("email", "Enter a valid email address").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No User with given email id exists.",
      });
    }
    
    // sending otp for verification of email
    try {
      const trashCode = await PassValidator.findOneAndDelete({
        email: req.body.email,
      });

      const authCode = Math.floor(100000 + Math.random() * 900000);
      authCodeCheck = authCode;
      
      if (
        await Mailer(
          req.body.email,
          "Verification Code For *ACCOUNT DELETION*",
          String("Your verification code is " + authCode),
        )
      ) {
        try {
          let storeAuthCode = await PassValidator.create({
            email: req.body.email,
            authcode: authCode,
          });

          res.json({ success: true, message: "Email Send" });
        } catch (error) {
          console.error(error.message);
          res
            .status(500)
            .json({ message: "Some error occured", success: false });
        }
      } else {
        res.status(500).json({ message: "Some error occured", success: false });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Some error occured", success: false });
    }
  },
);

Router.post(
  "/delete/email/verify",
  [
    body("email", "Enter a valid email address").isEmail(),
    body("password", "Password cannot be blank").exists(),
    body("password", "Enter a valid password of minimum 8 digits").isLength({
      min: 8,
    }),
    body(
      "authcode",
      "Enter 6 digit verification code send to your email",
    ).isLength({ min: 6 }),
  ],
  // if there is validation problem
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array() });
    }

    // To check wheather the user exists already with the given email
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "No user with given email id exists." });
      }

      try {
        let storeAuthCode = await PassValidator.findOne({
        email: req.body.email,
      });

      if (!storeAuthCode) {
        return res.status(400).json({
          message:
            "No such user with this email requested to delete a new account",
          success: false,
        });
      }

      if (storeAuthCode.authcode !== req.body.authcode) {
        return res
        .status(400)
          .json({ message: "Invalid Verification code", success: false });
      }

      if (storeAuthCode.authcode === req.body.authcode) {
        try {
          bcrypt.compare(
            req.body.password,
            user.password,
            async (error, compareResult) => {
              if (compareResult === false) {
                return res.status(400).json({
                  success: false,
                  message: "Invalid email or password",
                });
              }

              await User.deleteOne({ email: req.body.email });

              const dateNI = new Date();
              var ISToffSet = 330; //IST is 5:30; i.e. 60*5+30 = 330 in minutes
              offset = ISToffSet * 60 * 1000;
              var date = new Date(dateNI.getTime() + offset);
              
              const dnt =
                date.getDate() +
                "-" +
                date.getMonth() +
                1 +
                "-" +
                date.getFullYear() +
                " at " +
                date.getHours() +
                ":" +
                date.getMinutes();
              const sub = "New Login Activity";

              const msg = `Hi ${user.name},<br><br>Account deleted on${dnt}.<br><br>Regards<br>Authify`;

              Mailer(req.body.email, sub, msg);
              
              await res.json({
                success: true,
                message: "Account deleted successfully",
              });
            },
          );
        } catch (error) {
          console.error(error.message);
          res
            .status(500)
            .json({ message: "Some error occured", success: false });
        }
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Some error occured", success: false });
    }
  },
);

       


module.exports = Router;