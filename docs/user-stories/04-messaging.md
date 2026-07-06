# Messaging User Stories

## Overview
This document contains all user stories related to real-time messaging, direct messages, and message management in CollabSpace.

---

## MSG-001: Send Message in Channel

### User Story
**As a** channel member,
**I want to** send text messages in a channel,
**So that** I can communicate with my team.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Message input visible at bottom of channel view | Input field always visible |
| 2 | Can type message in input field | Text input works |
| 3 | Press Enter or click Send to submit | Both methods work |
| 4 | Shift+Enter creates newline | Multi-line messages supported |
| 5 | Message appears in channel immediately | Optimistic UI update |
| 6 | Message shows sender name and avatar | Sender info displayed |
| 7 | Message shows timestamp | Time displayed |
| 8 | Empty messages cannot be sent | Send disabled for empty |
| 9 | Input clears after sending | Ready for next message |
| 10 | Max message length 4000 characters | Limit enforced |

### Technical Notes
- Emit message via WebSocket for instant delivery
- Store in database with channel and sender references
- Include temporary ID for optimistic updates

### API/Socket Events
```
Socket Emit: "message:send"
Data: { channelId, content, tempId }

Socket Receive: "message:new"
Data: { message: {...} }
```

---

## MSG-002: Receive Real-time Messages

### User Story
**As a** channel member,
**I want to** receive messages in real-time,
**So that** I can have instant communication with my team.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Messages appear without page refresh | Real-time updates |
| 2 | Messages appear in chronological order | Proper ordering |
| 3 | Message delivery latency < 200ms | Performance requirement |
| 4 | New messages scroll view to bottom | Auto-scroll behavior |
| 5 | Auto-scroll paused if user scrolled up | Reading old messages not interrupted |
| 6 | New message indicator when scrolled up | "New messages" button |
| 7 | Messages from all senders received | Not just own messages |

### Technical Notes
- Subscribe to channel room on WebSocket
- Handle socket reconnection with missed message sync
- Implement message deduplication

### API/Socket Events
```
Socket Event: "message:new"
Data: { message: { id, channelId, senderId, content, createdAt } }
```

---

## MSG-003: Send Direct Message

### User Story
**As a** workspace member,
**I want to** send private messages to another member,
**So that** I can have 1-on-1 conversations.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | DM option when clicking on user | "Send Message" in menu |
| 2 | DM conversation opens in main view | Chat interface shown |
| 3 | DM appears in Direct Messages section | Sidebar DM list |
| 4 | Can send text same as channel messages | Same input behavior |
| 5 | Only sender and receiver see messages | Privacy enforced |
| 6 | DM list shows other user's name/avatar | Identification clear |
| 7 | Unread indicator for DM conversations | Badge on DM list |

### Technical Notes
- Use conversation ID based on sorted user IDs
- Create or fetch existing DM conversation
- Store DMs in separate table or with dm flag

### API Endpoints
```
POST /api/dms
Body: { recipientId, content }
Response: { directMessage: {...} }

GET /api/dms/:conversationId/messages
Response: { messages: [...] }
```

---

## MSG-004: Load Message History

### User Story
**As a** channel member,
**I want to** view previous messages,
**So that** I can catch up on discussions I missed.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Recent messages loaded when opening channel | Last 50 messages shown |
| 2 | Scroll up triggers pagination load | Older messages fetched |
| 3 | Loading indicator while fetching | Spinner visible |
| 4 | Scroll position maintained during load | No jarring jumps |
| 5 | "Beginning of channel" indicator | Reached first message |
| 6 | No duplicates in message list | Clean history |
| 7 | Works for both channels and DMs | Universal behavior |

### Technical Notes
- Cursor-based pagination (before ID)
- Load 50 messages per request
- Merge with existing messages correctly

### API Endpoints
```
GET /api/channels/:channelId/messages
Query: { before?: messageId, limit?: 50 }
Response: { messages: [...], hasMore }
```

---

## MSG-005: Typing Indicators

### User Story
**As a** channel member,
**I want to** see when others are typing,
**So that** I know a response is coming.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | "User is typing..." appears when someone types | Indicator visible |
| 2 | Multiple typers shown: "User1, User2 are typing..." | Multi-user support |
| 3 | Indicator disappears after 3 seconds of inactivity | Timeout behavior |
| 4 | Indicator disappears when message sent | Immediate clear |
| 5 | Own typing not shown to self | Filtered out |
| 6 | Typing animation (dots) visible | Visual pulse |
| 7 | Works in DMs too | Universal behavior |

### Technical Notes
- Debounce typing events (500ms)
- Use Redis/memory for typing state (ephemeral)
- Broadcast to channel/DM room

### API/Socket Events
```
Socket Emit: "typing:start" / "typing:stop"
Data: { channelId }

Socket Receive: "typing:update"
Data: { channelId, users: [{ id, displayName }] }
```

---

## MSG-006: Message Timestamps

### User Story
**As a** user,
**I want to** see when messages were sent,
**So that** I can understand the conversation timeline.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Recent messages show relative time | "Just now", "2 min ago" |
| 2 | Older messages show time | "10:30 AM" |
| 3 | Messages from past days show date | "Yesterday", "Jan 15" |
| 4 | Hover shows full timestamp | Tooltip with exact time |
| 5 | Date separators between days | "Today", "Yesterday", date |
| 6 | Times localized to user timezone | Local time displayed |

