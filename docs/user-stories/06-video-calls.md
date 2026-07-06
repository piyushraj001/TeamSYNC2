# Video Calls User Stories

## Overview
This document contains all user stories related to 1-to-1 video calling functionality using WebRTC in CollabSpace.

---

## VC-001: Initiate Video Call

### User Story
**As a** workspace member,
**I want to** start a video call with another member,
**So that** I can have face-to-face conversations.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Call button visible on user profile/DM | Video icon present |
| 2 | Click initiates call request | Call modal opens |
| 3 | Camera and microphone permission requested | Browser prompt |
| 4 | Preview of own video before calling | Self-view visible |
| 5 | Calling state shown with animation | "Calling..." indicator |
| 6 | Can cancel call before answer | Cancel button works |
| 7 | Target user receives notification | Real-time notification |
| 8 | Connection time < 5 seconds (ideal network) | Performance requirement |

### Technical Notes
- Request media permissions first
- Create WebRTC peer connection
- Send call offer via signaling server (Socket.IO)
- Handle browser compatibility (adapter.js)

### API/Socket Events
```
Socket Emit: "call:initiate"
Data: { targetUserId, workspaceId }

Socket Receive (target): "call:incoming"
Data: { callerId, callerName, callerAvatar }
```

---

## VC-002: Receive Incoming Call

### User Story
**As a** user receiving a call,
**I want to** be notified of incoming calls,
**So that** I can decide whether to answer.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Incoming call modal appears | Full-screen or overlay |
| 2 | Caller's name and avatar shown | Identification clear |
| 3 | Accept button with camera icon | Green, visible |
| 4 | Decline button | Red, visible |
| 5 | Ringtone plays (optional) | Audio notification |
| 6 | Browser notification if window not focused | Push notification |
| 7 | Call times out after 30 seconds | Auto-decline |
| 8 | Multiple tabs show only one notification | Coordinated |

### Technical Notes
- Handle call in any open tab
- Play ringtone with Audio API
- Browser Notification API for background

### API/Socket Events
```
Socket Receive: "call:incoming"
Data: { callId, callerId, callerName, callerAvatar, offer }

Socket Emit: "call:accept" | "call:decline"
Data: { callId, answer? }
```

---

## VC-003: Accept/Decline Call

### User Story
**As a** user receiving a call,
**I want to** accept or decline the call,
**So that** I can control when I'm available.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Accept opens video call UI | Both videos visible |
| 2 | Decline ends call for both parties | Call terminated |
| 3 | Camera/mic enabled on accept | Media active |
| 4 | Caller notified of decline | "Call declined" message |
| 5 | Caller notified of accept | Connection established |
| 6 | Quick response time | Sub-second answer delivery |

### Technical Notes
- Exchange SDP answer on accept
- Close peer connection on decline
- Handle ICE candidates exchange

---

## VC-004: Video Call UI

### User Story
**As a** user in a video call,
**I want** a clear interface showing both video feeds,
**So that** I can focus on the conversation.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Remote video displayed prominently | Large main video |
| 2 | Self video in corner (PiP style) | Smaller overlay |
| 3 | Participant names visible | Labels on videos |
| 4 | Call duration timer shown | Running timer |
| 5 | Control bar at bottom | Mute, video, end buttons |
| 6 | Full-screen option | Expand button |
| 7 | Click self-view to swap views | Interactive |
| 8 | Dark theme for video interface | Minimal distraction |

### Technical Notes
- Responsive layout for different screen sizes
- CSS Grid for video positioning
- Picture-in-picture API support

---

## VC-005: Mute/Unmute Audio

### User Story
**As a** user in a video call,
**I want to** mute and unmute my microphone,
**So that** I can control when I'm heard.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Mute button in call controls | Microphone icon |
| 2 | Click toggles mute state | Immediate effect |
| 3 | Muted state shown clearly | Strikethrough/red icon |
| 4 | Other party sees mute indicator | Visual on remote video |
| 5 | Keyboard shortcut (M) to toggle | Hotkey works |
| 6 | Audio track disabled when muted | No audio transmitted |
| 7 | Unmute restores audio | Audio resumes |

### Technical Notes
- Toggle audio track enabled state
- Notify remote peer of mute status via data channel
- Local indicator updates immediately

### API/Socket Events
```
DataChannel: "media:mute"
Data: { type: "audio", muted: true|false }
```

---

## VC-006: Enable/Disable Video

