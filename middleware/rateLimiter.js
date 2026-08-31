const rateLimit = require("express-rate-limit");

/**
 * Rate limiter specifically for authentication endpoints (Login, Password changes, etc.)
 * Prevents brute force and credential stuffing attacks.
 */
const authLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10)
    : 15 * 60 * 1000, // 15 minutes default
  max: process.env.AUTH_RATE_LIMIT_MAX
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)
    : 50, // Limit each IP to 50 failed attempts per window (safe for shared office IP)
  skipSuccessfulRequests: true, // Only count failed attempts; successful logins won't consume rate limit quota
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message:
      "ມີການພະຍາຍາມເຂົ້າສູ່ລະບົບຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງໃນ 15 ນາທີ (Too many login attempts, please try again in 15 minutes)",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API rate limiter to protect all API endpoints from DDoS and spam
 */
const apiLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10)
    : 1 * 60 * 1000, // 1 minute window (resets quickly to avoid blocking office users)
  max: process.env.API_RATE_LIMIT_MAX
    ? parseInt(process.env.API_RATE_LIMIT_MAX, 10)
    : 600, // 600 requests/min per IP (~10 req/sec, suitable for corporate network with 2000 users)
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

