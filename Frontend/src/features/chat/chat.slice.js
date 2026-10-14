import { createSlice } from '@reduxjs/toolkit';
import { createLocalId } from './service/id.js';

const initialState = {
    chats: {},
    currentChatId: null,
    isLoading: false,
    error: null
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload
            state.chats[chatId] = {
                id: chatId,
                title,
                messages: [],
                lastUpdated: new Date().toISOString(),
                isTemp: true
            }
        },
        addPendingMessage: (state, action) => {
            const { chatId, id } = action.payload
            state.chats[chatId].messages.push({
                id,
                content: '',
                role: 'AI',
                isPending: true,
                isStreaming: false,
                status: null
            })
        },
        appendPendingToken: (state, action) => {
            const { chatId, id, token } = action.payload
            const message = state.chats[chatId]?.messages.find(m => m.id === id)
            if (!message) return
            message.content += token
            message.isPending = false
            message.isStreaming = true
            message.status = null
        },
        setPendingStatus: (state, action) => {
            const { chatId, id, status } = action.payload
            const message = state.chats[chatId]?.messages.find(m => m.id === id)
            if (message) message.status = status
        },
        resolvePendingMessage: (state, action) => {
            const { chatId, id, content } = action.payload
            const message = state.chats[chatId]?.messages.find(m => m.id === id)
            if (message) {
                if (content != undefined) message.content = content
                message.isPending = false
                message.isStreaming = false
                message.status = null
            }
        },
        failPendingMessage: (state, action) => {
            const { chatId, id } = action.payload
            const messages = state.chats[chatId]?.messages
            if (!messages) return
            const index = messages.findIndex(m => m.id === id)
            if (index !== -1) messages.splice(index, 1)
        },
        replaceChatId: (state, action) => {
            const { tempId, realId, title } = action.payload
            const chat = state.chats[tempId]
            if (!chat) return
            delete state.chats[tempId]
            state.chats[realId] = {
                ...chat,
                id: realId,
                title: title ?? chat.title,
                isTemp: false
            }
            if (state.currentChatId === tempId) {
                state.currentChatId = realId
            }
        },
        addNewMessage: (state, action) => {
            const { chatId, content, role } = action.payload
            state.chats[chatId].messages.push({ id: createLocalId(), content, role })
        },
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload
            state.chats[chatId].messages.push(...messages)
        },
        removeChat: (state, action) => {
            const { chatId } = action.payload
            delete state.chats[chatId]
            if (state.currentChatId === chatId) {
                state.currentChatId = null
            }
        },
        renameChat: (state, action) => {
            const { chatId, title } = action.payload
            if (state.chats[chatId]) {
                state.chats[chatId].title = title
            }
        },
        setChats: (state, action) => {
            state.chats = action.payload
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        resetChat: () => initialState,
    }
})


export const {
    createNewChat,
    addPendingMessage,
    appendPendingToken,
    setPendingStatus,
    resolvePendingMessage,
    failPendingMessage,
    replaceChatId,
    addNewMessage,
    addMessages,
    removeChat,
    renameChat,
    setChats,
    setCurrentChatId,
    setLoading,
    setError,
    resetChat } = chatSlice.actions
export default chatSlice.reducer