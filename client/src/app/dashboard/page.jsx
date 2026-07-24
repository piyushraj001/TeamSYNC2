"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { authUser, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Welcome back, <span className="font-semibold">{authUser?.displayName || "User"}</span>!
        </p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
