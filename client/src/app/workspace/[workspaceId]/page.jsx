"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChannelStore } from "@/store/useChannelStore";
import { usePresenceStore } from "@/store/usePresenceStore";
import { useCallStore } from "@/store/useCallStore";
import { useDMStore } from "@/store/useDMStore";
import { getSocket } from "@/lib/socket";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import {
  Hash, Plus, Copy, Check, ArrowLeft, Send, Shield,
  LogOut, Lock, MessageSquare, Video,
  X, Mic, MicOff, VideoOff, Monitor, PhoneOff,
  ChevronRight, ChevronLeft, Loader2, Link2, Home,
  Search, Bell, ChevronDown, Calendar, FileText,
  Paperclip, Headphones, SmilePlus, Phone, MapPin, Clock,
  Pin, Users, Settings, Play
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS (mirroring CSS vars for inline styles)
───────────────────────────────────────────────────────────────── */
const T = {
  bgPrimary:     "var(--background)",
  bgSidebar:     "var(--surface-subtle)",
  bgActive:      "var(--surface-active)",
  accent:        "var(--accent)",
  accentHover:   "var(--accent-hover)",
  unreadBadge:   "var(--live)",
  textPrimary:   "var(--ink)",
  textSecondary: "var(--ink-soft)",
  textMuted:     "var(--ink-soft)",
  border:        "var(--line)",
  fontFamily:    "var(--font-ui)",
};

/* ─────────────────────────────────────────────────────────────────
   PRESENCE DOT
───────────────────────────────────────────────────────────────── */
function PresenceDot({ status, size = 8 }) {
  const bg =
    status === "online" ? "#4caf7d"
    : status === "away"  ? "#f5a623"
    : T.border;
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "999px",
        background: bg,
        border: `1.5px solid ${T.bgSidebar}`,
        flexShrink: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   AVATAR (pill or circle shape for users)
───────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 28, onClick, circular = false, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: circular ? "999px" : "4px",
        background: T.bgActive,
        color: T.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: T.fontFamily,
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: "none",
        border: `1px solid ${T.border}`,
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────────────────────────── */
function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;
  const names = users.map((u) => u.displayName).join(", ");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "4px 16px",
        fontFamily: T.fontFamily,
        fontSize: "12px",
        color: T.textMuted,
      }}
    >
      <span style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="animate-bounce"
            style={{
              width: 4,
              height: 4,
              borderRadius: "999px",
              background: T.textMuted,
              animationDelay: `${d}ms`,
              display: "inline-block",
            }}
          />
        ))}
      </span>
      {names} {users.length === 1 ? "is" : "are"} typing…
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MESSAGE ITEM
───────────────────────────────────────────────────────────────── */
function MessageItem({ message, prevMessage, currentUserId, onUserClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const showHeader =
    !prevMessage ||
    prevMessage.sender?.id !== message.sender?.id ||
    new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000;

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const showDateSep =
    !prevMessage ||
    new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

  const formatDate = (d) => {
    const dt = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dt.toDateString() === today.toDateString()) return "Today";
    if (dt.toDateString() === yesterday.toDateString()) return "Yesterday";
    return dt.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  };

  return (
    <>
      {showDateSep && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "16px 0 8px",
            padding: "0 16px",
          }}
        >
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span
            style={{
              fontFamily: T.fontFamily,
              fontSize: "11px",
              color: T.textSecondary,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {formatDate(message.createdAt)}
          </span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
      )}

      <div
        className="group"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: `${showHeader ? "10px" : "2px"} 16px 2px`,
          background: isHovered ? T.bgSidebar : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div
            style={{
              position: "absolute",
              top: "-16px",
              right: "24px",
              background: T.bgPrimary,
              border: `1px solid ${T.border}`,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "2px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              zIndex: 10,
            }}
          >
            {["👍", "❤️", "😂", "🚀", "👀"].map(emoji => (
              <button key={emoji} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "4px" }}>
                {emoji}
              </button>
            ))}
            <div style={{ width: "1px", height: "16px", background: T.border, margin: "0 4px" }} />
            <button style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "flex", padding: "4px" }}>
              <SmilePlus size={16} />
            </button>
          </div>
        )}

        {/* Avatar column */}
        <div style={{ width: 28, flexShrink: 0, marginTop: showHeader ? 0 : 0 }}>
          {showHeader ? (
            <Avatar name={message.sender?.displayName} size={28} onClick={() => onUserClick && onUserClick(message.sender?.id)} />
          ) : (
            <span
              className="group-hover:inline hidden"
              style={{ fontFamily: T.fontFamily, fontSize: "10px", color: T.textMuted }}
            >
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {showHeader && (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "2px",
              }}
            >
              <span
                onClick={() => onUserClick && onUserClick(message.sender?.id)}
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: message.sender?.id === currentUserId ? T.accent : T.textPrimary,
                  cursor: onUserClick ? "pointer" : "default",
                }}
              >
                {message.sender?.displayName}
              </span>
              <span style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 400, color: T.textMuted }}>
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span style={{ fontFamily: T.fontFamily, fontSize: "11px", color: T.textMuted }}>(edited)</span>
              )}
            </div>
          )}
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: "15px",
              fontWeight: 400,
              lineHeight: 1.55,
              color: T.textPrimary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
            }}
          >
            {message.content}
          </p>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MESSAGE INPUT