### User Story
**As a** user in a video call,
**I want to** turn my camera on and off,
**So that** I can control my visibility.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Video toggle button in controls | Camera icon |
| 2 | Click toggles video state | Immediate effect |
| 3 | Disabled state shown clearly | Strikethrough/red icon |
| 4 | Other party sees avatar when video off | Fallback displayed |
| 5 | Keyboard shortcut (V) to toggle | Hotkey works |
| 6 | Video track disabled when off | No video transmitted |
| 7 | Re-enable restores video | Camera resumes |

### Technical Notes
- Toggle video track enabled state
- Notify remote peer of video status
- Show avatar placeholder locally when off

---

## VC-007: End Call

### User Story
**As a** user in a video call,
**I want to** end the call when finished,
**So that** I can terminate the conversation.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | End call button (red) in controls | Phone/X icon |
| 2 | Click ends call for both parties | Connection terminated |
| 3 | Confirmation not required for end | One-click end |
| 4 | Media tracks released | Camera/mic freed |
| 5 | Call UI closes | Return to previous view |
| 6 | Call duration logged (optional) | For future reference |
| 7 | Both parties notified | "Call ended" message |

### Technical Notes
- Close RTCPeerConnection
- Stop all media tracks
- Notify remote via signaling server
- Clean up socket listeners

### API/Socket Events
```
Socket Emit: "call:end"
Data: { callId }

Socket Receive: "call:ended"
Data: { callId, reason: "ended" | "dropped" }
```

---

## VC-008: Handle Call Disconnection

### User Story
**As a** user in a video call,
**I want** the call to handle network issues gracefully,
**So that** temporary issues don't end the call.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Connection quality indicator | Green/yellow/red |
| 2 | Poor connection warning shown | "Connection unstable" |
| 3 | Auto-reconnection attempted | Seamless recovery |
| 4 | Call ends after 10s disconnect | Timeout behavior |
| 5 | "Call dropped" message on timeout | Clear notification |
| 6 | No reconnect prompts needed | Automatic |
| 7 | ICE restart on connection issues | Recovery mechanism |

### Technical Notes
- Monitor RTCPeerConnection state
- Use ICE restart for recovery
- TURN server fallback for NAT issues
- Track connection stats for quality indicator

---

## VC-009: WebRTC Signaling

### User Story
**As a** system,
**I want** a reliable signaling mechanism,
**So that** WebRTC connections are established correctly.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | SDP offers exchanged via Socket.IO | Signaling works |
| 2 | SDP answers returned successfully | Handshake completes |
| 3 | ICE candidates exchanged | NAT traversal enabled |
| 4 | Trickle ICE supported | Faster connection |
| 5 | Signaling retry on failure | Reliability |
| 6 | Multiple STUN servers configured | Redundancy |
| 7 | TURN server fallback | Firewall bypass |

### Technical Notes
- Use multiple public STUN servers
- Consider free TURN service or Twilio TURN
- Queue ICE candidates if local description not set
- Handle renegotiation for adding/removing tracks

### Configuration
```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:your-turn-server', username: '', credential: '' }
  ]
};
```

---

## VC-010: Call Permissions Handling

### User Story
**As a** user,
**I want** clear feedback when permissions are missing,
**So that** I understand why the call won't work.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Permission request shown before call | Browser prompt |
| 2 | Denied camera shows helpful message | "Camera blocked" |
| 3 | Denied mic shows helpful message | "Microphone blocked" |
| 4 | Instructions to enable permissions | Help link/text |
| 5 | Audio-only call if camera denied | Fallback mode |
| 6 | Device selection for multiple cameras/mics | Dropdown available |
| 7 | Remember device preference | Persistence |

### Technical Notes
- Check permissions before accessing media
- enumerateDevices() for device list
- Handle NotAllowedError gracefully
- Settings stored in localStorage

---

## Story Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| VC-001 | Initiate Video Call | P0 | ⬜ |
| VC-002 | Receive Incoming Call | P0 | ⬜ |
| VC-003 | Accept/Decline Call | P0 | ⬜ |
| VC-004 | Video Call UI | P0 | ⬜ |
| VC-005 | Mute/Unmute Audio | P0 | ⬜ |
| VC-006 | Enable/Disable Video | P0 | ⬜ |
| VC-007 | End Call | P0 | ⬜ |
| VC-008 | Handle Call Disconnection | P0 | ⬜ |
| VC-009 | WebRTC Signaling | P0 | ⬜ |
| VC-010 | Call Permissions Handling | P1 | ⬜ |
