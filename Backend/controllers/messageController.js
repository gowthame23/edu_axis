import Message from '../models/Message.js';
import { assertSameSchoolUser } from '../middleware/tenantGuards.js';

const handleControllerError = (res, error, context) => {
  console.error(`${context} error`, error);
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: 'Server error' });
};

// Send a message and notify recipient via socket.io
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const schoolId = req.schoolId;
    const { recipientId, text, attachments } = req.body;

    if (!recipientId || !text) {
      return res.status(400).json({ success: false, message: 'recipientId and text required' });
    }

    // Prevent sending messages to self
    if (recipientId && senderId && senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a message to yourself' });
    }

    // Ensure recipient exists
    await assertSameSchoolUser(recipientId, schoolId, {
      notFoundMessage: 'Recipient not found',
      forbiddenMessage: 'Recipient is not in your school'
    });

    const message = await Message.create({
      schoolId,
      sender: senderId,
      recipient: recipientId,
      text,
      attachments: attachments || [],
      status: 'sent'
    });

    // Emit via socket.io to recipient room if available
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = await message.populate('sender', 'name email role');
        // Send to recipient's room
        io.to(`user:${recipientId}`).emit('message:received', payload);
        // Also send back to sender's room for real-time update
        io.to(`user:${senderId}`).emit('message:sent', payload);
        // Mark as delivered if recipient is online
        const recipientSockets = await io.in(`user:${recipientId}`).fetchSockets();
        if (recipientSockets.length > 0) {
          message.status = 'delivered';
          await message.save();
        }
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    return handleControllerError(res, error, 'sendMessage');
  }
};

// Get messages between current user and another user
export const getConversationWithUser = async (req, res) => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const otherUserId = req.params.userId;

    // Prevent fetching a self conversation
    if (otherUserId && userId && userId.toString() === otherUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot open conversation with yourself' });
    }

    // Validate other user exists
    await assertSameSchoolUser(otherUserId, schoolId, {
      notFoundMessage: 'User not found',
      forbiddenMessage: 'User is not in your school'
    });

    // Find messages where sender==userId and recipient==otherUserId OR vice versa
    const messages = await Message.find({
      schoolId,
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    return res.json({ success: true, data: messages });
  } catch (error) {
    return handleControllerError(res, error, 'getConversationWithUser');
  }
};

// Get all conversations (unique users who have messaged current user)
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;

    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      schoolId,
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const isSender = msg.sender._id.toString() === userId.toString();
      const partnerId = isSender ? msg.recipient._id.toString() : msg.sender._id.toString();
      const partner = isSender ? msg.recipient : msg.sender;

      // Skip any self-conversation entries if they exist
      if (partnerId === userId.toString()) return;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          userId: partnerId,
          userName: partner.name,
          userRole: partner.role,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        });
      }
      
      // Count unread messages (messages where current user is recipient and status is not 'read')
      if (msg.recipient._id.toString() === userId.toString() && msg.status !== 'read') {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return handleControllerError(res, error, 'getConversations');
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ success: false, message: 'senderId required' });
    }

    await assertSameSchoolUser(senderId, schoolId, {
      notFoundMessage: 'Sender not found',
      forbiddenMessage: 'Sender is not in your school'
    });

    // Update all unread messages from this sender to current user
    const result = await Message.updateMany(
      {
        schoolId,
        sender: senderId,
        recipient: userId,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Notify sender via socket that messages were read
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${senderId}`).emit('messages:read', {
          readBy: userId,
          count: result.modifiedCount
        });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, data: { updated: result.modifiedCount } });
  } catch (error) {
    return handleControllerError(res, error, 'markAsRead');
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, schoolId });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.findOneAndDelete({ _id: messageId, schoolId });

    // Notify recipient via socket
    try {
      const io = req.app.get('io');
      if (io) {
        // Emit to recipient and sender rooms for consistency
        io.to(`user:${message.recipient}`).emit('message:deleted', { messageId });
        io.to(`user:${message.sender}`).emit('message:deleted', { messageId });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    return handleControllerError(res, error, 'deleteMessage');
  }
};

// Delete entire conversation with a user
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const { otherUserId } = req.params;

    // Validate other user exists
    await assertSameSchoolUser(otherUserId, schoolId, {
      notFoundMessage: 'User not found',
      forbiddenMessage: 'User is not in your school'
    });

    // Delete all messages between these two users
    const result = await Message.deleteMany({
      schoolId,
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    });

    // Notify other user via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${otherUserId}`).emit('conversation:deleted', { userId });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ 
      success: true, 
      message: 'Conversation deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return handleControllerError(res, error, 'deleteConversation');
  }
};
