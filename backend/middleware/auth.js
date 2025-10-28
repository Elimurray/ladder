const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
