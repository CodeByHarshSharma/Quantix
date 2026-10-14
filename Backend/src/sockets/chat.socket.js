import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"
import { streamMessage, generateChatTitle } from "../services/ai.service.js"

export function registerChatHandlers(socket) {
    const active = new Map() // pendingId -> AbortController

    socket.on("chat:send", async (payload, ack) => {
        const reply = typeof ack === "function" ? ack : () => {}
        const { message, chatId, pendingId } = payload ?? {}
        const text = (message || "").trim()

        if (!text || !pendingId) {
            return reply({ ok: false, error: "Message is required" })
        }

        try {
            // 1. Find (with ownership check) or create the chat
            let chat
            const isNewChat = !chatId

            if (isNewChat) {
                chat = await chatModel.create({ user: socket.user.id })
            } else {
                chat = await chatModel.findOne({ _id: chatId, user: socket.user.id })
                if (!chat) return reply({ ok: false, error: "Chat not found" })
            }

            const id = String(chat._id)

            // 2. Save the user message and ack immediately so the client can swap its temp id
            const userMessage = await messageModel.create({
                chat: chat._id,
                content: text,
                role: "User"
            })

            reply({ ok: true, chat, userMessage })

            // 3. Generate the title in the background (after the ack, so the client already knows the real id)
            if (isNewChat) {
                generateChatTitle(text)
                    .then(async (title) => {
                        await chatModel.updateOne({ _id: chat._id }, { title })
                        socket.emit("chat:title", { chatId: id, title })
                    })
                    .catch(err => console.error("Title generation failed:", err))
            }

            // 4. Stream the AI response
            const history = await messageModel
                .find({ chat: chat._id })
                .sort({ createdAt: 1 })
                .lean()

            const controller = new AbortController()
            active.set(pendingId, controller)
            let fullText = ""

            try {
                await streamMessage(history, {
                    signal: controller.signal,
                    onToken: (token) => {
                        fullText += token
                        socket.emit("chat:token", { chatId: id, pendingId, token })
                    },
                    onToolStart: (name) => {
                        socket.emit("chat:status", {
                            chatId: id,
                            pendingId,
                            status: name === "searchInternet" ? "Searching the web..." : `Using ${name}...`
                        })
                    }
                })
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error("Streaming failed:", err)
                    socket.emit("chat:error", { chatId: id, pendingId, error: "Failed to generate a response" })
                    return
                }
                // aborted by user → fall through and save the partial answer
            } finally {
                active.delete(pendingId)
            }

            // 5. Persist the final AI message
            let AImessage = null
            if (fullText.trim()) {
                AImessage = await messageModel.create({
                    chat: chat._id,
                    content: fullText,
                    role: "AI"
                })
            }

            socket.emit("chat:done", {
                chatId: id,
                pendingId,
                message: AImessage,
                aborted: controller.signal.aborted
            })
        } catch (err) {
            console.error("chat:send failed:", err)
            reply({ ok: false, error: "Something went wrong" })
        }
    })

    socket.on("chat:stop", ({ pendingId } = {}) => {
        active.get(pendingId)?.abort()
    })

    socket.on("disconnect", () => {
        for (const controller of active.values()) controller.abort()
    })
}