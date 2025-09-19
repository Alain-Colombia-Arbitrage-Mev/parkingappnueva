import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createJobsSlice, type JobsSlice } from './slices/jobsSlice';
import { createNotificationsSlice, type NotificationsSlice } from './slices/notificationsSlice';
import { createMessagesSlice, type MessagesSlice } from './slices/messagesSlice';
import { createLocationSlice, type LocationSlice } from './slices/locationSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

import { ConnectivityState } from './types';
import storageUtils, { STORAGE_KEYS, migrationUtils } from './storage';

// Combined store type
export interface AppStore extends
  AuthSlice,
  JobsSlice,
  NotificationsSlice,
  MessagesSlice,
  LocationSlice,
  SettingsSlice,
  UISlice {
  // Connectivity state
  connectivity: ConnectivityState;

  // Global actions
  hydrate: () => Promise<void>;
  clearAll: () => Promise<void>;
  sync: () => Promise<void>;
  setConnectivity: (connectivity: ConnectivityState) => void;
}

// Create the store with all slices
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get, api) => ({
          // Combine all slices
          ...createAuthSlice(set, get, api),
          ...createJobsSlice(set, get, api),
          ...createNotificationsSlice(set, get, api),
          ...createMessagesSlice(set, get, api),
          ...createLocationSlice(set, get, api),
          ...createSettingsSlice(set, get, api),
          ...createUISlice(set, get, api),

          // Connectivity state
          connectivity: {
            isOnline: true,
            isWifiConnected: false,
            connectionType: 'cellular',
            canSync: true,
          },

          // Global actions
          hydrate: async () => {
            console.log('💧 Hydrating store from storage...');

            try {
              // Check if migration is needed
              const currentVersion = '1.0.0'; // App version
              if (await migrationUtils.needsMigration(currentVersion)) {
                console.log('🔄 Running storage migration...');
                const storedVersion = await migrationUtils.getCurrentVersion();
                await migrationUtils.migrateFromVersion(storedVersion, currentVersion);
              }

              // Load cached data
              const [
                cachedUser,
                cachedToken,
                cachedRefreshToken,
                cachedSettings,
                cachedLocation,
                cachedFilters,
                cachedNotifications,
                cachedFavorites,
              ] = await Promise.all([
                storageUtils.getJSON(STORAGE_KEYS.USER_DATA),
                storageUtils.getJSON(STORAGE_KEYS.AUTH_TOKEN),
                storageUtils.getJSON(STORAGE_KEYS.REFRESH_TOKEN),
                storageUtils.getJSON(STORAGE_KEYS.SETTINGS),
                storageUtils.getJSON(STORAGE_KEYS.LOCATION),
                storageUtils.getJSON(STORAGE_KEYS.FILTERS),
                storageUtils.getJSON(STORAGE_KEYS.NOTIFICATIONS),
                storageUtils.getJSON('favorites'),
              ]);

              // Restore auth state
              if (cachedUser && cachedToken) {
                set((state) => {
                  state.isAuthenticated = true;
                  state.user = cachedUser;
                  state.token = cachedToken;
                  state.refreshToken = cachedRefreshToken;
                });
              }

              // Restore settings
              if (cachedSettings) {
                set((state) => {
                  state.settings = cachedSettings;
                });
              }

              // Restore location
              if (cachedLocation) {
                set((state) => {
                  state.currentLocation = cachedLocation;
                });
              }

              // Restore UI filters
              if (cachedFilters) {
                set((state) => {
                  state.ui.activeFilters = cachedFilters;
                });
              }

              // Restore notifications
              if (cachedNotifications) {
                const unreadCount = cachedNotifications.filter((n: any) => !n.isRead).length;
                set((state) => {
                  state.notifications = cachedNotifications;
                  state.unreadCount = unreadCount;
                });
              }

              // Restore favorites
              if (cachedFavorites) {
                set((state) => {
                  state.favorites = cachedFavorites;
                });
              }

              console.log('✅ Store hydrated successfully');
            } catch (error) {
              console.error('❌ Failed to hydrate store:', error);
            }
          },

          clearAll: async () => {
            console.log('🧹 Clearing all store data...');

            try {
              // Clear storage
              await storageUtils.clear();

              // Reset store to initial state
              set((state) => {
                // Reset auth
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.isLoading = false;
                state.error = null;

                // Reset jobs
                state.jobs = [];
                state.proposals = [];
                state.favorites = [];

                // Reset notifications
                state.notifications = [];
                state.unreadCount = 0;

                // Reset messages
                state.conversations = [];
                state.messages = {};
                state.typingUsers = {};

                // Reset location
                state.currentLocation = null;
                state.hasLocationPermission = false;
                state.locationLoading = false;
                state.locationError = null;

                // Reset UI
                state.ui = {
                  isLoading: false,
                  error: null,
                  modals: {
                    publishOptions: false,
                    jobDetails: false,
                    profile: false,
                    settings: false,
                    filters: false,
                  },
                  bottomSheet: {
                    isVisible: false,
                    content: null,
                    data: null,
                  },
                  activeFilters: {
                    radius: 10,
                  },
                };

                // Keep settings with defaults
                // (settings are not cleared to maintain user preferences)
              });

              console.log('✅ Store cleared successfully');
            } catch (error) {
              console.error('❌ Failed to clear store:', error);
              throw error;
            }
          },

          sync: async () => {
            const { connectivity, isAuthenticated } = get();

            if (!connectivity.canSync || !connectivity.isOnline) {
              console.log('📡 Sync skipped - no connectivity');
              return;
            }

            if (!isAuthenticated) {
              console.log('📡 Sync skipped - not authenticated');
              return;
            }

            try {
              console.log('🔄 Syncing data with server...');

              // Trigger data fetches for authenticated user
              await Promise.allSettled([
                get().fetchJobs(),
                get().fetchNotifications(),
                get().fetchConversations(),
              ]);

              console.log('✅ Sync completed');
            } catch (error) {
              console.error('❌ Sync failed:', error);
            }
          },

          setConnectivity: (connectivity: ConnectivityState) => {
            set((state) => {
              state.connectivity = connectivity;
            });

            // Auto-sync when connectivity is restored
            if (connectivity.canSync && connectivity.isOnline) {
              setTimeout(() => get().sync(), 1000);
            }
          },
        }),
        {
          name: 'parkiing-app-store',
          storage: createJSONStorage(() => AsyncStorage),
          partialize: (state) => ({
            // Only persist essential data
            isAuthenticated: state.isAuthenticated,
            user: state.user,
            settings: state.settings,
            favorites: state.favorites,
            ui: {
              activeFilters: state.ui.activeFilters,
            },
          }),
          version: 1,
          migrate: (persistedState: any, version) => {
            console.log('🔄 Migrating persisted state from version', version);

            if (version === 0) {
              // Migration from version 0 to 1
              return {
                ...persistedState,
                // Add any necessary migrations here
              };
            }

            return persistedState;
          },
        }
      )
    )
  )
);

