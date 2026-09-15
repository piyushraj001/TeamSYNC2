"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Loader2, Plus, Hash, LogOut } from "lucide-react";

export default function DashboardPage() {
  const { authUser, initializeAuth, isCheckingAuth, logout } = useAuthStore();
  const { workspaces, fetchWorkspaces, loading } = useWorkspaceStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
    fetchWorkspaces();
  }, [initializeAuth, fetchWorkspaces]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      router.replace("/auth/login");
    }
  }, [isCheckingAuth, authUser, router]);

  if (isCheckingAuth || loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={20} style={{ color: "var(--ink-soft)" }} />
      </main>
    );
  }

  const firstName = authUser?.displayName?.split(" ")[0] || "there";

  // ── No workspaces: first-login welcome screen ──────────────────────────────
  if (workspaces.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div style={{ width: "280px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {/* Wordmark */}
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "18px", fontWeight: 700, color: "var(--ink)", marginBottom: "24px" }}>
            Team<span style={{ color: "var(--accent)" }}>SYNC</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
            Welcome, {firstName} 👋
          </h1>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink-soft)", marginBottom: "32px", lineHeight: 1.5 }}>
            Chat and calls, in the same place. Get started by creating or joining a workspace.
          </p>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => router.push("/workspace/new")}
              style={{ width: "100%", padding: "11px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "4px", fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Create a workspace
            </button>
            <button
              onClick={() => router.push("/workspace/new?tab=join")}
              style={{ width: "100%", padding: "10px", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
            >
              Join a workspace
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Has workspaces: workspace picker ───────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "18px", fontWeight: 700, color: "var(--ink)", marginBottom: "2px" }}>
              Team<span style={{ color: "var(--accent)" }}>SYNC</span>
            </div>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-soft)" }}>
              Hi {firstName} — pick a workspace to jump in.
            </p>
          </div>
          <button
            onClick={() => { logout(); router.replace("/auth/login"); }}
            title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-ui)", fontSize: "13px", padding: "6px 8px", borderRadius: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        {/* Workspace list */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          {workspaces.map((ws, idx) => (
            <button
              key={ws.id}
              onClick={() => router.push(`/workspace/${ws.id}`)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid var(--line)",
                background: "transparent",
                border: "none",
                borderBottom: idx < workspaces.length - 1 ? "1px solid var(--line)" : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Workspace icon */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  background: "var(--surface-active)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-ui)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {ws.name[0].toUpperCase()}
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: "2px",
                  }}
                >
                  {ws.name}
                </p>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--ink-soft)" }}>
                  {ws._count?.members ?? ws.members?.length ?? 0} member{(ws._count?.members ?? ws.members?.length ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Arrow */}
              <span style={{ color: "var(--ink-soft)", fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => router.push("/workspace/new")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontFamily: "var(--font-ui)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            <Plus size={14} />
            New workspace
          </button>
          <button
            onClick={() => router.push("/workspace/new?tab=join")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px",
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              fontFamily: "var(--font-ui)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
          >
            Join a workspace
          </button>
        </div>
      </div>
    </main>
  );
}
