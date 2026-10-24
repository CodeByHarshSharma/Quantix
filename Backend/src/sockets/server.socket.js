import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { registerChatHandlers } from './chat.socket.js'
import { isTokenBlacklisted } from '../services/tokenBlacklist.js';

let io;

function getCookie(header = "", name) {
    for (const part of header.split(";")) {
        const [key, ...rest] = part.trim().split("=")
        if (key === name) return decodeURIComponent(rest.join("="))
    }
    return null
}

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true
        }
    })

    io.use(async (socket, next) => {
        try {
            const token = getCookie(socket.handshake.headers.cookie, "token")
            if (!token) return next(new Error("Unauthorized"))

            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            if (await isTokenBlacklisted(token)) {
                return next(new Error("Unauthorized"))
            }

            socket.user = decoded
            socket.data.token = token
            next()
        }
        catch {
            next(new Error("Unauthorized"))
        }
    })

    io.on("connection", (socket) => {
        console.log("User Connected:", socket.user.id, socket.id)
        registerChatHandlers(socket)
    })

    console.log("Socket io server is running...")
}

export function disconnectSocketByToken(token) {
    if (!io) return
    for (const s of io.sockets.sockets.values()) {
        if (s.data.token === token) s.disconnect(true)
    }
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.io is not initialized")
    }

    return io
}