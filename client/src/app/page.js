"use client";

import Link from "next/link";
import { MessageSquare, Video, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <div
          className="font-display"
          style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}
        >
          Team<span style={{ color: "var(--pine)" }}>SYNC</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/auth/login"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--ink-soft)",
              textDecoration: "none",
              padding: "8px 14px",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              background: "var(--pine)",
              textDecoration: "none",
              padding: "9px 18px",
              borderRadius: "4px",
            }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          padding: "96px 24px 80px",
          textAlign: "center",
        }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(36px, 6vw, 52px)",
            fontWeight: 500,
            lineHeight: 1.1,
            color: "var(--ink)",
            marginBottom: "20px",
            letterSpacing: "-0.02em",
          }}
        >
          Chat and calls,{" "}
          <span style={{ color: "var(--pine)" }}>in the same place.</span>
        </h1>

        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            marginBottom: "36px",
            maxWidth: "440px",
            margin: "0 auto 36px",
          }}
        >
          TeamSYNC is a lightweight workplace app for student teams and small
          groups. No subscriptions, no enterprise bloat.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/auth/register"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "15px",
              fontWeight: 500,
              color: "#fff",
              background: "var(--pine)",
              textDecoration: "none",
              padding: "12px 28px",
              borderRadius: "4px",
            }}
          >
            Start for free
          </Link>
          <Link
            href="/auth/login"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--ink)",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              textDecoration: "none",
              padding: "12px 28px",
              borderRadius: "4px",
            }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--line)",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      />

      {/* Features */}
      <section
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "64px 24px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "0",
        }}
      >
        {[
          {
            icon: MessageSquare,
            title: "Real-time messaging",
            desc: "Public channels, private channels, and direct messages. Typing indicators. Message history that actually loads fast.",
          },
          {
            icon: Video,
            title: "One-click video calls",
            desc: "Peer-to-peer WebRTC calls — no plugins, no waiting rooms, no per-minute billing. Click a member, start talking.",
          },
          {
            icon: Globe,
            title: "Screen sharing",
            desc: "Share your full screen, a window, or a specific browser tab during any call. Stop with one click.",
          },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            style={{
              padding: "32px 28px",
              borderRight: i < 2 ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "var(--surface-sunken)",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Icon size={17} style={{ color: "var(--pine)" }} />
            </div>
            <h3
              className="font-display"
              style={{
                fontSize: "17px",
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.65,
                color: "var(--ink-soft)",
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
        }}
      >
        <span
          className="font-display"
          style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)" }}
        >
          Team<span style={{ color: "var(--pine)" }}>SYNC</span>
        </span>
        <p
          style={{
            fontSize: "13px",
            color: "var(--ink-soft)",
          }}
        >
          Free forever · Open source
        </p>
      </footer>
    </div>
  );
}
