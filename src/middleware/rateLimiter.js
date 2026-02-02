// Rate-Limiter Middleware (minimal & sicher)

import rateLimit from "express-rate-limit";

export const createRateLimiter = ({ windowMs, limit, message }) => {
  // In Tests deaktivieren (über .env.test steuerbar)
  if (process.env.RATE_LIMITER_DISABLED === "true") {
    return (req, res, next) => {
      next();
    };
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    handler: (req, res, next, options) => {
      // Einheitliches JSON-Format für Frontend & Tests
      res.status(options.statusCode).json({
        message: options.message
      });
    }
  });
};
