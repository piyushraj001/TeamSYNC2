import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

export const useChannelStore = create((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  hasMore: false,
  loadingMessages: false,
  typingUsers: {}, // channelId -> [{userId, displayName}]
  socketListenersRegistered: false,

  fetchChannels: async (workspaceId) => {
    try {
      const res = await axiosInstance.get(`/workspaces/${workspaceId}/channels`);
      set({ channels: res.data.channels });
      return res.data.channels;
    } catch {
      return [];
    }
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel, messages: [], hasMore: false });
  },

  fetchMessages: async (channelId, before = null) => {
    set({ loadingMessages: true });
    try {
      const params = { limit: 50 };
      if (before) params.before = before;
      const res = await axiosInstance.get(`/channels/${channelId}/messages`, { params });
      const { messages, hasMore } = res.data;

      if (before) {
        // Prepend older messages
        set((state) => ({ messages: [...messages, ...state.messages], hasMore }));
      } else {
        set({ messages, hasMore });
      }
      return messages;
    } catch {
      return [];
    } finally {
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (channelId, content) => {
    const socket = getSocket();
    const tempId = `temp_${Date.now()}`;

    if (socket?.connected) {
      socket.emit("message:send", { channelId, content, tempId });
    } else {
      // REST fallback
      try {
        await axiosInstance.post(`/channels/${channelId}/messages`, { content });
      } catch {
        toast.error("Failed to send message");
      }
    }
  },

  createChannel: async (workspaceId, data) => {
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/channels`, data);
      toast.success(`#${res.data.channel.name} created!`);
      return res.data.channel;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create channel");
      return null;
    }
  },

  joinChannel: async (channelId) => {
    try {
      await axiosInstance.post(`/channels/${channelId}/join`);
      const socket = getSocket();
      if (socket) socket.emit("channel:join", { channelId });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join channel");
      return false;
    }
  },

  leaveChannel: async (channelId) => {
    try {
      await axiosInstance.delete(`/channels/${channelId}/members/me`);
      const socket = getSocket();
      if (socket) socket.emit("channel:leave", { channelId });
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        activeChannel: state.activeChannel?.id === channelId ? null : state.activeChannel,
      }));
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to leave channel");
      return false;
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Deduplicate by id
      const exists = state.messages.find((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (updated) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === updated.id ? updated : m)),
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  setTypingUsers: (channelId, users) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [channelId]: users },
    }));
  },

  emitTyping: (channelId, typing) => {
    const socket = getSocket();
    if (!socket) return;
    if (typing) {
      socket.emit("typing:start", { channelId });
    } else {
      socket.emit("typing:stop", { channelId });
    }
  },

  registerSocketListeners: () => {
    const socket = getSocket();
    if (!socket || get().socketListenersRegistered) return;

    socket.on("message:new", ({ message }) => {
      const { activeChannel } = get();
      if (activeChannel?.id === message.channelId) {
        get().addMessage(message);
      }
    });

    socket.on("message:updated", ({ message }) => {
      get().updateMessage(message);
    });

    socket.on("message:deleted", ({ messageId }) => {
      get().deleteMessage(messageId);
    });

    socket.on("typing:update", ({ channelId, users }) => {
      get().setTypingUsers(channelId, users);
    });

    socket.on("channel:new", ({ channel }) => {
      set((state) => {
        if (state.channels.find((c) => c.id === channel.id)) return state;
        return { channels: [...state.channels, channel] };
      });
    });

    socket.on("channel:deleted", ({ channelId }) => {
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        activeChannel: state.activeChannel?.id === channelId ? null : state.activeChannel,
      }));
    });

    set({ socketListenersRegistered: true });
  },

  clearChannel: () => {
    set({ activeChannel: null, messages: [], hasMore: false, typingUsers: {} });
  },
}));
