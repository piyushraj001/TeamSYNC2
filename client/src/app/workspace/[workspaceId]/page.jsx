"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Hash, Users, Copy, Check, ArrowLeft, Send, Shield, User, MessageSquare } from "lucide-react";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { authUser } = useAuthStore();
  const { activeWorkspace, loading, fetchWorkspaceDetails } = useWorkspaceStore();
  
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceDetails(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceDetails]);

  const handleCopyInvite = () => {
    if (activeWorkspace?.inviteCode) {
      navigator.clipboard.writeText(activeWorkspace.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-semibold text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <h2 className="text-2xl font-bold text-gray-900">Workspace not found</h2>
        <p className="text-gray-500 mt-2 max-w-sm">It seems the workspace you are trying to access does not exist or you lack membership.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      
      {/* Workspace Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 z-20 shadow-xl">
        {/* Workspace Name & Navigation */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <h2 className="font-bold text-lg truncate tracking-tight">{activeWorkspace.name}</h2>
            <span className="text-xs text-slate-400 font-medium">Workspace Space</span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            title="Back to Dashboard"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Invite Code Section */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Invite Code</div>
            <div className="font-mono text-slate-300 font-bold truncate mt-0.5">{activeWorkspace.inviteCode}</div>
          </div>
          <button
            onClick={handleCopyInvite}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              copied ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
            title="Copy Invite Code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          <div className="space-y-1.5">
            <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Channels</span>
            </div>
            
            <div className="space-y-0.5">
              {activeWorkspace.channels?.map((channel) => (
                <button
                  key={channel.id}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium"
                >
                  <Hash size={16} className="text-slate-500" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} />
              <span>Members ({activeWorkspace.members?.length || 1})</span>
            </div>
            
            <div className="space-y-1">
              {activeWorkspace.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-slate-300 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 text-xs font-semibold flex-shrink-0">
                      {member.user?.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="truncate text-slate-300">{member.user?.displayName}</span>
                  </div>
                  
                  {member.role === "ADMIN" ? (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900/50 flex items-center gap-0.5 flex-shrink-0">
                      <Shield size={10} />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                      <User size={10} />
                      <span>Member</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Footnote */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow">
            {authUser?.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">{authUser?.displayName}</div>
            <div className="text-[10px] text-slate-400 truncate">{authUser?.email}</div>
          </div>
        </div>
      </aside>

      {/* Chat Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Pane Header */}
        <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white shadow-sm z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Hash size={20} className="text-gray-400" />
            <h1 className="font-bold text-lg text-gray-900 truncate">general</h1>
          </div>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <div className="border border-blue-100 bg-blue-50/50 rounded-2xl p-6 text-center max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-800">Welcome to the #general channel!</h3>
            <p className="text-sm text-gray-500 mt-1">
              This is the default channel for workspace announcements. Share your first message here to kick off collaboration.
            </p>
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-md">
          <form className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Message #general"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shadow"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>

    </div>
  );
}
