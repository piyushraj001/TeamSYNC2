import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  loading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/workspaces");
      set({ workspaces: res.data.workspaces });
      return res.data.workspaces;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to fetch workspaces";
      set({ error: errMsg });
      toast.error(errMsg);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchWorkspaceDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${id}`);
      set({ activeWorkspace: res.data.workspace });
      return res.data.workspace;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to load workspace details";
      set({ error: errMsg });
      toast.error(errMsg);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createWorkspace: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post("/workspaces", data);
      toast.success(res.data.message || "Workspace created!");
      const { fetchWorkspaces } = get();
      await fetchWorkspaces();
      return res.data.workspace;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to create workspace";
      toast.error(errMsg);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  joinWorkspace: async (inviteCode) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/join/${inviteCode}`);
      toast.success(res.data.message || "Joined workspace successfully!");
      const { fetchWorkspaces } = get();
      await fetchWorkspaces();
      return res.data.workspace;
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to join workspace";
      toast.error(errMsg);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  leaveWorkspace: async (workspaceId) => {
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/members/me`);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspace,
      }));
      toast.success("Left workspace");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to leave workspace");
      return false;
    }
  },

  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
  },
}));
