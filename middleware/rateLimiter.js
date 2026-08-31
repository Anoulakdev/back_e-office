const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const jwt = require("jsonwebtoken");

/**
 * Helper to identify the user making the request
 * Priority: req.user.username -> Decoded JWT from Authorization header -> IP Address (with IPv6 support)
 */
const getUserIdentifier = (req) => {
  if (req.user?.username) {
    return `user_${req.user.username}`;
  }
  const authHeader = req.headers?.authorization || req.header?.("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);
      if (decoded?.username) {
        return `user_${decoded.username}`;
      }
      if (decoded?.id) {
        return `user_${decoded.id}`;
      }
    } catch {
      // Fallback to IP if decoding fails
    }
  }
  return ipKeyGenerator(req);
};

/**
 * Rate limiter specifically for authentication endpoints (Login, Password changes, etc.)
 * Limits failed attempts per targeted user account (or per IP if username not provided).
 */
const authLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10)
    : 1 * 60 * 1000, // 1 minute default
  max: process.env.AUTH_RATE_LIMIT_MAX
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)
    : 30, // 30 failed attempts per user/minute
  skipSuccessfulRequests: true, // Only count failed attempts; successful logins won't consume rate limit quota
  keyGenerator: (req) => {
    // แยกนับโควต้าต่อ User ตาม Username ที่พยายามล็อกอิน
    if (req.user?.username) {
      return `auth_${req.user.username}`;
    }
    if (req.body?.username) {
      return `auth_${String(req.body.username).trim().toLowerCase()}`;
    }
    return ipKeyGenerator(req);
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message:
      "ມີການພະຍາຍາມເຂົ້າສູ່ລະບົບຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງໃນ 1 ນາທີ (Too many login attempts, please try again in 1 minute)",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API rate limiter
 * Limits requests per authenticated user (or per IP for guest/unauthenticated traffic)
 */
const apiLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10)
    : 1 * 60 * 1000, // 1 minute window
  max: process.env.API_RATE_LIMIT_MAX
    ? parseInt(process.env.API_RATE_LIMIT_MAX, 10)
    : 500, // 500 requests/min per user (very generous for active users, protects against spam)
  keyGenerator: (req) => getUserIdentifier(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "ມີການຮ້ອງຂໍຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງໃນ 1 ນາທີ (Too many requests, please try again in 1 minute)",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
