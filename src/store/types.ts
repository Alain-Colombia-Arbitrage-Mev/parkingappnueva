// Core type definitions for the application state management

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'handyman' | 'client' | 'business';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  skills?: string[];
  categories?: string[];
  rating?: number;
  isVerified?: boolean;
  verifiedAt?: number;
  bio?: string;
  hourlyRate?: number;
  currency?: string;
  availability?: string;
  completedJobs?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  clientId: string;
  handymanId?: string;
  status: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  isUrgent?: boolean;
  deadline?: number;
  completedAt?: number;
  finalPrice?: number;
  distance?: number;
  createdAt: number;
  updatedAt: number;
}

export interface JobProposal {
  id: string;
  jobId: string;
  handymanId: string;
  proposedPrice: number;
  estimatedDuration?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'job_match' | 'proposal_received' | 'job_assigned' | 'message' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessageId?: string;
  lastMessageAt: number;
  jobId?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GeolocationPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface AppSettings {
  language: 'es' | 'en' | 'pt';
  currency: 'USD' | 'COP' | 'BRL';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    jobMatches: boolean;
    messages: boolean;
    proposals: boolean;
  };
  location: {
    shareLocation: boolean;
    radius: number; // in kilometers
  };
  privacy: {
    profileVisible: boolean;
    showPhone: boolean;
    showEmail: boolean;
  };
}

export interface UIState {
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  modals: {
    publishOptions: boolean;
    jobDetails: boolean;
    profile: boolean;
    settings: boolean;
    filters: boolean;
  };
  bottomSheet: {
    isVisible: boolean;
    content: 'job' | 'proposal' | 'message' | null;
    data: any;
  };
  activeFilters: {
    category?: string;
    location?: GeolocationPosition;
    radius: number;
    priceRange?: { min: number; max: number };
    jobType?: 'all' | 'urgent' | 'regular';
  };
}

export interface ConnectivityState {
  isOnline: boolean;
  isWifiConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none';
  canSync: boolean;
}

// Store type definitions
export interface AuthActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface JobsActions {
  fetchJobs: (filters?: Partial<UIState['activeFilters']>) => Promise<void>;
  fetchJobById: (id: string) => Promise<Job | null>;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  submitProposal: (proposal: Omit<JobProposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  acceptProposal: (proposalId: string) => Promise<void>;
  rejectProposal: (proposalId: string) => Promise<void>;
  markJobComplete: (jobId: string) => Promise<void>;
  addToFavorites: (jobId: string) => Promise<void>;
  removeFromFavorites: (jobId: string) => Promise<void>;
  setJobs: (jobs: Job[]) => void;
  setProposals: (proposals: JobProposal[]) => void;
  setFavorites: (favorites: string[]) => void;
  updateJobDistance: (jobId: string, distance: number) => void;
}

export interface NotificationsActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  setNotifications: (notifications: Notification[]) => void;
  updateUnreadCount: () => void;
}

export interface MessagesActions {
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  createConversation: (participants: string[], jobId?: string) => Promise<string>;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export interface LocationActions {
  getCurrentLocation: (force?: boolean) => Promise<GeolocationPosition | null>;
  setCurrentLocation: (location: GeolocationPosition) => void;
  updateLocationPermission: (hasPermission: boolean) => void;
  calculateDistance: (destination: GeolocationPosition) => number | null;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
}

export interface SettingsActions {
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => void;
  setLanguage: (language: AppSettings['language']) => void;
  setCurrency: (currency: AppSettings['currency']) => void;
  setTheme: (theme: AppSettings['theme']) => void;
  toggleNotification: (type: keyof AppSettings['notifications']) => void;
}

export interface UIActions {
  setUILoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  openBottomSheet: (content: UIState['bottomSheet']['content'], data?: any) => void;
  closeBottomSheet: () => void;
  setFilters: (filters: Partial<UIState['activeFilters']>) => void;
  clearFilters: () => void;
}

// Combined store type
export interface AppStore extends
  AuthState,
  AuthActions,
  JobsActions,
  NotificationsActions,
  MessagesActions,
  LocationActions,
  SettingsActions,
  UIActions {
  // Jobs state
  jobs: Job[];
  proposals: JobProposal[];
  favorites: string[];

  // Notifications state
  notifications: Notification[];
  unreadCount: number;

  // Messages state
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;

  // Location state
  currentLocation: GeolocationPosition | null;
  hasLocationPermission: boolean;
  locationLoading: boolean;
  locationError: string | null;

  // Settings state
  settings: AppSettings;

  // UI state
  ui: UIState;

  // Connectivity state
  connectivity: ConnectivityState;

  // Global actions
  hydrate: () => Promise<void>;
  clearAll: () => Promise<void>;
  sync: () => Promise<void>;
}