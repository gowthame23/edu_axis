import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  X,
  Search,
  Trash2,
  Check,
  CheckCheck,
  MoreVertical
} from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

export default function TeacherInbox({ user, socket }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Responsive list visibility
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setShowList(!selectedConversation);
      } else {
        setShowList(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation]);

  const API_BASE =
    getApiBaseUrl();

  // Auto-scroll inside the messages panel only to avoid page scroll jumps
  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all messages where teacher is recipient to get unique students
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Listen for real-time events via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      const senderId =
        typeof payload.sender === 'string'
          ? payload.sender
          : payload.sender?._id;

      // If message is for current conversation, add it
      if (
        selectedConversation &&
        senderId === selectedConversation.userId
      ) {
        setMessages((prev) => [...prev, payload]);
        // Mark as read automatically
        if (senderId) {
          markConversationAsRead(senderId);
        }
      }
      // Refresh conversations to update unread counts
      fetchConversations();
    };

    const handleMessageSent = (payload) => {
      // Add sent message to current conversation if it matches
      const recipientId = typeof payload.recipient === 'string' 
        ? payload.recipient 
        : payload.recipient?._id;
      
      if (selectedConversation && recipientId === selectedConversation.userId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg._id === payload._id);
          if (exists) return prev;
          return [...prev, payload];
        });
      }
      // Refresh conversations
      fetchConversations();
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    const handleConversationDeleted = ({ userId }) => {
      // If the deleted conversation is currently selected, clear it
      if (selectedConversation && selectedConversation.userId === userId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      // Refresh conversations list
      fetchConversations();
    };

    const handleTypingStart = ({ senderId, senderName }) => {
      if (selectedConversation && senderId === selectedConversation.userId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(senderName);
          return next;
        });
      }
    };

    const handleTypingStop = ({ senderId }) => {
      if (!selectedConversation || senderId !== selectedConversation.userId)
        return;

      setTypingUsers((prev) => {
        const next = new Set(prev);
        const [first] = next;
        if (first) next.delete(first);
        return next;
      });
    };

    socket.on('message:received', handleNewMessage);
    socket.on('message:sent', handleMessageSent);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:deleted', handleConversationDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:received', handleNewMessage);
      socket.off('message:sent', handleMessageSent);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:deleted', handleConversationDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages/conversations`, {
        withCredentials: true
      });
      if (res.data.success) {
        const convs = res.data.data || [];
        // Deduplicate conversations by userId to prevent React key warnings
        const uniqueConvs = Array.from(
          new Map(convs.map(conv => [conv.userId, conv])).values()
        );
        setConversations(uniqueConvs);
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const fetchMessages = async (userId, userName, userRole) => {
    try {
      setLoading(true);
      setSelectedConversation({ userId, userName, userRole });
      const res = await axios.get(`${API_BASE}/messages/${userId}`, {
        withCredentials: true
      });
      if (res.data.success) {
        setMessages(res.data.data || []);
        // Mark as read
        markConversationAsRead(userId);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async (senderId) => {
    try {
      await axios.post(
        `${API_BASE}/messages/read`,
        { senderId },
        { withCredentials: true }
      );
      // Update local conversation unread count
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === senderId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', {
        recipientId: selectedConversation.userId,
        senderId: user.id || user._id,
        senderName: user.name
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', {
        recipientId: selectedConversation.userId,
        senderId: user.id || user._id
      });
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    // Prevent self-messaging from UI as extra safety
    const currentUserId = user.id || user._id;
    if (selectedConversation.userId?.toString() === currentUserId?.toString()) {
      alert('You cannot send a message to yourself');
      return;
    }

    // Stop typing indicator
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('typing:stop', {
        recipientId: selectedConversation.userId,
        senderId: user.id || user._id
      });
    }

    try {
      setSending(true);
      const messageText = newMessage; // Store before clearing
      setNewMessage(''); // Clear input immediately for better UX
      
      const res = await axios.post(
        `${API_BASE}/messages`,
        {
          recipientId: selectedConversation.userId,
          text: messageText
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        // Socket will handle adding the message via 'message:sent' event
        // No need to manually add it here to avoid duplicates
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await axios.delete(`${API_BASE}/messages/${messageId}`, {
        withCredentials: true
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      console.error('Failed to delete message', err);
      alert('Failed to delete message');
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation) return;
    
    if (!window.confirm(`Delete entire conversation with ${selectedConversation.userName}? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/messages/conversation/${selectedConversation.userId}`, {
        withCredentials: true
      });
      
      // Clear selected conversation and messages
      setSelectedConversation(null);
      setMessages([]);
      setShowDeleteMenu(false);
      
      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Failed to delete conversation', err);
      alert('Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffInHours = (now - msgDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return msgDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getMessageStatus = (msg) => {
    const senderId =
      typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
    const currentUserId = user.id || user._id;
    if (senderId?.toString() !== currentUserId?.toString()) return null;
    if (msg.status === 'read')
      return <CheckCheck className="w-4 h-4 text-purple-400" />;
    if (msg.status === 'delivered')
      return <CheckCheck className="w-4 h-4 text-slate-400" />;
    return <Check className="w-4 h-4 text-slate-400" />;
  };

  const typingText =
    typingUsers.size > 0
      ? `${Array.from(typingUsers).join(', ')} is typing...`
      : '';

  return (
    <div className="flex gap-4 h-[calc(100vh-250px)] relative">
      {/* Conversations List */}
      <div
        className={`bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col w-full md:w-72 shrink-0
          ${showList ? 'block' : 'hidden md:block'}
          ${showList && window.innerWidth < 1100 ? 'absolute inset-0 z-30 md:static' : 'md:static'}`}
      >
        <div className="p-4 border-b border-slate-200 bg-linear-to-r from-purple-600 to-purple-700 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </h2>
          {window.innerWidth < 1100 && showList && (
            <button
              onClick={() => setShowList(false)}
              className="absolute top-3 right-3 p-2 rounded-md bg-white/20 hover:bg-white/30"
              title="Close list"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 border-b border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() =>
                    fetchMessages(conv.userId, conv.userName, conv.userRole)
                  }
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                    selectedConversation?.userId === conv.userId
                      ? 'bg-purple-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {conv.userName}
                      </p>
                      <p className="text-xs text-slate-500">{conv.userRole}</p>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-100 flex flex-col overflow-hidden">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">
                Choose a student from the list to view messages
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-linear-to-r from-purple-600 to-purple-700 text-white flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">{selectedConversation.userName}</h3>
                  <p className="text-xs text-purple-100">
                    {selectedConversation.userRole}
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showDeleteMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                    <button
                      onClick={deleteConversation}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Conversation
                    </button>
                  </div>
                )}
              </div>
              {window.innerWidth < 1100 && (
                <button
                  onClick={() => setShowList(prev => !prev)}
                  className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  title={showList ? 'Hide conversation list' : 'Show conversation list'}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No messages yet. Waiting for student to message...</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const senderId =
                      typeof msg.sender === 'string'
                        ? msg.sender
                        : msg.sender?._id;
                    // Use user.id or fallback to user._id for backwards compatibility
                    const currentUserId = user.id || user._id;
                    const isOwn =
                      senderId?.toString() === currentUserId?.toString();

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${
                          isOwn ? 'justify-end' : 'justify-start'
                        } group`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                            isOwn
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-slate-900 border border-slate-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap wrap-break-word">
                            {msg.text}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <p
                              className={`text-xs ${
                                isOwn ? 'text-purple-100' : 'text-slate-500'
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                            {getMessageStatus(msg)}
                          </div>

                          {isOwn && (
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Typing indicator */}
              {typingText && (
                <p className="text-xs text-slate-500 mt-2">{typingText}</p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="p-3 md:p-4 border-t border-slate-200 bg-white"
            >
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
