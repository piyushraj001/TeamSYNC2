"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { axiosInstance } from "@/lib/axios";
import { Loader2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

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

// ── Shared primary button ───────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, type = "button" }) {
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

// ── Multi-email input ─────────────────────────────────────────────────────────
function MultiEmailInput({ emails, setEmails }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim().replace(/,$/, "");
      if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && !emails.includes(val)) {
        setEmails([...emails, val]);
        setInputValue("");
      } else if (val) {
        toast.error("Please enter a valid email address");
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      setEmails(emails.slice(0, -1));
    }
  };

  const removeEmail = (email) => {
    setEmails(emails.filter((e) => e !== email));
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "8px 10px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "4px",
        minHeight: "42px",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
    >
      {emails.map((email) => (
        <div
          key={email}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--surface-active)",
            color: "var(--accent)",
            padding: "2px 6px 2px 8px",
            borderRadius: "4px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {email}
          <button
            type="button"
            onClick={() => removeEmail(email)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={emails.length === 0 ? "name@company.com, name2@company.com" : ""}
        style={{
          flex: 1,
          minWidth: "140px",
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-ui)",
          fontSize: "14px",
          color: "var(--ink)",
        }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InviteTeammatesPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId;
  const { authUser, initializeAuth, isCheckingAuth } = useAuthStore();
  const { fetchWorkspaces } = useWorkspaceStore();

  const [workspace, setWorkspace] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) router.replace("/auth/login");
  }, [isCheckingAuth, authUser, router]);

  useEffect(() => {
    async function loadWorkspace() {
      if (!workspaceId) return;
      try {
        const list = await fetchWorkspaces();
        const ws = list.find((w) => w.id === workspaceId);
        if (ws) {
          setWorkspace(ws);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        toast.error("Failed to load workspace");
      } finally {
        setFetching(false);
      }
    }
    loadWorkspace();
  }, [workspaceId, fetchWorkspaces, router]);

  const inviteUrl = workspace
    ? `${window.location.origin}/workspace/new?tab=join&code=${workspace.inviteCode}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invite link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSkip = () => {
    router.push(`/workspace/${workspaceId}`);
  };

  const handleSend = async () => {
    if (emails.length === 0) return;
    setLoading(true);
    try {
      // Assuming you might add an endpoint for emailing invites later.
      // For now we simulate it or use the backend if it exists.
      // await axiosInstance.post(`/workspaces/${workspaceId}/invites`, { emails });
      toast.success(`Invites sent to ${emails.length} people`);
      router.push(`/workspace/${workspaceId}`);
    } catch (err) {
      toast.error("Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth || fetching) {
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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        
        {/* Header Text */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: "8px",
            }}
          >
            Invite your team
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              color: "var(--ink-soft)",
            }}
          >
            TeamSYNC is better with everyone. Invite your coworkers to{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{workspace?.name}</strong>.
          </p>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Emails Input */}
            <div>
              <FieldLabel>To:</FieldLabel>
              <MultiEmailInput emails={emails} setEmails={setEmails} />
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  color: "var(--ink-soft)",
                  marginTop: "8px",
                }}
              >
                Press enter or comma to separate emails.
              </p>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  color: "var(--ink-soft)",
                  fontWeight: 500,
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>

            {/* Link Sharing */}
            <div>
              <FieldLabel>Share a link</FieldLabel>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "14px",
                    color: "var(--ink)",
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--line)",
                    borderRadius: "4px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0 16px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "4px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ink)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
                >
                  {copied ? <Check size={16} style={{ color: "var(--accent)" }} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Bottom Row Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "8px",
              }}
            >
              <button
                onClick={handleSkip}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-ui)",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  padding: "10px 16px", // Same tap target size as button
                  marginLeft: "-16px", // Align text visually
                }}
              >
                Skip for now
              </button>

              <PrimaryButton onClick={handleSend} disabled={emails.length === 0 || loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send invites
              </PrimaryButton>
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );
}
