# Presence System User Stories

## Overview
This document contains all user stories related to online/offline status, activity tracking, and presence indicators in CollabSpace.

---

## PRES-001: Display Online Status

### User Story
**As a** workspace member,
**I want to** see who is currently online,
**So that** I know who is available for immediate communication.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Green dot indicator for online users | Visual indicator visible |
| 2 | Gray dot for offline users | Different visual state |
| 3 | Status shown on user avatars in member list | Consistent placement |
| 4 | Status shown in DM list | Per-conversation status |
| 5 | Status shown on channel member list | All members visible |
| 6 | Status updates in real-time | No refresh needed |
| 7 | Own status visible in profile area | Self-awareness |

### Technical Notes
- WebSocket-based presence tracking
- Store presence in Redis (or memory)
- Broadcast status changes to workspace members

### API/Socket Events
```
Socket Event: "presence:update"
Data: { userId, status: "online" | "offline" | "away" }

Socket Event: "presence:bulk"
Data: { users: [{ userId, status }] }
```

---

## PRES-002: Automatic Offline on Disconnect

### User Story
**As a** system,
**I want to** automatically mark users as offline when disconnected,
**So that** presence status is always accurate.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | User goes offline when tab closed | Status changes within 30s |
| 2 | User goes offline when browser closed | Same behavior |
| 3 | User goes offline on network disconnect | Timeout detection |
| 4 | Grace period of 30 seconds before offline | Handles brief disconnects |
| 5 | Status persists if connection lost temporarily | Reconnect within grace period |
| 6 | Multiple tabs keep user online | Only offline when all tabs closed |

### Technical Notes
- Socket.IO disconnect event handler
- 30-second timeout before marking offline
- Track multiple connections per user
- Heartbeat mechanism for connection health

---

## PRES-003: Automatic Online on Connect

### User Story
**As a** user,
**I want to** automatically appear online when I access CollabSpace,
**So that** my team knows I'm available.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Login sets status to online | Immediate status change |
| 2 | Page refresh maintains online status | No offline flash |
| 3 | Reconnection restores online status | After temporary disconnect |
| 4 | Online status broadcasted to workspace | Others see update |
| 5 | User sees own status as online | Self-indicator correct |

### Technical Notes
- Set presence on WebSocket connection
- Handle reconnection with exponential backoff
- Avoid flashing offline during reconnection

---

## PRES-004: Away Status on Inactivity

### User Story
**As a** system,
**I want to** mark users as "away" after inactivity,
**So that** others know when someone is not actively using the app.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | User marked "away" after 5 minutes inactivity | Status changes |
| 2 | Yellow/orange indicator for away status | Visual distinction |
| 3 | Any activity resets to online | Mouse, keyboard, scroll |
| 4 | Away timeout configurable (future) | User preference |
| 5 | Status reverts to online on activity | Automatic recovery |
| 6 | Away status shown in member lists | Consistent display |

### Technical Notes
- Client-side activity tracking
- Send activity heartbeat to server
- Track last activity timestamp

### API/Socket Events
```
Socket Emit: "presence:activity"
Data: { timestamp }
```

---

## PRES-005: Fetch Initial Presence

### User Story
**As a** user opening a workspace,
**I want to** see current presence status of all members,
**So that** I don't have to wait for status updates.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Presence loaded on workspace open | Immediate status display |
| 2 | All members have accurate status | Reflects current state |
| 3 | Loading state while fetching | Skeleton or spinner |
| 4 | Updates received while loading merged correctly | No race conditions |
| 5 | Works after reconnection | State refreshed |

### Technical Notes
- Bulk presence fetch on workspace join
- Merge with real-time updates
- Cache presence locally

### API Endpoints
```
GET /api/workspaces/:workspaceId/presence
Response: { users: [{ userId, status, lastSeen }] }
```

---

## PRES-006: Custom Status Message

### User Story
**As a** user,
**I want to** set a custom status message,
**So that** I can communicate my availability or activity.

### Priority: P2

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Status message editable in profile | Input field available |
| 2 | Preset statuses available | "In a meeting", "Focusing", etc. |
| 3 | Custom text option (max 100 chars) | Free-form input |
| 4 | Emoji support in status | Emoji picker |
| 5 | Status duration option | "Clear after X hours" |
| 6 | Status visible on hover | Tooltip on avatar |
| 7 | Status shown in member profile | Profile view shows status |

### Technical Notes
- Store status message in user record or presence cache
- Auto-clear based on duration
- Broadcast to workspace members

### API Endpoints
```
PATCH /api/users/me/status
Body: { message, emoji?, clearAfter? }
Response: { status: {...} }
```

---

## Story Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| PRES-001 | Display Online Status | P0 | ⬜ |
| PRES-002 | Automatic Offline on Disconnect | P0 | ⬜ |
| PRES-003 | Automatic Online on Connect | P0 | ⬜ |
| PRES-004 | Away Status on Inactivity | P1 | ⬜ |
| PRES-005 | Fetch Initial Presence | P0 | ⬜ |
| PRES-006 | Custom Status Message | P2 | ⬜ |
