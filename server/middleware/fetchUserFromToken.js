const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  try {
    let token = null;

    // Multiple ways to get token
    if (req.header("Authorization")) {
      token = req.header("Authorization").replace("Bearer ", "");
    } else if (req.header("token")) {
      token = req.header("token");
    } else if (req.header("auth-token")) {
      token = req.header("auth-token");
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please authenticate using a valid token"
      });
    }

    const data = jwt.verify(token, JWT_SECRET);
    req.userId = data.user.id;   // Make sure your JWT payload has .user.id

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = fetchUser;