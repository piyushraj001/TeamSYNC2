import { create } from "zustand";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

// Free Metered.ca TURN server config
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:standard.relay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:standard.relay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:standard.relay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export const useCallStore = create((set, get) => ({
  // Call state
  inCall: false,
  callId: null,
  callPartner: null,   // { id, displayName, avatarUrl }
  callDirection: null, // "outgoing" | "incoming"
  callStatus: null,    // "ringing" | "connecting" | "connected" | "ended"

  // Incoming call notification
  incomingCall: null,  // { callId, callerId, callerName, callerAvatar, offer }

  // Media streams
  localStream: null,
  remoteStream: null,

  // Controls
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,

  // WebRTC peer connection (not serializable, stored outside Zustand normally)
  // We keep a reference here for simplicity
  peerConnection: null,
  socketListenersRegistered: false,

  // ─── INITIATE CALL ──────────────────────────────────────────────────────────
  initiateCall: async (targetUser) => {
    const socket = getSocket();
    if (!socket) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote stream
      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // ICE candidate gathering
      const callId = `call_${Date.now()}`;
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("call:ice-candidate", {
            callId,
            candidate,
            targetUserId: targetUser.id,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          set({ callStatus: "connected" });
        } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          get().endCall();
        }
      };

      set({
        inCall: true,
        callId,
        callPartner: targetUser,
        callDirection: "outgoing",
        callStatus: "ringing",
        localStream: stream,
        remoteStream,
        peerConnection: pc,
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
      });

      socket.emit("call:initiate", {
        targetUserId: targetUser.id,
        offer: { type: offer.type, sdp: offer.sdp },
      });
    } catch (err) {
      console.error("Failed to initiate call:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Camera/microphone permission denied");
      } else {
        toast.error("Failed to start call");
      }
    }
  },

  // ─── ACCEPT CALL ────────────────────────────────────────────────────────────
  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const socket = getSocket();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("call:ice-candidate", {
            callId: incomingCall.callId,
            candidate,
            targetUserId: incomingCall.callerId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          set({ callStatus: "connected" });
        } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          get().endCall();
        }
      };

      socket.emit("call:accept", {
        callId: incomingCall.callId,
        answer: { type: answer.type, sdp: answer.sdp },
      });

      set({
        inCall: true,
        callId: incomingCall.callId,
        callPartner: {
          id: incomingCall.callerId,
          displayName: incomingCall.callerName,
          avatarUrl: incomingCall.callerAvatar,
        },
        callDirection: "incoming",
        callStatus: "connecting",
        localStream: stream,
        remoteStream,
        peerConnection: pc,
        incomingCall: null,
        isMuted: false,
        isVideoOff: false,
      });
    } catch (err) {
      toast.error("Failed to accept call");
      get().declineCall();
    }
  },

  // ─── DECLINE CALL ───────────────────────────────────────────────────────────
  declineCall: () => {
    const { incomingCall } = get();
    const socket = getSocket();
    if (incomingCall && socket) {
      socket.emit("call:decline", { callId: incomingCall.callId });
    }
    set({ incomingCall: null });
  },

  // ─── END CALL ───────────────────────────────────────────────────────────────
  endCall: () => {
    const { callId, localStream, peerConnection } = get();
    const socket = getSocket();

    if (callId && socket) {
      socket.emit("call:end", { callId });
    }

    // Stop all tracks
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnection?.close();

    set({
      inCall: false,
      callId: null,
      callPartner: null,
      callDirection: null,
      callStatus: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      incomingCall: null,
    });
  },

  // ─── MEDIA CONTROLS ─────────────────────────────────────────────────────────
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = isVideoOff; });
    set({ isVideoOff: !isVideoOff });
  },

  // ─── SCREEN SHARING ─────────────────────────────────────────────────────────
  startScreenShare: async () => {
    const { peerConnection, localStream } = get();
    if (!peerConnection) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track in peer connection
      const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);

      // When user stops via browser UI
      screenTrack.onended = () => {
        get().stopScreenShare();
      };

      set({ isScreenSharing: true });
      // Store screen track for cleanup
      get()._screenTrack = screenTrack;
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        toast.error("Screen sharing failed");
      }
    }
  },

  stopScreenShare: async () => {
    const { peerConnection, localStream } = get();
    if (!peerConnection) return;

    const cameraTrack = localStream?.getVideoTracks()[0];
    if (cameraTrack) {
      cameraTrack.enabled = true;
      const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(cameraTrack);
    }

    get()._screenTrack?.stop();
    set({ isScreenSharing: false });
  },

  // ─── SOCKET LISTENERS ───────────────────────────────────────────────────────
  registerSocketListeners: () => {
    const socket = getSocket();
    if (!socket || get().socketListenersRegistered) return;

    // Incoming call
    socket.on("call:incoming", ({ callId, callerId, offer }) => {
      set({
        incomingCall: { callId, callerId, offer },
      });
    });

    // Our call was accepted
    socket.on("call:accepted", async ({ callId, answer }) => {
      const { peerConnection } = get();
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        set({ callStatus: "connecting" });
      } catch (err) {
        console.error("Failed to set remote description:", err);
      }
    });

    // Our call was declined
    socket.on("call:declined", ({ callId }) => {
      toast.info("Call was declined");
      get().endCall();
    });

    // ICE candidate from remote
    socket.on("call:ice-candidate", async ({ candidate }) => {
      const { peerConnection } = get();
      if (!peerConnection || !candidate) return;
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    // Call ended by remote
    socket.on("call:ended", ({ callId, reason }) => {
      const { inCall } = get();
      if (inCall) {
        if (reason === "dropped") toast.info("Call dropped");
        else if (reason === "no-answer") toast.info("No answer");
        get().endCall();
      }
    });

    set({ socketListenersRegistered: true });
  },
}));
