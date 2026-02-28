import api from './client';
import type { GamificationProfile, LeaderboardEntry, GuildOut } from '../types';

const gamificationService = {
  getProfile: async () => {
    const response = await api.get<GamificationProfile>('/gamification/profile');
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get<LeaderboardEntry[]>('/gamification/leaderboard');
    return response.data;
  },

  awardXP: async (event: string, score?: number) => {
    const response = await api.post('/gamification/award-xp', { event, score });
    return response.data;
  },

  buyPowerUp: async (item_key: string) => {
    const response = await api.post(`/gamification/buy-powerup?item_key=${item_key}`);
    return response.data;
  },

  listGuilds: async () => {
    const response = await api.get<GuildOut[]>('/gamification/guilds');
    return response.data;
  },

  createGuild: async (name: string, description: string) => {
    const response = await api.post(`/gamification/guilds/create?name=${name}&description=${description}`);
    return response.data;
  },

  joinGuild: async (guildId: string) => {
    const response = await api.post(`/gamification/guilds/join?guild_id=${guildId}`);
    return response.data;
  },

  leaveGuild: async () => {
    const response = await api.post('/gamification/guilds/leave');
    return response.data;
  }
};

export default gamificationService;
