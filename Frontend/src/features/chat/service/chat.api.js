import axios from 'axios';

const api = axios.create({
    baseURL: "",
    withCredentials: true
})

export const getChats = async () => {
    const response = await api.get("/api/chats")
    return response.data
}

export const getMessages = async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}/messages`)
    return response.data
}

export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/chats/delete/${chatId}`)
    return response.data
}

export const renameChat = async (chatId, title) => {
    const response = await api.patch(`/api/chats/${chatId}`, { title })
    return response.data
}