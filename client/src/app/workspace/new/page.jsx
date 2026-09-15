"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { axiosInstance } from "@/lib/axios";
import { Loader2, ArrowLeft } from "lucide-react";

const TEAM_SIZES = ["Just me", "2–10", "11–50", "50+"];

// ── Shared field label ────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <label
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--ink)",
        display: "block",
        marginBottom: "6px",
      }}
    >
      {children}
    </label>
  );
}

// ── Shared text input ─────────────────────────────────────────────────────────
function TextInput({ value, onChange, placeholder, autoFocus, id, ...rest }) {
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: "100%",
        padding: "10px 12px",
        fontFamily: "var(--font-ui)",
        fontSize: "14px",
        color: "var(--ink)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "4px",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
      {...rest}
    />
  );
}

// ── Pine primary button ───────────────────────────────────────────────────────
function PineButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "var(--surface-subtle)" : "var(--accent)",
        color: disabled ? "var(--ink-soft)" : "#fff",
        borderRadius: "4px",
        border: "none",
        fontFamily: "var(--font-ui)",
        fontSize: "14px",
        fontWeight: 500,
        padding: "10px 20px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--accent)";
      }}
    >
      {children}
    </button>
  );
}

// ── CREATE path ───────────────────────────────────────────────────────────────
function CreatePath({ onCreated }) {
  const [name, setName] = useState("");
  const [teamSize, setTeamSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const { createWorkspace } = useWorkspaceStore();

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const ws = await createWorkspace({ name: name.trim() });
    setLoading(false);
    if (ws) onCreated(ws);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Workspace name */}
      <div>
        <FieldLabel>Workspace name</FieldLabel>
        <TextInput
          id="ws-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Inc., Hackathon Team"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
        />
      </div>

      {/* Team size chips */}
      <div>
        <FieldLabel>How many people will be using it?</FieldLabel>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TEAM_SIZES.map((size) => {
            const active = teamSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setTeamSize(size)}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  fontWeight: active ? 500 : 400,
                  padding: "7px 14px",
                  borderRadius: "4px",
                  border: active
                    ? "1px solid var(--accent)"
                    : "1px solid var(--line)",
                  background: active ? "var(--accent)" : "var(--surface)",
                  color: active ? "#fff" : "var(--ink-soft)",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PineButton onClick={handleContinue} disabled={!name.trim() || loading}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Continue
        </PineButton>
      </div>
    </div>
  );
}

// ── JOIN path ─────────────────────────────────────────────────────────────────
function JoinPath() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);   // workspace preview
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const { joinWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setCode(val);
    setFound(null);

    // Extract code from a full URL if pasted
    const raw = val.trim();
    if (!raw) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Detect if it looks like a UUID / short code
      const match = raw.match(/([0-9a-f-]{8,})$/i);
      const inviteCode = match ? match[1] : raw;
      if (inviteCode.length < 4) return;

      setChecking(true);
      try {
        const res = await axiosInstance.get(`/workspaces/preview/${inviteCode}`);
        setFound({ ...res.data.workspace, inviteCode });
      } catch {
        setFound(null);
      } finally {
        setChecking(false);
      }
    }, 500);
  };

  const handleJoin = async () => {
    if (!found) return;
    setJoining(true);
    const ws = await joinWorkspace(found.inviteCode);
    setJoining(false);
    if (ws) router.push(`/workspace/${ws.id}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <FieldLabel>Invite code or email</FieldLabel>
        <div style={{ position: "relative" }}>
          <TextInput
            id="invite-code"
            value={code}
            onChange={handleChange}
            placeholder="Paste your invite code or link"
            autoFocus
          />
          {checking && (
            <Loader2
              size={16}
              className="animate-spin"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-soft)",
              }}
            />
          )}
        </div>
      </div>

      {/* Found confirmation */}
      {found && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "14px",
                color: "var(--ink)",
                lineHeight: 1.4,
              }}
            >
              We found <strong>{found.name}</strong> — request to join?
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PineButton onClick={handleJoin} disabled={joining}>
              {joining && <Loader2 size={16} className="animate-spin" />}
              Request to join
            </PineButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewWorkspacePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "join" ? "join" : "create";
  const [tab, setTab] = useState(initialTab);
  const router = useRouter();
  const { authUser, initializeAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) router.replace("/auth/login");
  }, [isCheckingAuth, authUser, router]);

  const handleCreated = (ws) => {
    router.push(`/workspace/new/invite/${ws.id}`);
  };

  if (isCheckingAuth) {
    return (
      <main
        style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--ink-soft)" }} />
      </main>
    );
  }

  return (
    <main
      style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        
        {/* Back to dashboard */}
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-ui)",
              fontSize: "13px",
              color: "var(--ink-soft)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "24px",
          }}
        >
          {/* Pill segmented control */}
          <div
            style={{
              display: "flex",
              background: "var(--surface-subtle)",
              border: "1px solid var(--line)",
              borderRadius: "999px",
              padding: "3px",
              marginBottom: "24px",
            }}
          >
            {["create", "join"].map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: "999px",
                    border: "none",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--ink-soft)",
                    fontFamily: "var(--font-ui)",
                    fontSize: "13px",
                    fontWeight: active ? 500 : 400,
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    lineHeight: 1,
                  }}
                >
                  {t === "create" ? "Create" : "Join"}
                </button>
              );
            })}
          </div>

          {/* Path content */}
          {tab === "create" ? (
            <CreatePath onCreated={handleCreated} />
          ) : (
            <JoinPath />
          )}
        </div>
      </div>
    </main>
  );
}
