import { getSocket, initializeSocketConnection } from "../service/chat.socket.js"
import { getChats, getMessages, deleteChat, renameChat as renameChatApi } from "../service/chat.api.js"
import { createLocalId } from "../service/id.js"
import { setChats, setCurrentChatId, setLoading, setError, createNewChat, addNewMessage, addMessages, removeChat, renameChat, addPendingMessage, replaceChatId, failPendingMessage } from '../chat.slice.js'
import { useDispatch } from 'react-redux'
import { store } from '../../../app/app.store.js'

export const useChat = () => {

    const dispatch = useDispatch()

    function handleSendMessage({ message, chatId }) {

        const isNew = !chatId
        const activeId = chatId || createLocalId()
        const pendingId = createLocalId()

        if (isNew) {
            dispatch(createNewChat({ chatId: activeId, title: 'New Chat' }))
            dispatch(setCurrentChatId(activeId))
        }

        dispatch(addNewMessage({ chatId: activeId, content: message, role: 'User' }))
        dispatch(addPendingMessage({ chatId: activeId, id: pendingId }))

        getSocket()
            .timeout(15000)
            .emit("chat:send", { message, chatId: chatId ?? null, pendingId }, (err, res) => {
                if (err || !res?.ok) {
                    dispatch(failPendingMessage({ chatId: activeId, id: pendingId }))
                    dispatch(setError(res?.error || "Failed to send message"))
                    return   // <- was missing; without it, res.chat._id crashes on failure
                }

                if (isNew) {
                    dispatch(replaceChatId({
                        tempId: activeId,
                        realId: res.chat._id,
                        title: res.chat.title
                    }))
                }
            })
    }

    function handleStopMessage(pendingId) {
        getSocket().emit("chat:stop", { pendingId })
    }

    async function handleGetChats() {
        dispatch(setLoading(true))
        const data = await getChats()
        const { chats } = data

        dispatch(setChats(chats.reduce((acc, chat) => {
            acc[chat._id] = {
                id: chat._id,
                title: chat.title,
                messages: [],
                lastUpdated: chat.updatedAt
            }
            return acc
        }, {})))
    }

    async function handleOpenChats(chatId, chats) {

        if (chats[chatId]?.messages.length === 0) {

            const data = await getMessages(chatId)
            const { messages } = data

            const formattedMessages = messages.map(msg => ({
                id: msg._id,
                content: msg.content,
                role: msg.role
            }))

            dispatch(addMessages({
                chatId,
                messages: formattedMessages
            }))
        }

        dispatch(setCurrentChatId(chatId))
    }

    async function handleDeleteChat(chatId) {
        try {
            dispatch(setLoading(true))
            await deleteChat(chatId)
            dispatch(removeChat({ chatId }))
        }
        catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to delete chat"))
        }
        finally {
            dispatch(setLoading(false))
        }
    }

    async function handleRenameChat(chatId, title) {
        const previousTitle = store.getState().chat.chats[chatId]?.title
        dispatch(renameChat({ chatId, title }))
        try {
            await renameChatApi(chatId, title)
        }
        catch (err) {
            if (previousTitle) {
                dispatch(renameChat({ chatId, title: previousTitle }))
                dispatch(setError(err.response?.data?.message || "Failed to rename chat"))
            }
        }
    }

    function handleNewChat() {
        dispatch(setCurrentChatId(null))
    }
    return {
        initializeSocketConnection,
        handleSendMessage,
        handleStopMessage,
        handleGetChats,
        handleOpenChats,
        handleDeleteChat,
        handleRenameChat,
        handleNewChat
    }
}