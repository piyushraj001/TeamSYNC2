import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,  // Start as true — we don't know auth state until initializeAuth completes

  initializeAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/me");
      set({ authUser: res.data.user });
      // Connect socket with stored token
      const token = Cookies.get("accessToken");
      if (token) connectSocket(token);
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data.user });
      Cookies.set("accessToken", res.data.accessToken, { expires: 7 });
      Cookies.set("refreshToken", res.data.refreshToken, { expires: 7 });
      connectSocket(res.data.accessToken);
      toast.success("Logged in successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      set({ authUser: res.data.user });
      Cookies.set("accessToken", res.data.accessToken, { expires: 7 });
      Cookies.set("refreshToken", res.data.refreshToken, { expires: 7 });
      connectSocket(res.data.accessToken);
      toast.success("Account created successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: () => {
    set({ authUser: null });
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    disconnectSocket();
    toast.success("Logged out");
  },

  forgotPassword: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Password reset email sent!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send reset email");
      return false;
    }
  },

  resetPassword: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/reset-password", data);
      toast.success(res.data.message || "Password reset successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reset password");
      return false;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.patch("/auth/me", data);
      set({ authUser: res.data.user });
      toast.success("Profile updated!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
      return false;
    }
  },
}));