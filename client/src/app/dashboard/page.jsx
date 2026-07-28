"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LogOut, Plus, Hash, Users, Compass, Laptop } from "lucide-react";

export default function DashboardPage() {
  const { authUser, logout } = useAuthStore();
  const { workspaces, loading, fetchWorkspaces, createWorkspace, joinWorkspace } = useWorkspaceStore();
  
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    
    setActionLoading(true);
    const created = await createWorkspace({
      name: wsName,
      description: wsDescription,
    });
    setActionLoading(false);

    if (created) {
      setWsName("");
      setWsDescription("");
      // Redirect to newly created workspace
      router.push(`/workspace/${created.id}`);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setActionLoading(true);
    const joined = await joinWorkspace(inviteCode.trim());
    setActionLoading(false);

    if (joined) {
      setInviteCode("");
      // Redirect to joined workspace
      router.push(`/workspace/${joined.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
            TS
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">TeamSYNC</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {authUser?.avatarUrl ? (
              <img src={authUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {authUser?.displayName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span className="font-medium text-sm text-gray-700">{authUser?.displayName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Workspaces List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Workspaces</h1>
            <p className="text-gray-500 mt-1">Select a workspace to start collaborating with your team.</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Laptop size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No workspaces found</h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
                Get started by creating your own workspace or entering an invite code from a teammate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => router.push(`/workspace/${ws.id}`)}
                  className="bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md hover:scale-[1.01] p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{ws._count?.members || 1} {ws._count?.members === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash size={14} />
                      <span>{ws._count?.channels || 1} {ws._count?.channels === 1 ? 'channel' : 'channels'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Create Workspace */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" />
              <span>Create Workspace</span>
            </h2>
            <p className="text-gray-500 text-xs mt-1">Start a new project space as the admin.</p>
            
            <form onSubmit={handleCreate} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon Project"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea
                  placeholder="What is this workspace for?"
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !wsName.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? "Creating..." : "Create Workspace"}
              </button>
            </form>
          </div>

          {/* Join Workspace */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Compass size={18} className="text-blue-600" />
              <span>Join Workspace</span>
            </h2>
            <p className="text-gray-500 text-xs mt-1">Enter an invite code to join an existing space.</p>
            
            <form onSubmit={handleJoin} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="Paste 8-character invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !inviteCode.trim()}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? "Joining..." : "Join Workspace"}
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
