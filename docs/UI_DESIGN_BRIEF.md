# TeamSYNC — UI Design Brief

> **Instructions:** Give Gemini the "Design System" block **once** at the start of your session, then paste each screen's prompt one at a time.

---

## Patterns Borrowed & Why

| Pattern | Source UI | Why it fits TeamSYNC |
|---|---|---|
| Hover emoji-reaction picker + "Today" date dividers | Planify | Keeps reactions out of the way until needed; breaks up long chat history without extra chrome |
| Profile/DM panel with About info + Call/Message buttons + filter tabs (Upcoming/Past/Recorded) | Koala UI | Quick 1:1 context (who is this, can I call them right now) + meeting filtering |
| Call + video icons in chat header, right-panel quick-action icon row, sectioned Files/Images/Links with "View All" | MantaUI | Calling should never feel buried — one click from wherever you're chatting |

---

## 0. Design System (paste this into Gemini at the start of your session):
Design tokens for TeamSYNC:
- Colors: use a white-heavy light theme with a strong electric blue accent. The main interface should feel bright, clean, and modern, with white as the dominant background. Use blue selectively for interactive and active elements rather than making the whole UI blue.
  - background: #FFFFFF — main app background
  - surface: #FFFFFF — chat areas, panels, cards
  - surface-subtle: #F6F8FA — sidebar, input areas, subtle hover states
  - surface-active: #EAF2FF — selected channels, active navigation items
  - ink: #16181D — primary text
  - ink-soft: #69707D — secondary text and muted content
  - line: #E1E5EA — borders and dividers
  - accent: #2563EB — primary buttons, active states, links, focus states, and important interactive elements
  - accent-hover: #1D4ED8 — hover and pressed states
  - live: #F59E0B — reserved ONLY for live right now states such as call badges, recording dot, active-call strip, and unread indicators
  - error: #EF4444 — errors and destructive actions
- Fonts: use "DM Sans" for all UI, body, buttons, labels, inputs, and general text. Load it from Google Fonts. Do not use Fraunces or Public Sans.
- Border-radius: keep corners simple and subtle. Use small border-radius values (e.g. 4px) for inputs, buttons, panels, and modals. Avoid excessive rounded/pill-shaped UI.
- Shadows: avoid or minimize shadows. Prefer simple flat sections separated by thin borders.
- Avoid: purple gradients, warm/beige color palettes, muted green palettes, flashy visual effects, expensive/premium-looking visual effects, generic polished SaaS card-with-grey-shadow look, ALL-CAPS labels, arrows appended to button text.
- Prioritize: a clean, simple, white-heavy interface with a clearly visible electric blue accent.

---

## Build Order

Login → Sign up → Welcome → Create/Join → Invite → Home → Main workspace → Right panel → DM/profile panel → Meetings tab → Expanded call view → Empty states

Paste the design system block into Gemini once at the start, then work through this list in order so later screens reuse components (buttons, cards, panels) the earlier ones already established.

---

## Screens

### 1. Login Screen
**Where:** First screen, unauthenticated users.

**Spec:**
- `paper` background, centered `surface` card (10px radius, `line` border, no shadow), ~360px wide.
- Wordmark top of card: "Team" `ink` + "SYNC" `pine`, Fraunces medium.
- Email field, password field (static labels above, not floating).
- Primary button "Log in" (`pine` fill, full width).
- Below: "Forgot password?" text link, right-aligned, `ink-soft`.
- Divider with "or" text, then a secondary "Continue with Google" button (`surface` fill, `line` border, small Google icon).
- Bottom of card: "Don't have an account? Sign up" — "Sign up" as a `pine`-colored inline link, not a separate button.

