import { StateCreator } from 'zustand';
import { UIState, UIActions } from '../types';
import storageUtils, { STORAGE_KEYS } from '../storage';

export interface UISlice extends UIActions {
  ui: UIState;
}

// Default UI state
const defaultUIState: UIState = {
  isLoading: false,
  loadingMessage: undefined,
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
    radius: 10, // default 10km radius
  },
};

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set, get) => ({
  // Initial state
  ui: defaultUIState,

  // Actions
  setUILoading: (loading: boolean, message?: string) => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        isLoading: loading,
        loadingMessage: loading ? message : undefined,
      }
    });
  },

  setError: (error: string | null) => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        error,
      }
    });
  },

  openModal: (modal: keyof UIState['modals']) => {
    console.log('📱 Opening modal:', modal);

    const { ui } = get();
    set({
      ui: {
        ...ui,
        modals: {
          ...ui.modals,
          [modal]: true,
        }
      }
    });
  },

  closeModal: (modal: keyof UIState['modals']) => {
    console.log('📱 Closing modal:', modal);

    const { ui } = get();
    set({
      ui: {
        ...ui,
        modals: {
          ...ui.modals,
          [modal]: false,
        }
      }
    });
  },

  closeAllModals: () => {
    console.log('📱 Closing all modals');

    const { ui } = get();
    set({
      ui: {
        ...ui,
        modals: {
          publishOptions: false,
          jobDetails: false,
          profile: false,
          settings: false,
          filters: false,
        }
      }
    });
  },

  openBottomSheet: (content: UIState['bottomSheet']['content'], data?: any) => {
    console.log('📄 Opening bottom sheet with content:', content);

    const { ui } = get();
    set({
      ui: {
        ...ui,
        bottomSheet: {
          isVisible: true,
          content,
          data,
        }
      }
    });
  },

  closeBottomSheet: () => {
    console.log('📄 Closing bottom sheet');

    const { ui } = get();
    set({
      ui: {
        ...ui,
        bottomSheet: {
          isVisible: false,
          content: null,
          data: null,
        }
      }
    });
  },

  setFilters: (filters: Partial<UIState['activeFilters']>) => {
    console.log('🔍 Setting filters:', filters);

    const { ui } = get();
    const updatedFilters = {
      ...ui.activeFilters,
      ...filters,
    };

    set({
      ui: {
        ...ui,
        activeFilters: updatedFilters,
      }
    });

    // Cache filters for persistence across app restarts
    storageUtils.setJSON(STORAGE_KEYS.FILTERS, updatedFilters)
      .catch(console.error);
  },

  clearFilters: () => {
    console.log('🧹 Clearing all filters');

    const { ui } = get();
    const clearedFilters: UIState['activeFilters'] = {
      radius: 10, // Keep default radius
    };

    set({
      ui: {
        ...ui,
        activeFilters: clearedFilters,
      }
    });

    // Cache cleared filters
    storageUtils.setJSON(STORAGE_KEYS.FILTERS, clearedFilters)
      .catch(console.error);
  },
});