"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Inline SVG for Google Icon
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await signup({ email, displayName, password });
    if (ok) router.push("/dashboard");
  };

  const inputStyle = {
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
  };

  const labelStyle = {
    fontFamily: "var(--font-ui)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--ink)",
    display: "block",
    marginBottom: "6px",
  };

  // Simple password strength check
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return "Too short";
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return "Strong password";
    return "Good password";
  };

  const strength = getPasswordStrength();

  return (
    <main
      style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "32px 24px",
        }}
      >
        {/* Wordmark Top of Card */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span className="font-display" style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)" }}>Team</span>
          <span className="font-display" style={{ fontSize: "24px", fontWeight: 600, color: "var(--accent)" }}>SYNC</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: "40px" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", display: "flex" }}
                tabIndex="-1"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--ink-soft)", marginTop: "6px" }}>
                {strength}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSigningUp}
            style={{
              width: "100%",
              padding: "11px",
              background: isSigningUp ? "var(--accent-hover)" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isSigningUp ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "8px",
              transition: "background 0.15s",
            }}
          >
            {isSigningUp && <Loader2 size={16} className="animate-spin" />}
            {isSigningUp ? "Creating account…" : "Create account"}
          </button>

          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--ink-soft)" }}>
              By signing up you agree to our Terms and Privacy Policy
            </span>
          </div>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          <span style={{ margin: "0 12px", fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--ink-soft)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        </div>

        {/* Secondary Button */}
        <button
          type="button"
          onClick={() => {}}
          style={{
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-subtle)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Bottom Login link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-soft)" }}>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
            >
              Log in
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