// Setup connectivity monitoring
let unsubscribeNetInfo: (() => void) | null = null;

export const initializeConnectivityMonitoring = () => {
  unsubscribeNetInfo = NetInfo.addEventListener(state => {
    const connectivity: ConnectivityState = {
      isOnline: state.isConnected ?? false,
      isWifiConnected: state.type === 'wifi',
      connectionType: state.type === 'wifi' ? 'wifi' :
                     state.type === 'cellular' ? 'cellular' : 'none',
      canSync: (state.isConnected ?? false) &&
               (state.type === 'wifi' || state.type === 'cellular'),
    };

    useAppStore.getState().setConnectivity(connectivity);
  });
};

export const stopConnectivityMonitoring = () => {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
};

// Auto-subscribe to auth changes for data sync
useAppStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, prevIsAuthenticated) => {
    if (isAuthenticated && !prevIsAuthenticated) {
      // User just logged in, sync data
      setTimeout(() => {
        useAppStore.getState().sync();
      }, 1000);
    } else if (!isAuthenticated && prevIsAuthenticated) {
      // User just logged out, clear sensitive data but keep settings
      const { settings } = useAppStore.getState();
      useAppStore.getState().clearAll().then(() => {
        useAppStore.setState({ settings });
      });
    }
  }
);

// Cleanup utilities
export const cleanupStore = () => {
  stopConnectivityMonitoring();
};

// Export store hooks for easier usage
export const useAuth = () => useAppStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  user: state.user,
  token: state.token,
  isLoading: state.isLoading,
  error: state.error,
  login: state.login,
  logout: state.logout,
  register: state.register,
  updateProfile: state.updateProfile,
}));

export const useJobs = () => useAppStore((state) => ({
  jobs: state.jobs,
  proposals: state.proposals,
  favorites: state.favorites,
  fetchJobs: state.fetchJobs,
  fetchJobById: state.fetchJobById,
  createJob: state.createJob,
  submitProposal: state.submitProposal,
  addToFavorites: state.addToFavorites,
  removeFromFavorites: state.removeFromFavorites,
}));

export const useNotifications = () => useAppStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  fetchNotifications: state.fetchNotifications,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  addNotification: state.addNotification,
}));

export const useMessages = () => useAppStore((state) => ({
  conversations: state.conversations,
  messages: state.messages,
  typingUsers: state.typingUsers,
  fetchConversations: state.fetchConversations,
  fetchMessages: state.fetchMessages,
  sendMessage: state.sendMessage,
  createConversation: state.createConversation,
}));

export const useLocation = () => useAppStore((state) => ({
  currentLocation: state.currentLocation,
  hasLocationPermission: state.hasLocationPermission,
  locationLoading: state.locationLoading,
  locationError: state.locationError,
  getCurrentLocation: state.getCurrentLocation,
  calculateDistance: state.calculateDistance,
}));

export const useSettings = () => useAppStore((state) => ({
  settings: state.settings,
  updateSettings: state.updateSettings,
  setLanguage: state.setLanguage,
  setCurrency: state.setCurrency,
  setTheme: state.setTheme,
  toggleNotification: state.toggleNotification,
}));

export const useUI = () => useAppStore((state) => ({
  ui: state.ui,
  setLoading: state.setLoading,
  setError: state.setError,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  openBottomSheet: state.openBottomSheet,
  closeBottomSheet: state.closeBottomSheet,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
}));

export const useConnectivity = () => useAppStore((state) => ({
  connectivity: state.connectivity,
  sync: state.sync,
}));

// Export the store instance
export default useAppStore;