───────────────────────────────────────────────────────────────── */
function MessageInput({ channelId, placeholder, onSend }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const { emitTyping } = useChannelStore();
  const typingRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    emitTyping(channelId, true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => emitTyping(channelId, false), 2000);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }
  };

  const doSend = () => {
    const v = value.trim();
    if (!v) return;
    onSend(v);
    setValue("");
    emitTyping(channelId, false);
    clearTimeout(typingRef.current);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div
      style={{
        padding: "0 12px 12px",
        borderTop: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          background: T.bgPrimary,
          border: `1px solid ${T.border}`,
          borderRadius: "4px",
          padding: "8px 10px 8px 12px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          maxLength={4000}
          style={{
            flex: 1,
            fontFamily: T.fontFamily,
            fontSize: "15px",
            color: T.textPrimary,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
            maxHeight: 140,
            overflowY: "auto",
          }}
        />
        <button
          onClick={doSend}
          disabled={!value.trim()}
          style={{
            width: 32,
            height: 32,
            borderRadius: "4px",
            border: "none",
            background: value.trim() ? T.accent : "transparent",
            color: value.trim() ? "#fff" : T.textMuted,
            cursor: value.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (value.trim()) e.currentTarget.style.background = T.accentHover; }}
          onMouseLeave={(e) => { if (value.trim()) e.currentTarget.style.background = T.accent; }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CREATE CHANNEL MODAL
───────────────────────────────────────────────────────────────── */
function CreateChannelModal({ workspaceId, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createChannel } = useChannelStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const ch = await createChannel(workspaceId, { name, description, isPrivate });
    setLoading(false);
    if (ch) { onCreated(ch); onClose(); }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(26,29,27,0.4)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: T.bgPrimary,
          border: `1px solid ${T.border}`,
          borderRadius: "10px",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 className="font-display" style={{ fontSize: "17px", fontWeight: 500, color: T.textPrimary }}>
            Create a channel
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Type toggle */}
          <div>
            <label style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary, display: "block", marginBottom: "6px" }}>
              Visibility
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[{ label: "Public", v: false, icon: Hash }, { label: "Private", v: true, icon: Lock }].map(({ label, v, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPrivate(v)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: "8px 0",
                    fontFamily: T.fontFamily,
                    fontSize: "13px",
                    fontWeight: isPrivate === v ? 500 : 400,
                    borderRadius: "4px",
                    border: isPrivate === v ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`,
                    background: isPrivate === v ? T.accent : T.bgPrimary,
                    color: isPrivate === v ? "#fff" : T.textSecondary,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary, display: "block", marginBottom: "6px" }}>
              Channel name
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSecondary, fontFamily: T.fontFamily, fontSize: "14px" }}>#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="e.g. frontend, design"
                maxLength={50}
                autoFocus
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 24px",
                  fontFamily: T.fontFamily,
                  fontSize: "14px",
                  color: T.textPrimary,
                  background: T.bgPrimary,
                  border: `1px solid ${T.border}`,
                  borderRadius: "4px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary, display: "block", marginBottom: "6px" }}>
              Description <span style={{ color: T.textSecondary, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              maxLength={200}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontFamily: T.fontFamily,
                fontSize: "14px",
                color: T.textPrimary,
                background: T.bgPrimary,
                border: `1px solid ${T.border}`,
                borderRadius: "4px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                background: !name.trim() || loading ? T.bgSidebar : T.accent,
                color: !name.trim() || loading ? T.textSecondary : "#fff",
                border: "none",
                borderRadius: "4px",
                fontFamily: T.fontFamily,
                fontSize: "14px",
                fontWeight: 500,
                cursor: !name.trim() || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? "Creating…" : "Create channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VIDEO CALL OVERLAY
───────────────────────────────────────────────────────────────── */
function VideoCallOverlay() {
  const {
    inCall, callPartner, callStatus,
    localStream, remoteStream,
    isMuted, isVideoOff, isScreenSharing,
    endCall, toggleMute, toggleVideo, startScreenShare, stopScreenShare,
  } = useCallStore();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream, inCall]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream, inCall]);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  if (!inCall) return null;

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const CtrlBtn = ({ onClick, active, danger, title, children }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 44,
        height: 44,
        borderRadius: "999px",
        border: "none",
        background: danger ? "#c0392b" : active ? T.bgPrimary : "transparent",
        color: danger ? "#fff" : active ? T.textPrimary : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!danger && !active) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
      onMouseLeave={(e) => { if (!danger && !active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(26,29,27,0.4)", // Dimmed backdrop (ink at 40%)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      {/* Main Call Surface */}
      <div 
        style={{
          width: "100%",
          maxWidth: 1200,
          height: "100%",
          maxHeight: 800,
          background: "#1A1D1B", // Ink background
          borderRadius: "12px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)", // Drop shadow
          position: "relative",
          display: "flex",
          overflow: "hidden",
        }}
      >
        
        {/* Video Grid Area */}
        <div style={{ flex: 1, position: "relative", padding: "24px", display: "flex", gap: "16px", flexDirection: "column" }}>
          
          {/* Top Left Recording Indicator */}
          <div style={{ position: "absolute", top: 24, left: 24, zIndex: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "100px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.unreadBadge }} className="animate-pulse" />
            <span style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 500, color: "#fff" }}>Recording</span>
          </div>

          {/* Videos Grid */}
          <div style={{ flex: 1, display: "flex", gap: "16px", justifyContent: "center" }}>
            {/* Remote Video */}
            <div style={{ flex: 1, position: "relative", borderRadius: "6px", overflow: "hidden", background: "#222" }}>
              <video ref={remoteRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {!remoteStream && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Avatar name={callPartner?.displayName} size={72} circular={true} />
                  <p style={{ fontFamily: T.fontFamily, fontSize: "14px", color: "rgba(255,255,255,0.6)" }} className="animate-pulse">
                    {callStatus === "ringing" ? "Calling…" : "Connecting…"}
                  </p>
                </div>
              )}
              {/* Name Pill */}
              <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.9)", color: "#1A1D1B", padding: "4px 10px", borderRadius: "100px", fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 600 }}>
                {callPartner?.displayName || "Participant"}
              </div>
            </div>

            {/* Local Video */}
            <div style={{ width: 300, flexShrink: 0, position: "relative", borderRadius: "6px", overflow: "hidden", background: "#222" }}>
              <video ref={localRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              {isVideoOff && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><VideoOff size={24} /></div>
                </div>
              )}
              {/* Name Pill */}
              <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.9)", color: "#1A1D1B", padding: "4px 10px", borderRadius: "100px", fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 600 }}>
                You
              </div>
            </div>
          </div>

          {/* Floating Control Bar */}
          <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(26,29,27,0.8)", backdropFilter: "blur(12px)", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10 }}>
            <CtrlBtn onClick={toggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </CtrlBtn>
            <CtrlBtn onClick={toggleVideo} active={isVideoOff} title={isVideoOff ? "Enable video" : "Disable video"}>
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </CtrlBtn>
            <CtrlBtn onClick={isScreenSharing ? stopScreenShare : startScreenShare} active={isScreenSharing} title={isScreenSharing ? "Stop sharing" : "Share screen"}>
              <Monitor size={20} />
            </CtrlBtn>
            <CtrlBtn title="Reactions">
              <SmilePlus size={20} />
            </CtrlBtn>
            <CtrlBtn onClick={() => setIsChatOpen(!isChatOpen)} active={isChatOpen} title="Chat">
              <MessageSquare size={20} />
            </CtrlBtn>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />
            <CtrlBtn onClick={endCall} danger={true} title="Leave Call">
              <PhoneOff size={20} />
            </CtrlBtn>
          </div>
        </div>

        {/* Chat Side Panel */}
        {isChatOpen && (
          <div style={{ width: 340, background: T.bgPrimary, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: T.fontFamily, fontSize: "15px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>In-call Chat</h3>
              <button onClick={() => setIsChatOpen(false)} style={{ background: "none", border: "none", color: T.textSecondary, cursor: "pointer" }}><X size={18} /></button>
            </div>
            
            <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Mock Chat Message */}
              <div style={{ display: "flex", gap: "12px" }}>
                 <Avatar name={callPartner?.displayName} size={32} circular={true} />
                 <div>
                   <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                     <span style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary }}>{callPartner?.displayName || "Participant"}</span>
                     <span style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>{fmt(duration)}</span>
                   </div>
                   <p style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, margin: "4px 0 0" }}>Let me drop the link here.</p>
                 </div>
              </div>
            </div>

            <div style={{ padding: "16px", borderTop: `1px solid ${T.border}` }}>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: "8px", background: T.bgPrimary, overflow: "hidden" }}>
                <input type="text" placeholder="Message call..." style={{ width: "100%", border: "none", padding: "12px", fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, outline: "none", background: "transparent" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.bgSidebar, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Paperclip size={16} color={T.textSecondary} style={{ cursor: "pointer" }} />
                    <SmilePlus size={16} color={T.textSecondary} style={{ cursor: "pointer" }} />
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, display: "flex" }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INCOMING CALL TOAST
───────────────────────────────────────────────────────────────── */
function IncomingCallBanner({ workspaceMembers }) {
  const { incomingCall, acceptCall, declineCall } = useCallStore();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!incomingCall) return;
    setTimeLeft(30);
    const t = setInterval(() => {
      setTimeLeft((n) => {
        if (n <= 1) { declineCall(); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [incomingCall, declineCall]);

  if (!incomingCall) return null;

  const caller = workspaceMembers?.find((m) => m.userId === incomingCall.callerId);
  const name = caller?.user?.displayName || "Someone";

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 55,
        width: 300,
        background: T.bgPrimary,
        border: `1px solid ${T.border}`,
        borderRadius: "10px",
        padding: "16px",
        // Only overlay gets shadow per spec
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={name} size={36} />
          {/* ember = live call indicator */}
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "999px", background: T.accent, border: `2px solid ${T.bgPrimary}` }} />
        </div>
        <div>
          <p style={{ fontFamily: T.fontFamily, fontSize: "11px", color: T.textSecondary, marginBottom: 2 }}>Incoming video call</p>
          <p style={{ fontFamily: T.fontFamily, fontSize: "15px", fontWeight: 500, color: T.textPrimary }}>{name}</p>
        </div>
        <p style={{ fontFamily: T.fontFamily, fontSize: "11px", color: T.textSecondary, marginLeft: "auto" }}>{timeLeft}s</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={declineCall}
          style={{
            flex: 1,
            padding: "8px 0",
            fontFamily: T.fontFamily,
            fontSize: "13px",
            fontWeight: 500,
            background: T.bgSidebar,
            border: `1px solid ${T.border}`,
            borderRadius: "4px",
            color: T.textPrimary,
            cursor: "pointer",
          }}
        >
          Decline
        </button>
        <button
          onClick={acceptCall}
          style={{
            flex: 1,
            padding: "8px 0",
            fontFamily: T.fontFamily,
            fontSize: "13px",
            fontWeight: 500,
            background: T.accent,
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Video size={13} /> Accept
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HOME / ACTIVITY FEED
───────────────────────────────────────────────────────────────── */
function HomeView({ workspace, channels }) {
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [tasks, setTasks] = useState([false, false, false]);

  const toggleTask = (i) => {
    const nt = [...tasks];
    nt[i] = !nt[i];
    setTasks(nt);
  };

  // Mock activity data as per spec
  const activities = [
    { id: 1, type: "mention", text: "Jordan mentioned you in #design", time: "10m ago" },
    { id: 2, type: "dm", text: "Alex: Hey, can we review the new designs?", time: "1h ago" },
    { id: 3, type: "call", text: "Call started in #general", time: "2h ago" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bgPrimary, display: "flex", justifyContent: "flex-start", padding: "24px 32px" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        
        {/* Live Call Banner (Simulated) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.bgSidebar, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 24 }}>
          <span style={{ width: 8, height: 8, borderRadius: "999px", background: T.unreadBadge, display: "inline-block" }} className="animate-pulse" />
          <span style={{ fontFamily: T.fontFamily, fontSize: "13px", color: T.textPrimary }}>Alex is on a call in #general</span>
          <button style={{ marginLeft: "auto", background: T.accent, color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", fontSize: "12px", fontFamily: T.fontFamily, cursor: "pointer" }}>Join</button>
        </div>

        <h1 style={{ fontFamily: T.fontFamily, fontSize: 24, fontWeight: 600, color: T.textPrimary, marginBottom: 24 }}>Home</h1>

        {/* Getting Started Card */}
        {showGettingStarted && (
          <div style={{ background: T.bgPrimary, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 32, position: "relative" }}>
            <button onClick={() => setShowGettingStarted(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: T.textSecondary, cursor: "pointer" }}><X size={16} /></button>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: 16, fontWeight: 600, color: T.textPrimary, marginBottom: 16 }}>Getting started</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Set up your profile", "Send your first message", "Start a quick call"].map((task, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => toggleTask(i)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, border: `1px solid ${tasks[i] ? T.accent : T.border}`,
                      background: tasks[i] ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}
                  >
                    {tasks[i] && <Check size={12} color="#fff" />}
                  </button>
                  <span style={{ fontFamily: T.fontFamily, fontSize: 14, color: tasks[i] ? T.textSecondary : T.textPrimary, textDecoration: tasks[i] ? "line-through" : "none" }}>{task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div>
          <h2 style={{ fontFamily: T.fontFamily, fontSize: 12, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Recent Activity</h2>
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            {activities.map((act) => (
              <div key={act.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary }}>{act.text}</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────── */
function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px" }}>
      <p style={{ fontFamily: T.fontFamily, fontSize: "15px", color: T.textSecondary, marginBottom: "16px" }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: T.accent,
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontFamily: T.fontFamily,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s"
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR NAV ITEM
───────────────────────────────────────────────────────────────── */
function SidebarItem({ icon: Icon, label, active, onClick, indent = false, isLive = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        paddingLeft: indent ? "24px" : "12px",
        borderRadius: "0",
        background: "transparent",
        color: active ? T.textPrimary : T.textSecondary,
        border: "none",
        borderLeft: active ? `2px solid ${T.accent}` : `2px solid transparent`,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: T.fontFamily,
        fontSize: "14px",
        fontWeight: active ? 600 : 500,
        transition: "color 0.1s",
      }}
    >
      <Icon size={16} style={{ color: active ? T.accent : T.textSecondary }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{label}</span>
      {isLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.unreadBadge, flexShrink: 0 }} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONTEXT PANEL
───────────────────────────────────────────────────────────────── */
function ContextPanel({ workspaceMembers, onlineUsers, onUserClick, authUser }) {
  const [expanded, setExpanded] = useState({
    members: true,
    files: true,
    media: true,
    meetings: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const membersToDisplay = workspaceMembers?.slice(0, 5) || [];
  const extraMembersCount = Math.max(0, (workspaceMembers?.length || 0) - 5);

  const mockFiles = [
    { name: "Project_Brief_v2.pdf", size: "1.2 MB", icon: <FileText size={16} />, color: T.accent },
    { name: "Q4_Financials.xlsx", size: "845 KB", icon: <FileText size={16} />, color: "#10b981" },
    { name: "Brand_Assets.zip", size: "14.5 MB", icon: <FileText size={16} />, color: "#f59e0b" },
  ];

  return (
    <aside
      style={{
        width: 220,
        background: T.bgSidebar,
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        transition: "width 0.2s ease",
      }}
    >
      {/* Top Action Row */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        {[
          { icon: <Bell size={18} />, label: "Notifications" },
          { icon: <Pin size={18} />, label: "Pinned" },
          { icon: <Users size={18} />, label: "Members" },
          { icon: <Settings size={18} />, label: "Settings" }
        ].map((btn, i) => (
          <button
            key={i}
            title={btn.label}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: T.textSecondary, padding: "6px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.bgActive; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSecondary; }}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Members Section */}
        <div>
          <div 
            onClick={() => toggleSection("members")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: expanded.members ? "12px" : "0" }}
          >
            <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>Members</h3>
            <ChevronDown size={16} style={{ color: T.textSecondary, transform: expanded.members ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </div>
          {expanded.members && (
            <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
              {membersToDisplay.map((m, i) => (
                <div key={m.userId} onClick={() => onUserClick(m.userId)} style={{ position: "relative", zIndex: 5 - i, marginLeft: i > 0 ? "-8px" : "0", cursor: "pointer" }}>
                  <Avatar name={m.user?.displayName} size={32} circular={true} style={{ border: `2px solid ${T.bgSidebar}` }} />
                  <span style={{ position: "absolute", bottom: 0, right: 0 }}>
                    <PresenceDot status={onlineUsers.get(m.userId) || "offline"} size={8} />
                  </span>
                </div>
              ))}
              {extraMembersCount > 0 && (
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", background: T.bgActive, color: T.textSecondary,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600,
                  border: `2px solid ${T.bgSidebar}`, zIndex: 0, marginLeft: "-8px"
                }}>
                  +{extraMembersCount}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div>
          <div 
            onClick={() => toggleSection("files")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: expanded.files ? "12px" : "0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>Files</h3>
              <span onClick={(e) => e.stopPropagation()} style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 500, color: T.accent, cursor: "pointer" }}>View All</span>
            </div>
            <ChevronDown size={16} style={{ color: T.textSecondary, transform: expanded.files ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </div>
          {expanded.files && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {mockFiles.map((file, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} className="group">
                  <div style={{ width: 32, height: 32, borderRadius: "6px", background: T.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center", color: file.color, border: `1px solid ${T.border}` }}>
                    {file.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="group-hover:text-accent transition-colors">
                      {file.name}
                    </div>
                    <div style={{ fontFamily: T.fontFamily, fontSize: "11px", color: T.textSecondary }}>{file.size}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Media Section */}
        <div>
          <div 
            onClick={() => toggleSection("media")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: expanded.media ? "12px" : "0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>Media</h3>
              <span onClick={(e) => e.stopPropagation()} style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 500, color: T.accent, cursor: "pointer" }}>View All</span>
            </div>
            <ChevronDown size={16} style={{ color: T.textSecondary, transform: expanded.media ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </div>
          {expanded.media && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ aspectRatio: "1", background: T.bgActive, borderRadius: "6px", border: `1px solid ${T.border}` }} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings Section */}
        <div>
          <div 
            onClick={() => toggleSection("meetings")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: expanded.meetings ? "12px" : "0" }}
          >
            <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>Upcoming meetings</h3>
            <ChevronDown size={16} style={{ color: T.textSecondary, transform: expanded.meetings ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </div>
          {expanded.meetings && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary }}>Weekly Sync</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>Today, 2:00 PM</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary }}>Design Review</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>Tomorrow, 11:30 AM</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PROFILE PANEL
───────────────────────────────────────────────────────────────── */
function ProfilePanel({ member, onClose, onMessage, onCall }) {
  if (!member) return null;

  return (
    <aside
      style={{
        width: 320,
        background: T.bgPrimary,
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 12px 0" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, padding: "4px" }}>
          <X size={20} />
        </button>
      </div>
      
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px 24px", borderBottom: `1px solid ${T.border}` }}>
        <Avatar name={member.user?.displayName} size={80} circular={true} style={{ marginBottom: "16px", fontSize: "32px" }} />
        <h2 style={{ fontFamily: T.fontFamily, fontSize: "16px", fontWeight: 600, color: T.textPrimary, margin: "0 0 4px 0" }}>
          {member.user?.displayName}
        </h2>
        <p style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 400, color: T.textSecondary, margin: 0 }}>
          {member.user?.email || "No email provided"}
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "24px" }}>
          <button
            onClick={onMessage}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "6px", border: "none",
              background: T.accent, color: "#fff", fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, cursor: "pointer",
              transition: "background 0.15s"
            }}
          >
            Message
          </button>
          <button
            onClick={() => onCall("audio")}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "6px", border: `1px solid ${T.border}`,
              background: T.bgPrimary, color: T.textPrimary, fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
          >
            <Phone size={14} /> Call
          </button>
          <button
            onClick={() => onCall("video")}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "6px", border: `1px solid ${T.border}`,
              background: T.bgPrimary, color: T.textPrimary, fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
          >
            <Video size={14} /> Video
          </button>
        </div>
      </div>

      {/* About */}
      <div style={{ padding: "24px" }}>
        <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: "0 0 16px 0" }}>About</h3>
        
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textSecondary }}>Role</span>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, fontWeight: 500 }}>{member.role === "ADMIN" ? "Administrator" : "Member"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> Location</span>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, fontWeight: 500 }}>San Francisco, CA</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> Timezone</span>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, fontWeight: 500 }}>10:14 AM local time</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> Joined</span>
            <span style={{ fontFamily: T.fontFamily, fontSize: "14px", color: T.textPrimary, fontWeight: 500 }}>Mar 12, 2024</span>
          </div>
        </div>
      </div>

      {/* Shared Files */}
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>Shared files</h3>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.fontFamily, fontSize: "13px", color: T.accent, fontWeight: 500 }}>
            View All
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} className="group">
            <div style={{ width: 36, height: 36, borderRadius: "6px", background: T.bgSidebar, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
              <FileText size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="group-hover:text-accent transition-colors">
                Q3_Marketing_Plan.pdf
              </div>
              <div style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>2.4 MB • 2 days ago</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} className="group">
            <div style={{ width: 36, height: 36, borderRadius: "6px", background: T.bgSidebar, display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <FileText size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="group-hover:text-accent transition-colors">
                Budget_Template_2025.xlsx
              </div>
              <div style={{ fontFamily: T.fontFamily, fontSize: "12px", color: T.textSecondary }}>842 KB • Last week</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MEETINGS VIEW
───────────────────────────────────────────────────────────────── */
function MeetingsView({ workspaceMembers }) {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const mockMeetings = [
    { id: 1, title: "Weekly Sync", target: "#general", time: "Today, 2:00 PM", status: "upcoming", startsIn: 5 },
    { id: 2, title: "Design Review", target: ["Alice", "Bob", "Charlie"], time: "Tomorrow, 11:30 AM", status: "upcoming", startsIn: 1440 },
    { id: 3, title: "Project Kickoff", target: "#engineering", time: "Yesterday, 10:00 AM", status: "past" },
    { id: 4, title: "All Hands", target: "#announcements", time: "Monday, 1:00 PM", status: "recorded", recordingUrl: "#" },
  ];
  
  const filteredMeetings = mockMeetings.filter(m => {
    if (activeTab === "upcoming") return m.status === "upcoming";
    if (activeTab === "past") return m.status === "past";
    if (activeTab === "recorded") return m.status === "recorded";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bgPrimary }}>
      {/* Header Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 24px" }}>
        {["upcoming", "past", "recorded"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "16px 20px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
              color: activeTab === tab ? T.textPrimary : T.textSecondary,
              fontFamily: T.fontFamily,
              fontSize: "15px",
              fontWeight: activeTab === tab ? 600 : 500,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "color 0.15s, border-color 0.15s",
              marginBottom: "-1px"
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Meetings List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {filteredMeetings.length === 0 ? (
          <EmptyState 
            message="No meetings scheduled." 
            actionLabel="Schedule a meeting" 
            onAction={() => {}} 
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredMeetings.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: T.bgPrimary, border: `1px solid ${T.border}`, borderRadius: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h4 style={{ fontFamily: T.fontFamily, fontSize: "16px", fontWeight: 600, color: T.textPrimary, margin: 0 }}>
                    {m.title}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {Array.isArray(m.target) ? (
                      <div style={{ display: "flex" }}>
                        {m.target.map((name, i) => (
                          <div key={i} style={{ marginLeft: i > 0 ? "-8px" : "0", zIndex: 10 - i }}>
                            <Avatar name={name} size={20} circular={true} style={{ border: `1px solid ${T.bgPrimary}` }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 500, color: T.textPrimary }}>
                        {m.target}
                      </span>
                    )}
                    <span style={{ color: T.textSecondary, fontSize: "13px" }}>•</span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: "13px", color: T.textSecondary }}>
                      {m.time}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                {activeTab === "upcoming" && m.startsIn <= 10 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.unreadBadge }} />
                      <span style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 500, color: T.unreadBadge }}>Live now</span>
                    </div>
                    <button style={{ 
                      padding: "8px 16px", background: T.accent, color: "#fff", 
                      border: "none", borderRadius: "6px", fontFamily: T.fontFamily, 
                      fontSize: "14px", fontWeight: 500, cursor: "pointer",
                      transition: "background 0.15s"
                    }}>
                      Join
                    </button>
                  </div>
                )}
                
                {activeTab === "recorded" && (
                  <button style={{ 
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    background: T.bgSidebar, color: T.textPrimary, border: `1px solid ${T.border}`, 
                    borderRadius: "50%", cursor: "pointer", transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.bgActive}
                  onMouseLeave={(e) => e.currentTarget.style.background = T.bgSidebar}
                  >
                    <Play size={16} style={{ marginLeft: 2 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN WORKSPACE PAGE
───────────────────────────────────────────────────────────────── */
export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { authUser, initializeAuth, isCheckingAuth, logout } = useAuthStore();
  const { activeWorkspace, loading: wsLoading, fetchWorkspaceDetails } = useWorkspaceStore();
  const {
    channels, activeChannel, messages, typingUsers, loadingMessages, hasMore,
    fetchChannels, setActiveChannel, fetchMessages, sendMessage, registerSocketListeners,
  } = useChannelStore();
  const { onlineUsers, registerSocketListeners: registerPresence } = usePresenceStore();
  const { incomingCall, inCall, registerSocketListeners: registerCall } = useCallStore();
  const { activeDM, dmMessages, openDMWithUser, sendDM, registerSocketListeners: registerDM } = useDMStore();

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [viewMode, setViewMode] = useState("home");
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) router.replace("/auth/login");
  }, [isCheckingAuth, authUser, router]);

  useEffect(() => {
    if (authUser && workspaceId) {
      fetchWorkspaceDetails(workspaceId);
      fetchChannels(workspaceId);
      registerSocketListeners();
      registerPresence();
      registerCall();
      registerDM();
      const socket = getSocket();
      if (socket) {
        socket.emit("workspace:join", { workspaceId });
        socket.emit("workspace:joined", { workspaceId });
      }
    }
  }, [authUser, workspaceId]);

  // Only auto-select a channel when the user is in channel mode without an active channel.
  // Do NOT trigger for home, meetings, files, or dm views.
  useEffect(() => {
    if (channels.length > 0 && !activeChannel && viewMode === "channel") {
      const general = channels.find((c) => c.name === "general") || channels[0];
      selectChannel(general);
    }
  }, [channels, viewMode]);

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dmMessages, isAtBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 60);
    if (scrollTop < 60 && hasMore && !loadingMessages && viewMode === "channel" && activeChannel) {
      const first = messages[0];
      if (first) fetchMessages(activeChannel.id, first.createdAt);
    }
  };

  const selectChannel = async (ch) => {
    setViewMode("channel");
    setActiveChannel(ch);
    const socket = getSocket();
    if (socket) {
      if (activeChannel) socket.emit("channel:leave", { channelId: activeChannel.id });
      socket.emit("channel:join", { channelId: ch.id });
    }
    await fetchMessages(ch.id);
    setIsAtBottom(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 80);
  };

  const selectDM = async (memberId) => {
    setViewMode("dm");
    await openDMWithUser(memberId);
    setIsAtBottom(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 80);
  };

  const handleSend = (content) => {
    if (viewMode === "channel" && activeChannel) sendMessage(activeChannel.id, content);
    else if (viewMode === "dm" && activeDM) sendDM(activeDM.recipient.id, content);
  };

  const handleCopyInvite = () => {
    if (activeWorkspace?.inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/workspace/join/${activeWorkspace.inviteCode}`);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentMessages = viewMode === "channel" ? messages : dmMessages;
  const typingList = viewMode === "channel" && activeChannel
    ? (typingUsers[activeChannel.id] || []).filter((u) => u.userId !== authUser?.id)
    : [];
  const inputPlaceholder = viewMode === "channel"
    ? `Message #${activeChannel?.name || "…"}`
    : `Message ${activeDM?.recipient?.displayName || "…"}`;

  if (isCheckingAuth || wsLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={24} style={{ color: T.textMuted }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bgPrimary, color: T.textPrimary, overflow: "hidden", fontFamily: T.fontFamily }}>
      
      {/* ── TOP BAR ──────────────────────────────────────── */}
      <header style={{ height: 44, background: T.bgPrimary, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
           <div style={{ fontFamily: T.fontFamily, fontSize: "16px", fontWeight: 700, color: T.textPrimary }}>
              Team<span style={{ color: T.accent }}>SYNC</span>
           </div>
           {/* Workspace Switcher / Name */}
           <div style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: 500, color: T.textPrimary, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
             {activeWorkspace?.name} <ChevronDown size={14} style={{ color: T.textSecondary }} />
           </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 480, margin: "0 24px" }}>
           <div style={{ position: "relative", width: "100%" }}>
             <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSecondary }} />
             <input type="text" placeholder="Search TeamSYNC..." style={{ width: "100%", background: T.bgSidebar, border: "none", borderRadius: 4, padding: "6px 10px 6px 30px", fontFamily: T.fontFamily, fontSize: "13px", color: T.textPrimary, outline: "none" }} />
           </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", color: T.textSecondary, cursor: "pointer", display: "flex" }}><Bell size={18} /></button>
          <button style={{ background: "transparent", border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 4, padding: "4px 12px", fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>New meeting</button>
          <Avatar name={authUser?.displayName} size={26} />
        </div>
      </header>

      {/* ── MAIN LAYOUT ──────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <aside
          style={{
            width: 220,
            background: T.bgSidebar,
            borderRight: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Nav */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
            
            {/* Top Nav Rows */}
            <div style={{ marginBottom: "24px" }}>
              <SidebarItem icon={Home} label="Home" active={viewMode === "home"} onClick={() => { setViewMode("home"); setActiveChannel(null); openDMWithUser(null); }} />
              <SidebarItem icon={MessageSquare} label="DMs" active={viewMode === "dm"} onClick={() => {}} />
              <SidebarItem icon={Video} label="Meetings" active={viewMode === "meetings"} onClick={() => { setViewMode("meetings"); setActiveChannel(null); openDMWithUser(null); }} />
              <SidebarItem icon={FileText} label="Files" active={viewMode === "files"} onClick={() => { setViewMode("files"); setActiveChannel(null); openDMWithUser(null); }} />
            </div>

            {/* Channels */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 16px", marginBottom: "4px" }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 600, color: T.textSecondary, letterSpacing: "0.02em" }}>
                  Channels
                </span>
                <button onClick={() => setShowCreateChannel(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "flex", padding: "1px" }}>
                  <Plus size={14} />
                </button>
              </div>
              {channels.map((ch) => (
                <SidebarItem
                  key={ch.id}
                  icon={ch.isPrivate ? Lock : Hash}
                  label={ch.name}
                  active={viewMode === "channel" && activeChannel?.id === ch.id}
                  onClick={() => { selectChannel(ch); setViewMode("channel"); }}
                  isLive={false}
                />
              ))}
            </div>

            {/* Direct Messages */}
            <div>
              <div style={{ padding: "2px 16px", marginBottom: "4px" }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: "12px", fontWeight: 600, color: T.textSecondary, letterSpacing: "0.02em" }}>
                  Direct Messages
                </span>
              </div>
              {activeWorkspace?.members?.filter(m => m.userId !== authUser?.id).map((m) => {
                const status = onlineUsers.get(m.userId) || "offline";
                return (
                  <button
                    key={m.userId}
                    onClick={() => selectDM(m.userId)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px",
                      background: "transparent",
                      color: (viewMode === "dm" && activeDM?.recipient?.id === m.userId) ? T.textPrimary : T.textSecondary,
                      border: "none",
                      borderLeft: (viewMode === "dm" && activeDM?.recipient?.id === m.userId) ? `2px solid ${T.accent}` : `2px solid transparent`,
                      cursor: "pointer", textAlign: "left", transition: "color 0.1s"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Avatar name={m.user?.displayName} size={20} />
                      <span style={{ position: "absolute", bottom: -2, right: -2 }}><PresenceDot status={status} size={6} /></span>
                    </div>
                    <span style={{ fontFamily: T.fontFamily, fontSize: "14px", fontWeight: (viewMode === "dm" && activeDM?.recipient?.id === m.userId) ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.user?.displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: T.bgPrimary }}>
          
          {viewMode === "home" ? (
            <HomeView workspace={activeWorkspace} channels={channels} />
          ) : viewMode === "meetings" ? (
            <MeetingsView workspaceMembers={activeWorkspace?.members} />
          ) : viewMode === "files" ? (
            <EmptyState 
              message="No files shared in this channel yet." 
              actionLabel="Upload a file" 
              onAction={() => {}} 
            />
          ) : (
            <>
              {/* Header */}
              <header
                style={{
                  height: 52,
                  borderBottom: `1px solid ${T.border}`,
                  background: T.bgPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 16px",
                  flexShrink: 0,
                }}
              >
              {viewMode === "channel" ? (
                <>
                  {activeChannel?.isPrivate ? <Lock size={18} style={{ color: T.textSecondary }} /> : <Hash size={18} style={{ color: T.textSecondary }} />}
                  <span style={{ fontFamily: T.fontFamily, fontSize: "18px", fontWeight: 700, color: T.textPrimary }}>{activeChannel?.name}</span>
                  {activeChannel?.description && (
                    <>
                      <span style={{ color: T.border, margin: "0 4px" }}>|</span>
                      <span style={{ fontFamily: T.fontFamily, fontSize: "13px", fontWeight: 400, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeChannel.description}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Avatar name={activeDM?.recipient?.displayName} size={22} />
                  <span style={{ fontFamily: T.fontFamily, fontSize: "18px", fontWeight: 700, color: T.textPrimary }}>{activeDM?.recipient?.displayName}</span>
                </>
              )}

              <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={() => {}}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "flex" }}
                  title="Start voice call"
                >
                  <PhoneOff size={16} /> {/* Will change to Phone icon */}
                </button>
                <button
                  onClick={() => {
                    const { initiateCall } = useCallStore.getState();
                    if (viewMode === "dm" && activeDM) {
                      const member = activeWorkspace?.members?.find((m) => m.userId === activeDM.recipient.id);
                      if (member) initiateCall({ id: member.userId, displayName: member.user.displayName });
                    }
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "flex" }}
                  title="Start video call"
                >
                  <Video size={16} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {loadingMessages && (
                <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                  <Loader2 size={15} className="animate-spin" style={{ color: T.textMuted }} />
                </div>
              )}

              {currentMessages.length === 0 && !loadingMessages && (
                <EmptyState 
                  message={viewMode === "channel" ? "No messages in this channel yet." : "No direct messages yet."}
                  actionLabel={viewMode === "channel" ? "Start a conversation" : "Message a teammate"}
                  onAction={() => {}}
                />
              )}

          {currentMessages.map((msg, i) => (
            <MessageItem key={msg.id} message={msg} prevMessage={currentMessages[i - 1]} currentUserId={authUser?.id} onUserClick={setSelectedProfileUserId} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing */}
        <TypingIndicator users={typingList} />

        {/* Input */}
        {(activeChannel || activeDM) && (
          <MessageInput channelId={viewMode === "channel" ? activeChannel?.id : activeDM?.conversationId} placeholder={inputPlaceholder} onSend={handleSend} />
        )}
          </>
        )}
      </main>

      {/* ── RIGHT PANEL ─────────────────────────────── */}
      {showRightPanel && (
        selectedProfileUserId ? (
          <ProfilePanel 
            member={activeWorkspace?.members?.find(m => m.userId === selectedProfileUserId)} 
            onClose={() => setSelectedProfileUserId(null)}
            onMessage={() => {
              openDMWithUser(selectedProfileUserId);
              setViewMode("dm");
            }}
            onCall={(type) => {
              const m = activeWorkspace?.members?.find(m => m.userId === selectedProfileUserId);
              if (m) useCallStore.getState().initiateCall({ id: m.userId, displayName: m.user.displayName });
            }}
          />
        ) : (
          <ContextPanel 
            workspaceMembers={activeWorkspace?.members} 
            onlineUsers={onlineUsers} 
            onUserClick={setSelectedProfileUserId} 
            authUser={authUser} 
          />
        )
      )}
      </div> {/* End Main Layout Wrapper */}

      {/* Modals & overlays */}
      {showCreateChannel && (
        <CreateChannelModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(ch) => selectChannel(ch)}
        />
      )}
      <IncomingCallBanner workspaceMembers={activeWorkspace?.members} />
      <VideoCallOverlay />
    </div>
  );
}
