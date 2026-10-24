import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
})

redis.on('connect', () => console.log("Connected to Redis"))
redis.on('error', (err) => console.error("Redis error:", err.message))

export default redis