### Technical Notes
- Use date-fns or similar for formatting
- Update relative times periodically
- Store UTC, display local

---

## MSG-007: Unread Message Indicators

### User Story
**As a** user,
**I want to** see which channels have unread messages,
**So that** I can prioritize catching up.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Unread badge on channel in sidebar | Numeric badge visible |
| 2 | Badge shows count of unread messages | Accurate count |
| 3 | Mentions show special indicator | Different style for @mentions |
| 4 | Opening channel clears unread state | Badge removed |
| 5 | Workspace-level unread indicator | Total across channels |
| 6 | DM unread indicators | Same for direct messages |

### Technical Notes
- Track last read message ID per user per channel
- Calculate unread count from last read
- Real-time update on new messages

### API Endpoints
```
GET /api/workspaces/:workspaceId/unread
Response: { channels: { channelId: count }, dms: { conversationId: count } }

POST /api/channels/:channelId/read
Body: { lastReadMessageId }
```

---

## MSG-008: Message Grouping

### User Story
**As a** user,
**I want to** see consecutive messages from same sender grouped,
**So that** the chat is easier to read.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Consecutive messages show avatar once | Not repeated |
| 2 | Subsequent messages have reduced spacing | Compact display |
| 3 | Group breaks after 5 minutes gap | New group started |
| 4 | Group breaks for different senders | Proper separation |
| 5 | First message in group shows full header | Name, avatar, time |
| 6 | Hover reveals timestamp on any message | Per-message time |

### Technical Notes
- Client-side grouping logic
- Compare sender ID and timestamp gap
- Apply different CSS for first vs subsequent

---

## MSG-009: Edit Message

### User Story
**As a** message sender,
**I want to** edit my message,
**So that** I can fix typos or clarify my message.

### Priority: P2

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Edit option in message context menu | "Edit" visible |
| 2 | Edit only available for own messages | Others' messages don't show edit |
| 3 | Edit within 5 minutes of sending | Time limit enforced |
| 4 | Message content replaced with input | Inline editing |
| 5 | Press Escape to cancel edit | Cancel works |
| 6 | Press Enter to save edit | Save works |
| 7 | "(edited)" indicator shown on message | Visual indicator |
| 8 | Edit reflected for all viewers | Real-time update |

### Technical Notes
- Validate ownership and time limit server-side
- Broadcast edit to channel members
- Store edited timestamp

### API Endpoints
```
PATCH /api/messages/:messageId
Body: { content }
Response: { message: {...} }
```

---

## MSG-010: Delete Message

### User Story
**As a** message sender,
**I want to** delete my message,
**So that** I can remove messages sent in error.

### Priority: P2

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Delete option in message context menu | "Delete" visible |
| 2 | Delete only for own messages (or admin) | Authorization enforced |
| 3 | Confirmation before delete | "Are you sure?" prompt |
| 4 | Message removed from view | Deleted for all |
| 5 | "Message deleted" placeholder optional | Or just removed |
| 6 | Cannot undo delete | No recovery |

### Technical Notes
- Soft delete vs hard delete decision
- Broadcast deletion to channel
- Admins can delete any message

### API Endpoints
```
DELETE /api/messages/:messageId
Response: { success: true }
```

---

## MSG-011: @Mention Users

### User Story
**As a** message sender,
**I want to** @mention specific users,
**So that** I can get their attention.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Typing @ triggers user autocomplete | Dropdown appears |
| 2 | Autocomplete shows channel members | Searchable list |
| 3 | Selected user inserted as mention | @username format |
| 4 | Mentions styled distinctly | Different color/style |
| 5 | Mentioned user receives notification | Push/in-app notification |
| 6 | Mentions highlighted for mentioned user | Special styling |
| 7 | @channel mentions all members | Special mention type |

### Technical Notes
- Parse mentions server-side
- Store mention references with message
- Send notifications to mentioned users

---

## MSG-012: Link Preview

### User Story
**As a** message sender,
**I want** URLs in my messages to show previews,
**So that** my team can quickly see linked content.

### Priority: P2

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | URLs automatically detected | Link parsing |
| 2 | Preview fetched for supported links | Title, description, image |
| 3 | Preview rendered below message | Card format |
| 4 | Click preview opens link | External navigation |
| 5 | Preview loading state shown | Skeleton while loading |
| 6 | Failed previews show link only | Graceful degradation |

### Technical Notes
- Server-side URL unfurling
- Cache previews (og:tags)
- Rate limit preview fetching

---

## Story Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| MSG-001 | Send Message in Channel | P0 | ⬜ |
| MSG-002 | Receive Real-time Messages | P0 | ⬜ |
| MSG-003 | Send Direct Message | P0 | ⬜ |
| MSG-004 | Load Message History | P0 | ⬜ |
| MSG-005 | Typing Indicators | P0 | ⬜ |
| MSG-006 | Message Timestamps | P0 | ⬜ |
| MSG-007 | Unread Message Indicators | P1 | ⬜ |
| MSG-008 | Message Grouping | P1 | ⬜ |
| MSG-009 | Edit Message | P2 | ⬜ |
| MSG-010 | Delete Message | P2 | ⬜ |
| MSG-011 | @Mention Users | P1 | ⬜ |
| MSG-012 | Link Preview | P2 | ⬜ |
