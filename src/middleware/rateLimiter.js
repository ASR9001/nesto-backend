import rateLimit from 'express-rate-limit';

// Rate Limiter for Authentication and sensitive endpoints (strict)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many authentication attempts, please try again after 10 minutes."
  }
});

// Rate Limiter for Private/Authenticated APIs (moderate)
export const privateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many authenticated requests, please try again after 15 minutes."
  }
});

// Rate Limiter for Public Browsing APIs (more relaxed for properties/reviews)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many browsing requests, please try again after 15 minutes."
  }
});