**Gemini Prompt:**
```
Build the login screen for TeamSYNC. [paste design system block]
Centered surface card (360px wide, 10px radius, line border, no shadow)
on a paper background. Top: wordmark "Team" in ink + "SYNC" in pine,
Fraunces font. Email field and password field, static labels above each
field (not floating labels). Primary "Log in" button, pine fill, full
width. Below it: "Forgot password?" link, right-aligned, ink-soft color.
A divider with "or" text, then a secondary "Continue with Google" button
(surface fill, line border, Google icon + label). Bottom: "Don't have an
account? Sign up" with "Sign up" as a pine-colored inline link.
```

---

### 2. Sign Up Screen
**Where:** From the "Sign up" link on login.

**Spec:**
- Same card shell as login.
- Fields: full name, email, password (with a strength hint below it — plain text, not a colored bar).
- Primary "Create account" button (`pine` fill).
- Same "Continue with Google" secondary option below a divider.
- Bottom: "Already have an account? Log in" link back.
- Small line under the button: "By signing up you agree to our Terms and Privacy Policy" — `ink-soft`, 11px.

**Gemini Prompt:**
```
Build the sign-up screen for TeamSYNC, same card shell as the login
screen. [paste design system block]
Fields: full name, email, password — static labels above each, and a
plain-text password strength hint below the password field (e.g. "Good
password" in ink-soft, no colored strength bar). Primary "Create
account" button, pine fill, full width. Divider with "or", then
"Continue with Google" secondary button. Bottom: "Already have an
account? Log in" with "Log in" as a pine inline link. Small 11px
ink-soft line below the button: "By signing up you agree to our Terms
and Privacy Policy."
```

---

### 3. Welcome Screen *(post-login, first time)*
**Where:** Right after first login, before any workspace exists.

**Spec:**
- `paper` background, no gradient/hero image.
- Fraunces greeting: "Welcome, {name} 👋"
- One-line value prop: "Chat and calls, in the same place."
- Two stacked buttons: "Create a workspace" (`pine` fill), "Join a workspace" (`surface` fill, `line` border).
- Small link below: "Have an invite link? Paste it here."

**Gemini Prompt:**
```
Build the post-login welcome screen for TeamSYNC. [paste design system
block] Paper background, no hero image or gradient. Fraunces greeting
"Welcome, Jordan 👋", one-line value prop below in Public Sans ink-soft:
"Chat and calls, in the same place." Two stacked buttons in a 280px
column: primary "Create a workspace" (pine fill), secondary "Join a
workspace" (surface fill, line border). Small text link below: "Have an
invite link? Paste it here" (ink-soft, 12px).
```

---

### 4. Create / Join Workspace
**Where:** From the welcome screen buttons.

**Spec:**
- Centered `surface` card, pill segmented control at top: "Create" / "Join".
- **Create path:** workspace name field, team-size chips, "Continue" button.
- **Join path:** invite code/email field, confirmation state ("We found Acme Inc. — request to join?").

**Gemini Prompt:**
```
Build the create/join workspace screen for TeamSYNC. [paste design
system block] Centered surface card (10px radius, line border), pill
segmented control at top ("Create" / "Join", active segment pine fill).
Create path: workspace name field, then team-size chips ("Just me",
"2–10", "11–50", "50+"), then "Continue" button (pine fill,
bottom-right). Join path: single field for invite code or email, with a
confirmation state once detected: "We found Acme Inc. — request to
join?" and a pine "Request to join" button.
```

---

### 5. Invite Teammates *(skippable)*

**Gemini Prompt:**
```
Build an invite-teammates screen for TeamSYNC using the same card shell
as create/join. [paste design system block] Multi-email input (chips on
enter/comma), then "Or share a link" with a read-only invite URL field
and a "Copy" button (icon + label). Bottom row: "Skip for now" text link
on the left (ink-soft, same tap-target size as the button) and "Send
invites" (pine fill) on the right.
```

---

### 6. Home / Activity Feed
**Where:** First real screen after setup — landing page every day after login.

**Spec:**
- Left nav rail (persistent, see Screen 7).
- Pinned live-call row at the very top if anything is live workspace-wide: ember dot + "2 on a call in #product."
- Dismissible "Getting started" checklist card below that.
- Reverse-chronological activity list: mentions, DM previews, "X started a call in #channel" — plain rows with `line` hairline dividers, no card-per-item.

