import chatModel from '../models/chat.model.js'
import messageModel from '../models/message.model.js'


export async function getChats(req, res) {
    const user = req.user

    const chats = await chatModel.find({ user: user.id })

    res.status(200).json({
        message: "Chats Retrieved Successfully!",
        chats
    })
}

export async function getMessages(req, res) {
    const { chatId } = req.params

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    })

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    })
}

export async function deleteChat(req, res) {
    const { chatId } = req.params

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message: "Chat not found",
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })
    
    res.status(200).json({
        message: "Chat deleted successfully!"
    })
}

export async function renameChat(req, res) {
    const { chatId } = req.params
    const { title } = req.body

    const trimmed = (title || '').trim()

    if(!trimmed || trimmed.length > 100){
        return res.status(400).json({
            message: "Title must be upto 100 characters"
        })
    }

    const chat = await chatModel.findOneAndUpdate(
        { _id: chatId, user: req.user.id },
        { title: trimmed },
        { new: true}
    )

    if(!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    res.status(200).json({
        message: "Chat renamed successfully",
        chat
    })
}