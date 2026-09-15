// Active calls: callId -> { callerId, calleeId, startedAt }
const activeCalls = new Map();

function callHandler(io, socket) {
  const { userId } = socket;

  // Caller initiates a call
  socket.on("call:initiate", ({ targetUserId, workspaceId, offer }) => {
    const callId = `call_${Date.now()}_${userId}`;

    activeCalls.set(callId, {
      callerId: userId,
      calleeId: targetUserId,
      startedAt: Date.now(),
    });

    // Forward call invitation to target user's personal room
    io.to(`user:${targetUserId}`).emit("call:incoming", {
      callId,
      callerId: userId,
      offer,
      workspaceId,
    });

    // Confirm to caller that the ring was sent
    socket.emit("call:ringing", { callId, targetUserId });

    // Auto-cancel if no answer within 30 seconds
    const timeout = setTimeout(() => {
      if (activeCalls.has(callId)) {
        activeCalls.delete(callId);
        socket.emit("call:ended", { callId, reason: "no-answer" });
        io.to(`user:${targetUserId}`).emit("call:ended", { callId, reason: "no-answer" });
      }
    }, 30000);

    // Store timeout ref so we can cancel it
    activeCalls.get(callId) && (activeCalls.get(callId).timeout = timeout);
  });

  // Callee accepts
  socket.on("call:accept", ({ callId, answer }) => {
    const call = activeCalls.get(callId);
    if (!call) return socket.emit("call:ended", { callId, reason: "expired" });

    // Cancel the auto-cancel timer
    if (call.timeout) clearTimeout(call.timeout);

    // Send answer back to the caller
    io.to(`user:${call.callerId}`).emit("call:accepted", { callId, answer });
  });

  // Callee declines
  socket.on("call:decline", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    if (call.timeout) clearTimeout(call.timeout);
    activeCalls.delete(callId);

    io.to(`user:${call.callerId}`).emit("call:declined", { callId });
  });

  // ICE candidate exchange (trickle ICE)
  socket.on("call:ice-candidate", ({ callId, candidate, targetUserId }) => {
    io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
      callId,
      candidate,
      senderId: userId,
    });
  });

  // Either party ends the call
  socket.on("call:end", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    if (call.timeout) clearTimeout(call.timeout);
    activeCalls.delete(callId);

    // Notify both parties
    const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
    io.to(`user:${otherUserId}`).emit("call:ended", { callId, reason: "ended" });
    socket.emit("call:ended", { callId, reason: "ended" });
  });

  // Clean up on socket disconnect (call drop)
  socket.on("disconnect", () => {
    for (const [callId, call] of activeCalls) {
      if (call.callerId === userId || call.calleeId === userId) {
        const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
        if (call.timeout) clearTimeout(call.timeout);
        activeCalls.delete(callId);
        io.to(`user:${otherUserId}`).emit("call:ended", { callId, reason: "dropped" });
      }
    }
  });
}

module.exports = callHandler;
