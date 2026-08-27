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
    : 10, // Limit each IP to 10 login requests per windowMs
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
    : 15 * 60 * 1000, // 15 minutes default
  max: process.env.API_RATE_LIMIT_MAX
    ? parseInt(process.env.API_RATE_LIMIT_MAX, 10)
    : 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "ມີການຮ້ອງຂໍຫຼາຍເກີນໄປ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງໃນພາຍຫຼັງ (Too many requests, please try again later)",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
