import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { getSocket } from "@/lib/socket";

export const usePresenceStore = create((set, get) => ({
  onlineUsers: new Map(), // userId -> "online" | "away" | "offline"
  socketListenersRegistered: false,

  setPresence: (userId, status) => {
    set((state) => {
      const updated = new Map(state.onlineUsers);
      updated.set(userId, status);
      return { onlineUsers: updated };
    });
  },

  bulkSetPresence: (users) => {
    set((state) => {
      const updated = new Map(state.onlineUsers);
      users.forEach(({ userId, status }) => updated.set(userId, status));
      return { onlineUsers: updated };
    });
  },

  isOnline: (userId) => {
    return get().onlineUsers.get(userId) === "online";
  },

  getStatus: (userId) => {
    return get().onlineUsers.get(userId) || "offline";
  },

  registerSocketListeners: () => {
    const socket = getSocket();
    if (!socket || get().socketListenersRegistered) return;

    socket.on("presence:update", ({ userId, status }) => {
      get().setPresence(userId, status);
    });

    socket.on("presence:bulk", ({ users }) => {
      get().bulkSetPresence(users);
    });

    set({ socketListenersRegistered: true });
  },
}));
