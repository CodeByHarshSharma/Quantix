import crypto, { KeyObject } from 'crypto';
import redis from '../config/cache.js';

function keyFor(token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    return `bl:${hash}`
}

export async function blacklistToken(token, expSeconds) {
    const ttl = expSeconds - Math.floor(Date.now() / 1000)
    if (ttl > 0) {
        await redis.set(keyFor(token), '1', 'EX', ttl)
    }
}

export async function isTokenBlacklisted(token) {
    return (await redis.exists(keyFor(token))) === 1
}