**Gemini Prompt:**
```
Build the Home/activity feed screen for TeamSYNC. [paste design system
block] Persistent left nav rail (same as main workspace) + single center
column, max-width 640px, left-aligned. If any call is live anywhere in
the workspace, pin a slim row at the very top with an ember dot + "X on
a call in #channel." Below that, a dismissible "Getting started" card
(surface, line border, 10px radius) with 3 checklist items, checkboxes
fill pine when done. Below that, a reverse-chronological activity list
(mentions, DM previews, call-started notices) as plain rows separated by
line hairline dividers — not individual bordered cards.
```

---

### 7. Main Workspace (Channel + Chat) — Core Screen
**Where:** Most-used screen. Borrows MantaUI's header call icons and Planify's hover reactions + date divider.

**Spec:**
- **Top bar:** workspace switcher, centered search, notification bell, "New meeting" button (`pine` outline), avatar.
- **Left rail (200px):** Home / DMs / Meetings / Files nav rows, then channel list — live channels get an `ember` dot.
- **Center column:**
  - Header: channel name + topic, plus phone and video-camera icons top-right (one-click call, no menu).
  - If a call is live: call strip appears below the header.
  - Messages: plain blocks, no bubbles. A "Today" divider separates message groups by day.
  - Hover a message → small reaction picker pops up above it (4–5 emoji + "+" for more).
  - Composer: attach icon, huddle/headset icon, send icon.
- **Right panel:** collapsible, members/files/meetings (see Screen 9).

**Gemini Prompt:**
```
Build the main workspace screen for TeamSYNC: channel list + live chat +
call awareness. [paste design system block]
Top bar (44px, surface bg, bottom line border): wordmark/workspace
switcher, centered search field (surface-sunken, no border, 4px radius),
notification bell, "New meeting" button (pine outline), avatar.
Left rail (200px, surface-sunken bg): Home/DMs/Meetings/Files nav rows
with outline icons, active item gets a 2px pine left-border accent (not
a filled pill). Channel list below — channels with a live call show a
small ember dot next to the name.
Center column: channel header showing name + topic, PLUS a phone icon
and a video-camera icon on the top-right of the header so a call can be
started directly from the channel with one click (no submenu). If a
call is active, show a call strip below the header (surface bg tinted
8% ember, avatars, "Join" button). Messages as plain left-aligned blocks
(avatar, sender name medium weight, ink-soft timestamp, body) — no
bubbles. Insert a centered "Today" text divider (ink-soft, small, with a
line on either side) between message groups from different days.
Hovering over any message reveals a small floating reaction picker
directly above it, with 4-5 emoji icons and a "+" button for more,
surface background with a line border. Composer at the bottom:
plain-bordered input, attach icon, headset/huddle icon (equal visual
weight to send), send icon.
Right panel (200px, collapsible): placeholder for now, will be built
separately.
```

---

### 8. DM / 1:1 Profile Panel
**Where:** Opens when you click a person's name/avatar, in a DM or from the members list. Borrows Koala UI's structured profile panel.

**Spec:**
- Right-side panel (or full detail view on mobile), `surface` background.
- Top: avatar, name, email/title below it in `ink-soft`.
- Row of direct action buttons right under the name: "Message," "Call," "Video" — fast path from "who is this" to "let's talk," no extra clicks.
- "About" section: role, location, timezone, "joined" date — plain label/value rows.
- "Shared files" section below, 2-3 recent items with a "View All" link.

**Gemini Prompt:**
```
Build a 1:1 profile panel for TeamSYNC, shown when clicking a person's
avatar or name. [paste design system block] Surface background panel,
320px wide. Top: large circular avatar, name (Public Sans medium, 16px),
title/email below in ink-soft. Directly below that, a row of three
buttons: "Message" (pine fill), "Call" (surface fill, line border, phone
icon), "Video" (surface fill, line border, video icon) — equal width,
side by side. Below that, an "About" section with plain label/value rows
(Role, Location, Timezone, Joined date) separated by hairline dividers,
no card backgrounds. Below that, a "Shared files" section: 2-3 recent
file rows with a small file-type icon, plus a "View All" link
right-aligned next to the section title.
```

