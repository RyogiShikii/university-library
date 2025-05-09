import { Ratelimit } from "@upstash/ratelimit";
import redis from "@/database/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, "1m"), //5 request per 1min
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export default ratelimit;
