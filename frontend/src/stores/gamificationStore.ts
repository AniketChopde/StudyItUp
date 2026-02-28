import { create } from 'zustand';
import gamificationService from '../api/gamificationService';
import type { GamificationProfile, BadgeOut, LeaderboardEntry, GuildOut } from '../types';

interface GamificationState {
  profile: GamificationProfile | null;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  recentBadges: BadgeOut[];
  guilds: GuildOut[];
  fetchProfile: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchGuilds: () => Promise<void>;
  addRecentBadges: (badges: BadgeOut[]) => void;
  clearRecentBadges: () => void;
  buyPowerUp: (itemKey: string) => Promise<void>;
  joinGuild: (guildId: string) => Promise<void>;
  leaveGuild: () => Promise<void>;
  createGuild: (name: string, description: string) => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  profile: null,
  leaderboard: [],
  isLoading: false,
  error: null,
  recentBadges: [],
  guilds: [],

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await gamificationService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch gamification profile',
        isLoading: false,
      });
    }
  },

  fetchLeaderboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const leaderboard = await gamificationService.getLeaderboard();
      set({ leaderboard, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch leaderboard',
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
  },

  buyPowerUp: async (itemKey: string) => {
    try {
      set({ isLoading: true, error: null });
      await gamificationService.buyPowerUp(itemKey);
      // Refresh profile to update coins and inventory
      const profile = await gamificationService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to buy power-up',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchGuilds: async () => {
    try {
      set({ isLoading: true });
      const guilds = await gamificationService.listGuilds();
      set({ guilds, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  joinGuild: async (guildId: string) => {
    try {
      set({ isLoading: true });
      await gamificationService.joinGuild(guildId);
      const profile = await gamificationService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  leaveGuild: async () => {
    try {
      set({ isLoading: true });
      await gamificationService.leaveGuild();
      const profile = await gamificationService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createGuild: async (name: string, description: string) => {
    try {
      set({ isLoading: true });
      await gamificationService.createGuild(name, description);
      const profile = await gamificationService.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
