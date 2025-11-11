import express from "express";
import {
  getOrCreateChat,
  getChats,
  getMessages,
  sendMessage,
  createGroupChat,
  markMessagesAsRead
} from '../controller/chatController.js';
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get or create a chat
router.post('/get-or-create', getOrCreateChat);

// Get all chats for current user
router.get('/', getChats);

// Get messages for a chat
router.get('/:chatId/messages', getMessages);

// Send a message
router.post('/message', sendMessage);

// Create a group chat
router.post('/group', createGroupChat);

// Mark messages as read
router.put('/:chatId/read', markMessagesAsRead);

export default router;

