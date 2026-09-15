import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

export const useDMStore = create((set, get) => ({
  conversations: [],
  activeDM: null,       // { conversationId, recipient }
  dmMessages: [],
  hasMore: false,
  loadingMessages: false,
  typingUsers: {},      // conversationId -> Set<userId>
  socketListenersRegistered: false,

  fetchConversations: async () => {
    try {
      const res = await axiosInstance.get("/dms");
      set({ conversations: res.data.conversations });
    } catch {}
  },

  openDMWithUser: async (recipientId) => {
    try {
      const res = await axiosInstance.get(`/dms/${recipientId}`);
      const { conversationId, recipient, messages, hasMore } = res.data;

      const socket = getSocket();
      if (socket) socket.emit("dm:join", { conversationId });

      set({ activeDM: { conversationId, recipient }, dmMessages: messages, hasMore });
      return { conversationId, recipient };
    } catch (err) {
      toast.error("Failed to open DM");
      return null;
    }
  },

  fetchDMMessages: async (conversationId, before = null) => {
    set({ loadingMessages: true });
    try {
      const params = { limit: 50 };
      if (before) params.before = before;
      const res = await axiosInstance.get(`/dms/${conversationId}/messages`, { params });
      const { messages, hasMore } = res.data;

      if (before) {
        set((state) => ({ dmMessages: [...messages, ...state.dmMessages], hasMore }));
      } else {
        set({ dmMessages: messages, hasMore });
      }
    } catch {} finally {
      set({ loadingMessages: false });
    }
  },

  sendDM: (recipientId, content) => {
    const socket = getSocket();
    const tempId = `temp_${Date.now()}`;
    if (socket?.connected) {
      socket.emit("dm:send", { recipientId, content, tempId });
    }
  },

  addDMMessage: (message) => {
    set((state) => {
      const { activeDM } = state;
      if (!activeDM || activeDM.conversationId !== message.conversationId) return state;
      const exists = state.dmMessages.find((m) => m.id === message.id);
      if (exists) return state;
      return { dmMessages: [...state.dmMessages, message] };
    });

    // Update conversation list
    set((state) => {
      const existing = state.conversations.find((c) => c.conversationId === message.conversationId);
      if (existing) {
        return {
          conversations: state.conversations.map((c) =>
            c.conversationId === message.conversationId
              ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
              : c
          ),
        };
      }
      return state;
    });
  },

  registerSocketListeners: () => {
    const socket = getSocket();
    if (!socket || get().socketListenersRegistered) return;

    socket.on("dm:new", ({ message }) => {
      get().addDMMessage(message);
    });

    socket.on("dm:typing:update", ({ userId, typing, conversationId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        const set_ = new Set(updated[conversationId] || []);
        if (typing) set_.add(userId);
        else set_.delete(userId);
        updated[conversationId] = set_;
        return { typingUsers: updated };
      });
    });

    set({ socketListenersRegistered: true });
  },

  clearDM: () => {
    set({ activeDM: null, dmMessages: [], hasMore: false });
  },
}));
