# Authentication User Stories

## Overview
This document contains all user stories related to user authentication, registration, and session management for CollabSpace.

---

## AUTH-001: User Registration with Email

### User Story
**As a** new user,
**I want to** create an account using my email and password,
**So that** I can access CollabSpace and join workspaces.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | User can access registration page from landing page | Registration link/button visible on landing page |
| 2 | Registration form includes email, display name, password, confirm password | All fields present and labeled |
| 3 | Email validation ensures proper format | Invalid emails show error message |
| 4 | Email must be unique in the system | Duplicate email shows "Email already registered" |
| 5 | Password must be at least 8 characters | Shorter passwords show validation error |
| 6 | Password must include uppercase, lowercase, and number | Weak passwords show requirements |
| 7 | Passwords must match | Mismatch shows "Passwords do not match" |
| 8 | Display name is required (2-50 characters) | Empty/invalid names show error |
| 9 | Successful registration redirects to workspace selection | User lands on empty workspace dashboard |
| 10 | User receives email confirmation (optional for MVP) | Confirmation email sent if configured |

### Technical Notes
- Use bcrypt for password hashing (minimum 10 rounds)
- Store email in lowercase for case-insensitive matching
- Generate UUID for user ID
- Create JWT tokens upon successful registration

### API Endpoints
```
POST /api/auth/register
Body: { email, displayName, password, confirmPassword }
Response: { user: {...}, accessToken, refreshToken }
```

### UI Mockup Reference
- Clean, centered registration form
- Real-time validation feedback
- Password strength indicator
- Link to login page for existing users

---

## AUTH-002: User Login with Email

### User Story
**As a** registered user,
**I want to** log in with my email and password,
**So that** I can access my workspaces and messages.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Login form includes email and password fields | Both fields present |
| 2 | Invalid email shows appropriate error | "Invalid email or password" message |
| 3 | Incorrect password shows appropriate error | Same generic message (security) |
| 4 | Successful login stores tokens securely | Tokens in httpOnly cookies or secure storage |
| 5 | User is redirected to last workspace or dashboard | Appropriate redirect after login |
| 6 | "Remember me" option extends session duration | Checkbox affects token expiry |
| 7 | Login form has link to registration | "Don't have an account? Sign up" |
| 8 | Login form has link to password reset | "Forgot password?" link visible |

### Technical Notes
- Rate limit login attempts (5 attempts per 15 minutes)
- Log failed login attempts for security monitoring
- Use constant-time comparison for password verification

### API Endpoints
```
POST /api/auth/login
Body: { email, password, rememberMe? }
Response: { user: {...}, accessToken, refreshToken }
```

---

## AUTH-003: Google OAuth Login

### User Story
**As a** user,
**I want to** sign in using my Google account,
**So that** I can quickly access CollabSpace without creating a new password.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | "Sign in with Google" button visible on login page | Button clearly visible |
| 2 | Clicking button redirects to Google OAuth consent | Google consent screen appears |
| 3 | User can select which Google account to use | Multiple accounts supported |
| 4 | First-time OAuth creates new user account | User record created with Google profile |
| 5 | Returning OAuth user is logged in directly | No re-registration required |
| 6 | User's display name and avatar pulled from Google | Profile auto-populated |
| 7 | OAuth user can still set/change display name | Profile editing works |
| 8 | OAuth errors show friendly message | "Failed to sign in with Google" with retry |

### Technical Notes
- Use Google OAuth 2.0 with OpenID Connect
- Store Google ID in user record for future matching
- Handle case where Google email already exists (link accounts)
- Profile picture URL stored but re-fetched periodically

### API Endpoints
```
GET /api/auth/google
GET /api/auth/google/callback
Response: Redirect to app with tokens in URL or cookies
```

---

## AUTH-004: Token Refresh

