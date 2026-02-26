import { create } from 'zustand';
import { gamificationService } from '../api/services';
import type { GamificationProfile, BadgeOut } from '../types';

interface GamificationState {
  profile: GamificationProfile | null;
  isLoading: boolean;
  error: string | null;
  recentBadges: BadgeOut[];
  fetchProfile: () => Promise<void>;
  addRecentBadges: (badges: BadgeOut[]) => void;
  clearRecentBadges: () => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  recentBadges: [],

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await gamificationService.getProfile();
      set({ profile: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch gamification profile',
        isLoading: false,
      });
    }
  },

  addRecentBadges: (badges) => {
    if (badges && badges.length > 0) {
      set((state) => ({ recentBadges: [...state.recentBadges, ...badges] }));
    }
  },

  clearRecentBadges: () => {
    set({ recentBadges: [] });
  }
}));