---

### 9. Right Context Panel *(upgraded, for Screen 7)*
**Where:** The collapsible right panel in the main workspace. Combines MantaUI's quick-action row + Planify's expandable sections.

**Spec:**
- Top: row of 4 small icon buttons — Notifications, Pin channel, Members, Settings.
- Below: expandable sections with chevron to collapse:
  - **Members** — avatar list, "+N" overflow if more than 5.
  - **Files** — recent 3-4 with type icons, "View All" link.
  - **Media** — 2×2 thumbnail grid, "View All" link.
  - **Upcoming meetings** — next 1-2 with time.

**Gemini Prompt:**
```
Build the right-side context panel for TeamSYNC's main workspace screen.
[paste design system block] Surface-sunken background, 220px wide. Top
row: 4 small icon-only buttons in a horizontal row (bell for
notifications, pin for pin-channel, people for members, gear for
settings), evenly spaced, ink-soft icon color, subtle hover state.
Below that, expandable sections, each with a small chevron on the right
of its title to collapse/expand: "Members" (avatar row, showing max 5
avatars then a "+N" circle), "Files" (3-4 rows with small file-type
icons and filename + size), "Media" (2x2 thumbnail grid), "Upcoming
meetings" (1-2 rows with time + meeting name). Each section title in
Public Sans medium, "View All" link (pine, small) next to Files and
Media section titles only.
```

---

### 10. Meetings Tab
**Where:** Left rail "Meetings" nav item. Borrows Koala UI's filter-tab pattern.

**Spec:**
- Top: filter tabs — "Upcoming," "Past," "Recorded" — active tab underlined in `pine`.
- Below: list of meeting rows with title, channel/participants, time, and a "Join" button (only if live or starting soon).
- Past/Recorded tabs show a small play icon instead of "Join" if a recording exists.

**Gemini Prompt:**
```
Build the Meetings tab for TeamSYNC. [paste design system block] Top:
three filter tabs — "Upcoming", "Past", "Recorded" — plain text tabs
with the active one having a 2px pine underline (no filled pill
background). Below, a list of meeting rows: meeting title (medium
weight), small line of participant avatars or "#channel" name, time/date
in ink-soft. On the Upcoming tab, a "Join" button (pine fill) appears
only on rows starting within 10 minutes or currently live (paired with
a small ember dot). On the Recorded tab, rows show a small play icon
instead of Join, linking to a recording.
```

---

### 11. Expanded Call View

**Gemini Prompt:**
```
Build the expanded/full video call view for TeamSYNC. [paste design
system block] The call surface floats over a dimmed backdrop (ink at
40% opacity) of the workspace behind it — the only screen using a drop
shadow. Video grid: ink (#1A1D1B) background, participant tiles at 6px
radius, each with a small surface-on-ink name pill bottom-left. Control
bar: centered, floating, ink-filled pill with mute, video, share-screen,
reactions, and leave icons — "Leave" is the only brick-colored control
in the app. Toggleable chat side panel slides in from the right,
matching the main workspace's composer style. If recording: small ember
dot + "Recording" label, top-left corner.
```

---

### 12. Empty States *(reusable pattern)*

**Gemini Prompt:**
```
Build empty-state components for TeamSYNC (empty DMs, empty files,
empty search results, empty meetings list). [paste design system block]
Pattern: one plain sentence in ink-soft stating what's missing, plus one
pine-colored action button below it — no illustrations. Examples: empty
DMs → "No direct messages yet." + "Message a teammate" button. Empty
files → "No files shared in this channel yet." + "Upload a file" button.
Empty meetings → "No meetings scheduled." + "Schedule a meeting" button.
```

---

*End of UI Design Brief*