### User Story
**As a** logged-in user,
**I want** my session to remain active without re-logging in,
**So that** I can have an uninterrupted collaboration experience.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Access tokens expire after 15 minutes | Token includes exp claim |
| 2 | Refresh tokens expire after 7 days | Longer-lived refresh token |
| 3 | App automatically refreshes access token before expiry | Silent refresh in background |
| 4 | Refresh token rotation on each use | Old refresh token invalidated |
| 5 | Invalid refresh token forces re-login | User redirected to login page |
| 6 | Token refresh works across page reloads | Tokens persisted appropriately |

### Technical Notes
- Implement token refresh 1 minute before access token expiry
- Store refresh token in httpOnly cookie (not accessible to JS)
- Maintain token blacklist for revoked refresh tokens
- Consider sliding session for active users

### API Endpoints
```
POST /api/auth/refresh
Body: { refreshToken } or Cookie
Response: { accessToken, refreshToken }
```

---

## AUTH-005: User Logout

### User Story
**As a** logged-in user,
**I want to** log out of my account,
**So that** I can secure my session on shared devices.

### Priority: P0

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Logout option available in user menu | Visible in settings/profile dropdown |
| 2 | Clicking logout clears all tokens | Access and refresh tokens removed |
| 3 | User is redirected to login page | Landing or login page shown |
| 4 | Refresh token is invalidated on server | Cannot reuse old refresh token |
| 5 | WebSocket connection is disconnected | Real-time updates stop |
| 6 | User presence changes to offline | Team sees user go offline |

### Technical Notes
- Clear cookies and local storage
- Notify socket server of disconnect
- Add refresh token to blacklist
- Clear any cached user data in app state

### API Endpoints
```
POST /api/auth/logout
Body: { refreshToken } or Cookie
Response: { success: true }
```

---

## AUTH-006: Password Reset Request

### User Story
**As a** user who forgot my password,
**I want to** request a password reset,
**So that** I can regain access to my account.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | "Forgot password?" link on login page | Link clearly visible |
| 2 | Password reset form requests email | Single email input field |
| 3 | Valid email receives reset link | Email with reset URL sent |
| 4 | Invalid email shows same success message | Security: don't reveal if email exists |
| 5 | Reset link expires after 1 hour | Expired link shows error |
| 6 | Reset link can only be used once | Second use shows "Link already used" |
| 7 | Rate limit reset requests | Max 3 requests per hour per email |

### Technical Notes
- Generate cryptographically secure reset token
- Store hashed reset token in database with expiry
- Include user-friendly email template
- Log reset requests for security

### API Endpoints
```
POST /api/auth/forgot-password
Body: { email }
Response: { message: "If email exists, reset link sent" }
```

---

## AUTH-007: Password Reset Completion

### User Story
**As a** user with a password reset link,
**I want to** set a new password,
**So that** I can access my account again.

### Priority: P1

### Acceptance Criteria

| # | Criterion | Testable Requirement |
|---|-----------|---------------------|
| 1 | Reset link opens password reset form | New password + confirm fields |
| 2 | Password validation same as registration | Strength requirements enforced |
| 3 | Successful reset logs user in automatically | Redirected to dashboard with session |
| 4 | All existing sessions are invalidated | Other devices logged out |
| 5 | User receives confirmation email | "Password changed successfully" email |
| 6 | Invalid/expired token shows clear error | "Reset link invalid or expired" |

### Technical Notes
- Invalidate all refresh tokens for user upon password change
- Delete used reset token from database
- Consider requiring old password if user is already logged in

### API Endpoints
```
POST /api/auth/reset-password
Body: { token, newPassword, confirmPassword }
Response: { user: {...}, accessToken, refreshToken }
```

---

## Story Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| AUTH-001 | User Registration with Email | P0 | ⬜ |
| AUTH-002 | User Login with Email | P0 | ⬜ |
| AUTH-003 | Google OAuth Login | P0 | ⬜ |
| AUTH-004 | Token Refresh | P0 | ⬜ |
| AUTH-005 | User Logout | P0 | ⬜ |
| AUTH-006 | Password Reset Request | P1 | ⬜ |
| AUTH-007 | Password Reset Completion | P1 | ⬜ |
