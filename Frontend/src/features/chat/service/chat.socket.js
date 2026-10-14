import { io } from 'socket.io-client';
import { store } from '../../../app/app.store.js';
import { appendPendingToken, setPendingStatus, resolvePendingMessage, failPendingMessage, renameChat, setError } from '../chat.slice.js'

let socket = null

export const initializeSocketConnection = () => {
    if (socket) {
        if (!socket.connected) socket.connect()
        return socket
    }

    socket = io("", { withCredentials: true })
    const { dispatch } = store

    socket.on("connect", () => {
        console.log("Connected to Socket.IO server")
    })

    socket.on("connect_error", (err) => {
        console.error("Socket connection failed:", err.message)
    })

    socket.on("chat:token", ({
        chatId,
        pendingId,
        token
    }) => {
        dispatch(appendPendingToken({
            chatId,
            id: pendingId,
            token
        }))
    })

    socket.on("chat:status", ({
        chatId,
        pendingId,
        status
    }) => {
        dispatch(setPendingStatus({
            chatId,
            id: pendingId,
            status
        }))
    })

    socket.on("chat:done", ({
        chatId,
        pendingId,
        message
    }) => {
        if (message) {
            dispatch(resolvePendingMessage({
                chatId,
                id: pendingId,
                content: message.content
            }))
        }
        else {
            dispatch(failPendingMessage({
                chatId,
                id: pendingId
            }))
        }
    })

    socket.on("chat:error", ({
        chatId,
        pendingId,
        error
    }) => {
        dispatch(failPendingMessage({
            chatId,
            id: pendingId
        }))

        dispatch(setError(error || "Failed to generate a response"))
    })

    socket.on("chat:title", ({ chatId, title }) => {
        dispatch(renameChat({ chatId, title }))
    })

    return socket
}

export const getSocket = () => socket ?? initializeSocketConnection()

export const disconnectSocket = () => {
    if(!socket) return
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
}