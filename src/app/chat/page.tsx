'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  imageName?: string;
  timestamp: Timestamp | Date;
  isRead: boolean;
  chatRoomId: string;
}

interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Timestamp | Date;
  lastMessageAt: Timestamp | Date;
  lastMessage: string;
  unreadCount: number;
  isActive: boolean;
}

// Main chat component that uses hooks
function ChatComponent() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set loading timeout to prevent infinite loading
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout reached, stopping loader');
        setIsLoading(false);
        setError('Loading took too long. Please refresh the page.');
      }
    }, 10000); // 10 second timeout

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Handle early loading state resolution
  useEffect(() => {
    // If user is null or Firebase is not configured, stop loading immediately
    if (!user || !db) {
      setIsLoading(false);
      if (!user) {
        setError('Please sign in to access the chat.');
      } else if (!db) {
        setError('Database service is not available.');
      }
      return;
    }
  }, [user]);

  // Load chat rooms
  useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupChatRooms = async () => {
      try {
        const chatRoomsQuery = query(
          collection(db, 'chatRooms'),
          orderBy('lastMessageAt', 'desc')
        );

        unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
          try {
            const rooms: ChatRoom[] = [];
            snapshot.forEach((doc) => {
              rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
            });
            setChatRooms(rooms);
            setIsLoading(false);
            setError(null); // Clear any previous errors
            
            // Clear timeout since we successfully loaded
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
          } catch (err) {
            console.error('Error processing chat rooms snapshot:', err);
            setIsLoading(false);
            setError('Failed to process chat rooms data.');
          }
        }, (error) => {
          console.error('Error loading chat rooms:', error);
          setIsLoading(false);
          setError('Failed to load chat rooms. Please check your connection.');
        });
      } catch (error) {
        console.error('Error setting up chat rooms listener:', error);
        setIsLoading(false);
        setError('Failed to initialize chat rooms.');
      }
    };

    setupChatRooms();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Load messages for selected chat room
  useEffect(() => {
    if (!selectedChatRoom || !db) {
      setMessages([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupMessages = async () => {
      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatRoomId', '==', selectedChatRoom.id),
          orderBy('timestamp', 'asc')
        );

        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          try {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
              msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(msgs);
            scrollToBottom();
          } catch (err) {
            console.error('Error processing messages snapshot:', err);
          }
        }, (error) => {
          console.error('Error loading messages:', error);
          // Don't set global error for messages, just log it
        });
      } catch (error) {
        console.error('Error setting up messages listener:', error);
      }
    };

    setupMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedChatRoom]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom || !user || isSending || !db) return;

    setIsSending(true);
    try {
      const messageData = {
        senderId: user.uid,
        senderName: 'Admin',
        senderType: 'admin',
        content: newMessage.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
        isRead: false,
        chatRoomId: selectedChatRoom.id,
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat room with last message
      await updateDoc(doc(db, 'chatRooms', selectedChatRoom.id), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChatRoom || !user || isSending || !db || !storage) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, or SVG)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsSending(true);
    try {
      // Upload image to Firebase Storage
      const fileName = `chat_images/admin_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Send image message
      const messageData = {
        senderId: user.uid,
        senderName: 'Admin',
        senderType: 'admin',
        content: 'Image',
        type: 'image',
        imageUrl: downloadURL,
        imageName: file.name,
        timestamp: serverTimestamp(),
        isRead: false,
        chatRoomId: selectedChatRoom.id,
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat room with last message
      await updateDoc(doc(db, 'chatRooms', selectedChatRoom.id), {
        lastMessage: 'Image',
        lastMessageAt: serverTimestamp(),
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle authentication and error states
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">Access Required</h2>
          <p className="text-gray-600 leading-relaxed">Please sign in to access the chat system and connect with our team.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-100">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 transform hover:scale-105 transition-all duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">Connection Error</h2>
          <p className="text-gray-600 font-medium text-lg mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              window.location.reload();
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 transform hover:scale-105 transition-all duration-500">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-200 border-b-purple-600 mx-auto animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Loading Chat
          </h2>
          <p className="text-gray-600 font-medium text-lg mb-4">Setting up your conversation space...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gradient-to-br from-pink-50 via-pink-50 to-pink-100">
      {/* Chat Rooms Sidebar */}
      <div className="w-full md:w-80 lg:w-96 bg-pink-50/90 backdrop-blur-sm border-r border-pink-200/30 flex flex-col shadow-[0_8px_30px_rgb(233,30,99,0.15)]">
        <div className="p-4 border-b border-gradient-to-r from-pink-100 to-pink-100 bg-gradient-to-r from-pink-50/50 to-pink-50/50">
          <h2 className="text-sm font-bold bg-gradient-to-r from-pink-600 to-pink-600 bg-clip-text text-transparent">User Chats</h2>
          <p className="text-sm text-pink-600 mt-1 font-medium">{chatRooms.length} conversations</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {chatRooms.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-2M5 8h2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v2m-6 0h4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3">No Conversations</h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium">Chat rooms will appear here when users start conversations</p>
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedChatRoom(room)}
                className={`m-2 p-4 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg ${
                  selectedChatRoom?.id === room.id 
                    ? 'bg-gradient-to-r from-pink-500 to-pink-500 text-white shadow-xl' 
                    : 'bg-pink-50/70 hover:bg-pink-100/90 shadow-md border border-pink-200/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedChatRoom?.id === room.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gradient-to-br from-pink-400 to-pink-500 text-white'
                  }`}>
                    {room.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-base truncate ${
                      selectedChatRoom?.id === room.id ? 'text-white' : 'text-pink-800'
                    }`}>{room.userName}</h3>
                    <p className={`text-sm truncate ${
                      selectedChatRoom?.id === room.id ? 'text-white/80' : 'text-pink-600'
                    }`}>{room.userEmail}</p>
                    <p className={`text-sm truncate mt-1 ${
                      selectedChatRoom?.id === room.id ? 'text-white/70' : 'text-pink-500'
                    }`}>{room.lastMessage}</p>
                    {room.unreadCount > 0 && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mt-2 ${
                        selectedChatRoom?.id === room.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-pink-600 text-white'
                      }`}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`${selectedChatRoom ? 'block' : 'hidden sm:block'} flex-1 flex flex-col bg-pink-50/30 backdrop-blur-sm`}>
        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-pink-50/80 backdrop-blur-md border-b border-pink-200/30 p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedChatRoom(null)}
                  className="sm:hidden p-2 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {selectedChatRoom.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-pink-800 truncate">{selectedChatRoom.userName}</h3>
                  <p className="text-sm text-pink-600 font-medium truncate">{selectedChatRoom.userEmail}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-pink-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-pink-50/30">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-pink-200 to-pink-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-pink-700 mb-4">Start a conversation</h3>
                    <p className="text-sm sm:text-base text-pink-500 max-w-md mx-auto leading-relaxed">
                      Choose a chat room from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isAdmin = message.senderType === 'admin';
                  return (
                    <div
                        key={message.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg ${
                          isAdmin 
                            ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white transform hover:scale-[1.02]' 
                            : 'bg-pink-50/90 backdrop-blur-sm text-pink-800 border border-pink-200/50 transform hover:scale-[1.02]'
                        }`}>
                          {message.type === 'text' ? (
                            <p className="text-sm leading-relaxed font-medium break-words">{message.content}</p>
                          ) : (
                            <div className="space-y-2">
                              {message.imageUrl && (
                                <div className="relative w-48 h-36">
                                  <img
                                    src={message.imageUrl}
                                    alt={message.imageName || 'Shared image'}
                                    className="w-full h-full object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                  />
                                </div>
                              )}
                              <p className="text-xs opacity-75 font-medium">{message.imageName}</p>
                            </div>
                          )}
                          <p className={`text-xs mt-2 font-medium ${
                            isAdmin ? 'text-white/70' : 'text-pink-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-pink-50/80 backdrop-blur-md border-t border-pink-200/30 p-4 shadow-2xl">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="p-3 text-pink-500 hover:text-pink-600 transition-all duration-300 bg-pink-50/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transform hover:scale-110 border border-pink-200 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="flex-1 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 bg-pink-50/90 backdrop-blur-sm shadow-md text-pink-800 placeholder-pink-500 font-medium disabled:opacity-50 text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-bold text-sm"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50/50 to-pink-50/50 p-1">
            <div className="text-center p-2 max-w-xs mx-auto">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xl">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                </svg>
              </div>
              <h3 className="text-[8px] font-bold bg-gradient-to-r from-pink-600 to-pink-600 bg-clip-text text-transparent mb-1">Select a conversation</h3>
              <p className="text-pink-600 font-medium text-[6px] mb-2">Choose a chat from the sidebar to start messaging</p>
              <div className="p-1 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50 shadow-md">
                <p className="text-[6px] text-pink-500">💬 Professional chat interface for seamless communication</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component that handles early returns before any hooks
export default function ChatPage() {
  // Check if Firebase is configured - must be first
  if (!isFirebaseConfigured()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat Service Unavailable</h2>
          <p className="text-gray-600 mb-4">
            Firebase is not configured. Please set up your Firebase environment variables to use the chat feature.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator for assistance with Firebase configuration.
          </p>
        </div>
      </div>
    );
  }

  // Additional safety check for db and storage
  if (!db || !storage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Service Unavailable</h2>
          <p className="text-gray-600 mb-4">
            Firebase database or storage is not available. Please check your configuration.
          </p>
        </div>
      </div>
    );
  }

  // Render the main chat component
  return <ChatComponent />;
}