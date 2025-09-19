import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  SETTINGS: 'app_settings',
  LOCATION: 'last_location',
  FILTERS: 'active_filters',
  NOTIFICATIONS: 'notifications_cache',
  CONVERSATIONS: 'conversations_cache',
  JOBS_CACHE: 'jobs_cache',
  ONBOARDING: 'onboarding_completed',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
} as const;

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
}

// High-performance storage adapter using AsyncStorage
export const secureStorage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('SecureStorage clear error:', error);
      throw error;
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('SecureStorage getAllKeys error:', error);
      return [];
    }
  },
};

// Fallback storage adapter using AsyncStorage
export const asyncStorage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },
};

// Main storage instance (uses AsyncStorage)
let storage: StorageAdapter = secureStorage;

// Storage utility functions
export const storageUtils = {
  // Set the storage adapter
  setAdapter(adapter: StorageAdapter) {
    storage = adapter;
  },

  // Get JSON data
  async getJSON<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const data = await storage.getItem(key);
      if (data === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Storage getJSON error for key ${key}:`, error);
      return defaultValue ?? null;
    }
  },

  // Set JSON data
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Storage setJSON error for key ${key}:`, error);
      throw error;
    }
  },

  // Remove data
  async remove(key: string): Promise<void> {
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      throw error;
    }
  },

  // Clear all data
  async clear(): Promise<void> {
    try {
      await storage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const value = await storage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Storage exists error for key ${key}:`, error);
      return false;
    }
  },

  // Get all keys
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await storage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },

  // Batch operations
  async setMultiple<T extends Record<string, any>>(data: T): Promise<void> {
    try {
      const promises = Object.entries(data).map(([key, value]) =>
        this.setJSON(key, value)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      throw error;
    }
  },

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const promises = keys.map(async (key) => {
        const value = await this.getJSON<T>(key);
        return [key, value] as const;
      });
      const results = await Promise.all(promises);
      return Object.fromEntries(results);
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  },

  // Storage size estimation
  async getStorageSize(): Promise<number> {
    try {
      const keys = await storage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await storage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Storage getStorageSize error:', error);
      return 0;
    }
  },

  // Cleanup old data (remove items older than specified days)
  async cleanup(daysOld: number = 30): Promise<void> {
    try {
      const keys = await storage.getAllKeys();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      for (const key of keys) {
        if (key.includes('_cache') || key.includes('_temp')) {
          const data = await storage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && parsed.timestamp < cutoffTime) {
                await storage.removeItem(key);
              }
            } catch {
              // If we can't parse it, it might be old format, remove it
              await storage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Storage cleanup error:', error);
    }
  },
};

// Export default storage instance
export default storageUtils;

// Storage migration utilities
export const migrationUtils = {
  async migrateFromVersion(fromVersion: string, toVersion: string): Promise<void> {
    try {
      console.log(`Migrating storage from ${fromVersion} to ${toVersion}`);

      // Add version-specific migrations here
      switch (fromVersion) {
        case '1.0.0':
          await this.migrateFrom1_0_0();
          break;
        default:
          console.log('No migration needed');
      }

      await storageUtils.setJSON('app_version', toVersion);
    } catch (error) {
      console.error('Storage migration error:', error);
      throw error;
    }
  },

  async migrateFrom1_0_0(): Promise<void> {
    // Example migration from version 1.0.0
    // Convert old auth format to new format
    const oldAuth = await storageUtils.getJSON('auth');
    if (oldAuth) {
      await storageUtils.setJSON(STORAGE_KEYS.USER_DATA, oldAuth);
      await storageUtils.remove('auth');
    }
  },

  async getCurrentVersion(): Promise<string> {
    const version = await storageUtils.getJSON('app_version', '1.0.0');
    return version || '1.0.0';
  },

  async needsMigration(currentVersion: string): Promise<boolean> {
    const storedVersion = await this.getCurrentVersion();
    return storedVersion !== currentVersion;
  },
};