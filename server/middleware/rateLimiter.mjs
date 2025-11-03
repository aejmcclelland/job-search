// Simple rate limit (per process memory)
import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({
	points: 60, // 60 requests
	duration: 60, // per 60s per IP
});

export const rateLimiter = (async (req, res, next) => {
	try {
		await limiter.consume(req.ip);
		next();
	} catch {
		res.status(429).json({ error: 'Too many requests' });
	}
});
