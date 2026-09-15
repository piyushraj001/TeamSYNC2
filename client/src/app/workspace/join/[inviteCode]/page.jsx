"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { Users, ArrowLeft, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function JoinWorkspacePage() {
  const { inviteCode } = useParams();
  const router = useRouter();
  const { authUser, initializeAuth } = useAuthStore();
  const { joinWorkspace } = useWorkspaceStore();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
    // Fetch workspace preview
    axiosInstance.get(`/workspaces/preview/${inviteCode}`)
      .then((res) => setWorkspace(res.data.workspace))
      .catch(() => setError("Invalid or expired invite link"))
      .finally(() => setLoading(false));
  }, [inviteCode, initializeAuth]);

  const handleJoin = async () => {
    if (!authUser) {
      router.push(`/auth/login?redirect=/workspace/join/${inviteCode}`);
      return;
    }
    setJoining(true);
    const joined = await joinWorkspace(inviteCode);
    setJoining(false);
    if (joined) router.push(`/workspace/${joined.id}`);
  };

  if (loading) {
    return (
      <main
        style={{ background: "var(--paper)" }}
        className="min-h-screen flex items-center justify-center"
      >
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
      </main>
    );
  }

  if (error || !workspace) {
    return (
      <main
        style={{ background: "var(--paper)" }}
        className="min-h-screen flex flex-col items-center justify-center px-4"
      >
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔗</div>
          <h1 className="font-display" style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", marginBottom: "8px" }}>
            Invalid invite link
          </h1>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-soft)", marginBottom: "32px" }}>
            This invite link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              padding: "10px",
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  // deterministic hue from name for avatar
  const hue = (workspace.name || "?").charCodeAt(0) % 360;

  return (
    <main
      style={{ background: "var(--paper)" }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "32px 28px 24px",
          textAlign: "center",
        }}
      >
        {/* Workspace avatar */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "10px",
            background: `hsl(${hue} 30% 72%)`,
            color: `hsl(${hue} 30% 22%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-ui)",
            fontSize: "24px",
            fontWeight: 600,
            margin: "0 auto 24px",
          }}
        >
          {workspace.name[0]?.toUpperCase()}
        </div>

        <p style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>
          You've been invited to join
        </p>
        <h1 className="font-display" style={{ fontSize: "22px", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>
          {workspace.name}
        </h1>
        
        {workspace.description && (
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-soft)", marginBottom: "16px" }}>
            {workspace.description}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-soft)", marginBottom: "32px" }}>
          <Users size={14} />
          <span>{workspace._count?.members || 0} members</span>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            padding: "11px",
            background: joining ? "var(--surface-sunken)" : "var(--pine)",
            color: joining ? "var(--ink-soft)" : "#fff",
            border: "none",
            borderRadius: "4px",
            fontFamily: "var(--font-ui)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: joining ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (!joining) e.currentTarget.style.background = "var(--pine-dim)"; }}
          onMouseLeave={(e) => { if (!joining) e.currentTarget.style.background = "var(--pine)"; }}
        >
          {joining ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
          {joining ? "Joining…" : "Join workspace"}
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            marginTop: "12px",
            padding: "10px",
            background: "none",
            color: "var(--ink-soft)",
            border: "none",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={13} /> Back to dashboard
        </button>
      </div>
    </main>
  );
}
