# Screen Sharing User Stories

## Overview
This document contains all user stories related to screen sharing functionality during video calls in CollabSpace.

---

## SS-001: Start Screen Sharing

### User Story
**As a** user in a video call,
**I want to** share my screen,
**So that** I can show my work, code, or presentations to my call partner.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Screen share button in call controls | Monitor/screen icon |
| 2 | Click prompts browser share dialog | Native picker appears |
| 3 | Can choose entire screen | Full screen option |
| 4 | Can choose specific window | Window picker |
| 5 | Can choose browser tab | Tab picker |
| 6 | Share replaces camera feed for remote | Screen shown to partner |
| 7 | Self-view shows own screen share | Preview visible |
| 8 | Share indicator in controls | Active sharing shown |
| 9 | Audio share option (tab audio) | Include audio checkbox |

### Technical Notes
- Use getDisplayMedia() API
- Create new video track from screen
- Replace video track in peer connection
- Handle renegotiation if needed

### Code Reference
```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'always' },
  audio: true
});
```

---

## SS-002: Stop Screen Sharing

### User Story
**As a** user sharing my screen,
**I want to** stop sharing,
**So that** I can return to camera view or protect privacy.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Stop sharing button visible during share | Clear stop button |
| 2 | Click stops screen share | Sharing ends |
| 3 | Returns to camera feed automatically | Video restored |
| 4 | Browser's "Stop sharing" works | Native button |
| 5 | Remote viewer sees camera again | Video resumes for partner |
| 6 | No manual actions needed to restore camera | Automatic |
| 7 | Closing shared window stops sharing | Edge case handled |

### Technical Notes
- Listen for track ended event
- Re-acquire camera stream
- Replace track in peer connection
- Notify remote of track change

---

## SS-003: Viewer Screen Share Experience

### User Story
**As a** call participant viewing a screen share,
**I want** the shared screen displayed clearly,
**So that** I can see the content being presented.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Screen share fills main video area | Full width/height |
| 2 | Aspect ratio preserved | No stretching |
| 3 | High resolution maintained | Readable text |
| 4 | Sharer's camera moves to PiP | Small overlay |
| 5 | "User is sharing screen" indicator | Clear label |
| 6 | Full-screen option for viewer | Expand button |
| 7 | Smooth video without lag | Quality maintained |

### Technical Notes
- Adjust layout when screen share detected
- Prioritize screen share bandwidth
- Consider resolution constraints

---

## SS-004: Simultaneous Screen Share Handling

### User Story
**As a** user in a call,
**I want** clear handling when both users try to share,
**So that** there's no confusion or conflict.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Only one user can share at a time (MVP) | Second share blocked |
| 2 | "Partner is sharing" disables share button | Visual indication |
| 3 | Message when trying to share during existing share | Clear feedback |
| 4 | When partner stops, share button re-enabled | State updated |
| 5 | Future: Allow simultaneous shares | Phase 2+ |

### Technical Notes
- Track sharing state per participant
- Block second share (MVP simplicity)
- Notify UI of sharing state changes

---

## SS-005: Screen Share Permissions

### User Story
**As a** user,
**I want** clear guidance when screen share fails,
**So that** I can resolve permission issues.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Permission denied shows friendly error | "Screen share blocked" |
| 2 | macOS permission guidance shown | System Preferences link |
| 3 | Chrome tab share guidance | Select correct tab |
| 4 | Cancel in browser picker handled | No error, return to call |
| 5 | Unsupported browser shows message | Feature not available |

### Technical Notes
- Handle NotAllowedError from getDisplayMedia
- Detect OS for specific guidance
- Feature detection for browser support

---

## Story Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| SS-001 | Start Screen Sharing | P0 | ⬜ |
| SS-002 | Stop Screen Sharing | P0 | ⬜ |
| SS-003 | Viewer Screen Share Experience | P0 | ⬜ |
| SS-004 | Simultaneous Screen Share Handling | P1 | ⬜ |
| SS-005 | Screen Share Permissions | P1 | ⬜ |
