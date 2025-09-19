// Integration layer between Zustand store and Socket.io

import React from 'react';
import { useAppStore } from '../index';
import { socketService } from '../../services/socketService';
import { Message } from '../types';
import { Message as SocketMessage } from '../../services/socketService';

export const socketIntegration = {
  // Initialize socket connection
  async initializeSocket(userId: string): Promise<boolean> {
    try {
      console.log('🔌 Initializing socket connection for user:', userId);

      const connected = await socketService.connect(userId);
      if (connected) {
        console.log('✅ Socket connected successfully');
        setupSocketListeners();
        return true;
      } else {
        console.log('⚠️ Socket connection disabled (development mode)');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      return false;
    }
  },

  // Disconnect socket
  disconnectSocket(): void {
    console.log('🔌 Disconnecting socket');
    socketService.removeAllListeners();
    socketService.disconnect();
  },

  // Join conversation
  joinConversation(conversationId: string): void {
    console.log('💬 Joining conversation:', conversationId);
    socketService.joinConversation(conversationId);
  },

  // Leave conversation
  leaveConversation(conversationId: string): void {
    console.log('💬 Leaving conversation:', conversationId);
    socketService.leaveConversation(conversationId);
  },

  // Send message via socket
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    console.log('📤 Sending message via socket:', message.conversationId);
    socketService.sendMessage(message);
  },

  // Emit typing status
  emitTyping(conversationId: string, isTyping: boolean): void {
    socketService.emitTyping(conversationId, isTyping);
  },

  // Mark message as read
  markAsRead(conversationId: string, messageId: string): void {
    socketService.markAsRead(conversationId, messageId);
  },

  // Get connection status
  isConnected(): boolean {
    return socketService.isConnected();
  },
};

// Setup socket event listeners
function setupSocketListeners(): void {
  const store = useAppStore.getState();

  // Listen for new messages
  socketService.onNewMessage((message: SocketMessage) => {
    console.log('📨 Received new message via socket:', message.id);
    // Convert SocketMessage to store Message format
    const storeMessage: Message = {
      ...message,
      timestamp: message.createdAt || Date.now(),
      type: message.messageType,
      isRead: message.isRead || false,
      createdAt: message.createdAt || Date.now()
    };
    store.addMessage(storeMessage);

    // Add notification for new message
    store.addNotification({
      userId: message.receiverId,
      type: 'message',
      title: 'Nuevo mensaje',
      message: 'Tienes un nuevo mensaje',
      data: {
        conversationId: message.conversationId,
        senderId: message.senderId,
        messageId: message.id,
      },
      isRead: false,
    });
  });

  // Listen for typing indicators
  socketService.onTyping((data: { userId: string; conversationId: string; isTyping: boolean }) => {
    console.log('⌨️ Typing status changed:', data);
    store.updateTypingStatus(data.conversationId, data.userId, data.isTyping);
  });

  // Listen for user status changes
  socketService.onUserStatusChange((data: { userId: string; isOnline: boolean }) => {
    console.log('👤 User status changed:', data);
    // TODO: Update user online status in store
  });

  // Listen for message read confirmations
  socketService.onMessageRead((data: { conversationId: string; messageId: string; readBy: string }) => {
    console.log('👀 Message read confirmation:', data);
    // TODO: Update message read status in store
  });
}

// React hook for socket integration
export const useSocketIntegration = () => {
  const { isAuthenticated, user } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  // Initialize socket when user logs in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      socketIntegration.initializeSocket(user.id);
    } else {
      socketIntegration.disconnectSocket();
    }

    // Cleanup on unmount
    return () => {
      socketIntegration.disconnectSocket();
    };
  }, [isAuthenticated, user]);

  return {
    isConnected: socketIntegration.isConnected(),
    joinConversation: socketIntegration.joinConversation,
    leaveConversation: socketIntegration.leaveConversation,
    sendMessage: socketIntegration.sendMessage,
    emitTyping: socketIntegration.emitTyping,
    markAsRead: socketIntegration.markAsRead,
  };
};

export default socketIntegration;