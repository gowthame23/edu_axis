import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, X, Plus, Search, Trash2, Check, CheckCheck, MoreVertical } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

export default function StudentInbox({ user, socket }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Responsive state: show/hide conversation list on narrow widths
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        // Start hidden when a conversation is already selected for tighter space
        setShowList(!selectedConversation);
      } else {
        setShowList(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation]);

  // Auto-scroll to bottom within the messages container to avoid page jumps
  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all messages where student is sender or recipient to get unique teachers
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Listen for real-time events via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      const senderId = payload?.sender?._id?.toString();
      const recipientId = typeof payload.recipient === 'string' ? payload.recipient : payload.recipient?._id?.toString();
      const currentPartnerId = selectedConversation?.userId?.toString();
      const myId = (user.id || user._id)?.toString();

      const belongsToOpenConversation = currentPartnerId && (
        senderId === currentPartnerId || recipientId === currentPartnerId
      );

      if (belongsToOpenConversation) {
        setMessages(prev => {
          // Avoid duplicates by _id
          if (payload._id && prev.some(m => m._id === payload._id)) return prev;
          return [...prev, payload];
        });
        // If I am the recipient, mark as read
        if (recipientId === myId && senderId !== myId) {
          markConversationAsRead(senderId);
        }
      } else {
        // Update sidebar unread counts
        fetchConversations();
      }
    };

    const handleMessageSent = (payload) => {
      const recipientId = typeof payload.recipient === 'string'
        ? payload.recipient
        : payload.recipient?._id?.toString();
      const currentPartnerId = selectedConversation?.userId?.toString();
      if (currentPartnerId && recipientId === currentPartnerId) {
        setMessages(prev => {
          if (payload._id && prev.some(m => m._id === payload._id)) return prev;
          return [...prev, payload];
        });
      }
      fetchConversations();
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
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
        setTypingUsers(prev => new Set(prev).add(senderName));
      }
    };

    const handleTypingStop = ({ senderId }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        // Remove by checking if any name belongs to this sender
        const nameToRemove = Array.from(newSet).find(() => true); // Simplified
        newSet.delete(nameToRemove);
        return newSet;
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
      const res = await axios.get(`${getApiBaseUrl()}/messages/conversations`, {
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

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/student/teachers`, {
        withCredentials: true
      });
      if (res.data.success) {
        setTeachers(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setSelectedTeacher(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    }
  };

  const fetchMessages = async (userId, userName, userRole) => {
    try {
      setLoading(true);
      setSelectedConversation({ userId, userName, userRole });
      const res = await axios.get(`${getApiBaseUrl()}/messages/${userId}`, {
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
      await axios.post(`${getApiBaseUrl()}/messages/read`, { senderId }, { withCredentials: true });
      // Update local conversation unread count
      setConversations(prev =>
        prev.map(conv =>
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
        `${getApiBaseUrl()}/messages`,
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

  const sendNewMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedTeacher) return;

    const currentUserId = user.id || user._id;
    // Prevent self-messaging
    if (selectedTeacher === currentUserId || selectedTeacher === currentUserId?.toString()) {
      alert('You cannot send a message to yourself');
      return;
    }

    try {
      setSending(true);
      const res = await axios.post(
        `${getApiBaseUrl()}/messages`,
        {
          recipientId: selectedTeacher,
          text: newMessageText
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        const sentMsg = res.data.data;
        // Ensure sender info is set
        if (!sentMsg.sender || typeof sentMsg.sender === 'string') {
          sentMsg.sender = { _id: currentUserId, name: user.name, role: user.role };
        }
        setNewMessageText('');
        setShowNewMessageModal(false);
        // Refresh conversations
        await fetchConversations();
        // Open the new conversation
        const teacher = teachers.find(t => t._id === selectedTeacher);
        if (teacher) {
          await fetchMessages(teacher._id, teacher.name, 'teacher');
        }
      }
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;

    try {
      await axios.delete(
        `${getApiBaseUrl()}/messages/${messageId}`,
        { withCredentials: true }
      );
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
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
      await axios.delete(
        `${getApiBaseUrl()}/messages/conversation/${selectedConversation.userId}`,
        { withCredentials: true }
      );
      
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

  const handleNewMessageClick = () => {
    fetchTeachers();
    setShowNewMessageModal(true);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffInHours = (now - msgDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatus = (msg) => {
    const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
    const currentUserId = user.id || user._id;
    if (senderId?.toString() !== currentUserId?.toString()) return null;
    if (msg.status === 'read') return <CheckCheck className="w-4 h-4 text-blue-400" />;
    if (msg.status === 'delivered') return <CheckCheck className="w-4 h-4 text-slate-400" />;
    return <Check className="w-4 h-4 text-slate-400" />;
  };

  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-250px)] relative">
        {/* Conversations List */}
        <div
          className={`bg-white rounded-xl shadow-md border border-slate-100 flex flex-col w-full md:w-72 shrink-0
            ${showList ? 'block' : 'hidden md:block'}
            ${showList && window.innerWidth < 1100 ? 'absolute inset-0 z-30 md:static' : 'md:static'}
          `}
        >
          <div className="p-4 border-b border-slate-200 bg-linear-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages
              </h2>
              <button
                onClick={handleNewMessageClick}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="New Message"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {/* Hide list button on narrow view when list showing */}
            {window.innerWidth < 1100 && showList && (
              <button
                onClick={() => setShowList(false)}
                className="absolute top-3 right-3 p-2 rounded-md bg-white/20 hover:bg-white/30"
                title="Close list"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:bg-white/20"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm mb-3">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleNewMessageClick}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Send your first message
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => fetchMessages(conv.userId, conv.userName, conv.userRole)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      selectedConversation?.userId === conv.userId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-900 truncate">{conv.userName}</p>
                          <span className="text-xs text-slate-500">{formatTime(conv.lastMessageTime)}</span>
                        </div>
                        <p className="text-xs text-slate-500">{conv.userRole}</p>
                        <p className="text-xs text-slate-600 truncate mt-1">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">
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
                <p className="text-sm mb-4">Choose a teacher from the list to view messages</p>
                <button
                  onClick={handleNewMessageClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-linear-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedConversation.userName}</h3>
                    <p className="text-xs text-blue-100">
                      {selectedConversation.userRole}
                      {typingUsers.size > 0 && (
                        <span className="ml-2 italic">typing...</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {/* Toggle conversation list on narrow view */}
                  {window.innerWidth < 1100 && (
                    <button
                      onClick={() => setShowList(prev => !prev)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                      title={showList ? 'Hide conversation list' : 'Show conversation list'}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
                      const currentUserId = user.id || user._id;
                      const isOwn = senderId?.toString() === currentUserId?.toString();
                      
                      return (
                        <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-900 border border-slate-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
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
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
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

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowNewMessageModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">New Message</h2>
              <p className="text-sm text-slate-600">Send a message to your teacher</p>
            </div>

            <form onSubmit={sendNewMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Teacher
                </label>
                {teachers.length > 0 ? (
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.subject || 'Teacher'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-4 text-slate-500">Loading teachers...</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Type your message here..."
                  rows={5}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">{newMessageText.length} characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !newMessageText.trim() || !selectedTeacher}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
