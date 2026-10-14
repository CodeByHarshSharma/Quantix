import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { registerChatHandlers } from './chat.socket.js'

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

    io.use((socket, next) => {
        try {
            const token = getCookie(socket.handshake.headers.cookie, "token")
            if (!token) return next(new Error("Unauthorized"))

            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            socket.user = decoded
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

export function getIO() {
    if (!io) {
        throw new Error("Socket.io is not initialized")
    }

    return io
}