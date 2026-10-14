import { Router } from 'express';
import { deleteChat, getChats, getMessages, renameChat } from '../controllers/chat.controller.js';
import { authUser } from '../middleware/auth.middleware.js';

const chatRouter = Router()

chatRouter.get('/', authUser, getChats)

chatRouter.get('/:chatId/messages', authUser, getMessages)

chatRouter.delete('/delete/:chatId', authUser, deleteChat)

chatRouter.patch('/:chatId', authUser, renameChat)

export default chatRouter;