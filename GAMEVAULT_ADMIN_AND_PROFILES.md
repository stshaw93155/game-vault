# GAMEVAULT — Admin Authentication & User Profile System
# Addon Module to GAMEVAULT_COMPLETE.md
#
# This file covers two new systems:
#   A. Admin Panel with hardcoded credential authentication
#   B. Public User Profile System (register/login, wishlist, saves, reviews)
#
# Read GAMEVAULT_COMPLETE.md first. This file extends it.
# Paste Section 6 (MASTER PROMPT ADDON) into your agentic coder
# after the base project is built, or include it in the original prompt.

---

## TABLE OF CONTENTS

1.  [What's New in This Module](#1-whats-new-in-this-module)
2.  [Updated File & Folder Structure](#2-updated-file--folder-structure)
3.  [Admin Authentication System](#3-admin-authentication-system)
4.  [Admin Panel — All Pages with Auth](#4-admin-panel--all-pages-with-auth)
5.  [Public User Profile System](#5-public-user-profile-system)
6.  [Updated localStorage Schema](#6-updated-localstorage-schema)
7.  [MASTER PROMPT ADDON](#7-master-prompt-addon)

---

## 1. WHAT'S NEW IN THIS MODULE

### Admin Side
- Single hardcoded Super Admin credential:
  - Email:    stshaw112@gmail.com
  - Password: Gamervault@2026
- Login page with email + password, show/hide toggle, lock on 5 fails
- Protected admin sidebar visible only after successful auth
- Session stored in sessionStorage — auto logout on tab close
- "Remember Me" stores session in localStorage for 7 days
- Admin profile card in sidebar: avatar initials, name, email, logout button

### User Side (Brand New)
- Public users can create a free account (email + username + password)
- No backend — all user accounts stored in localStorage under gv_users[]
- After login, users get a persistent profile accessible from any page
- Profile page (/profile.html) shows everything in one place:
  - Wishlist (games saved with heart button)
  - Saved Articles (articles bookmarked)
  - My Reviews (reviews the user submitted)
  - Watch Later (upcoming games the user flagged)
  - Account Settings (change username, avatar, password)
- User session stored in sessionStorage (gv_user_session)
- "Remember Me" stores in localStorage for 30 days
- All public pages show a user avatar/login button in navbar

---

## 2. UPDATED FILE & FOLDER STRUCTURE

```
gamevault/
│
├── index.html
├── game.html
├── browse.html
├── upcoming.html
├── goty.html
├── genres.html
├── wishlist.html               ← Now redirects to profile.html#wishlist if logged in
├── articles.html
├── article.html
├── profile.html                ← NEW: User profile hub (all saves in one place)
├── login.html                  ← NEW: Public user login page
├── register.html               ← NEW: Public user registration page
│
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── global.css
│   ├── home.css
│   ├── game.css
│   ├── browse.css
│   ├── upcoming.css
│   ├── goty.css
│   ├── articles.css
│   ├── profile.css             ← NEW: Profile page styles
│   └── auth.css                ← NEW: Login + register page styles
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── storage.js
│   ├── utils.js
│   ├── components.js
│   ├── auth.js                 ← UPDATED: handles both admin + user auth
│   ├── user.js                 ← NEW: all user account CRUD functions
│   ├── profile.js              ← NEW: profile page logic
│   ├── home.js
│   ├── game.js
│   ├── browse.js
│   ├── upcoming.js
│   ├── goty.js
│   ├── genres.js
│   ├── wishlist.js
│   └── articles.js
│
└── admin/
    ├── index.html              ← Admin login (email + password)
    ├── dashboard.html
    ├── articles.html
    ├── games.html
    ├── banners.html
    ├── reviews.html
    ├── media.html
    ├── goty.html
    ├── navigation.html
    ├── settings.html
    └── log.html
```

---

## 3. ADMIN AUTHENTICATION SYSTEM

### 3.1 Hardcoded Credentials

Store these in js/config.js. Never expose in frontend HTML.

```javascript
// js/config.js
const ADMIN_CREDENTIAL = {
  email:    "stshaw112@gmail.com",
  password: "Gamervault@2026",
  name:     "Sumit Shaw",
  role:     "superadmin",
  avatar:   "SS"               // initials for avatar circle
};
```

There is only ONE admin account. No multi-role system needed.
If email + password match exactly → grant access.
If not → reject and count the attempt.

### 3.2 Admin Login Page  (admin/index.html)

#### Visual Design
- Full-page dark layout (#0F0F0F background)
- Centered card (max-width 420px) with subtle border and slight glow
- GameVault logo + "Admin Panel" label at top of card
- No navbar, no footer — completely isolated page

#### Form Fields
```
Email Address    [stshaw112@gmail.com        ] ← type="email"
Password         [••••••••••••••••           ] ← type="password" + eye icon toggle
Remember Me      [ ] Keep me logged in for 7 days
                 [  Sign In  ]  ← primary red button, full width
```

#### Login Logic (in js/auth.js)
```javascript
function adminLogin(email, password, remember) {
  // 1. Check attempt count
  const attempts = parseInt(localStorage.getItem('gv_admin_attempts') || 0);
  const lockUntil = parseInt(localStorage.getItem('gv_admin_lock_until') || 0);

  if (Date.now() < lockUntil) {
    const secondsLeft = Math.ceil((lockUntil - Date.now()) / 1000);
    showFormError(`Too many attempts. Try again in ${secondsLeft}s`);
    startLockCountdown(lockUntil);
    return;
  }

  // 2. Validate credentials (exact match, case sensitive)
  if (email === ADMIN_CREDENTIAL.email && password === ADMIN_CREDENTIAL.password) {
    // Clear attempts
    localStorage.removeItem('gv_admin_attempts');
    localStorage.removeItem('gv_admin_lock_until');

    // Build session object
    const session = {
      email:      ADMIN_CREDENTIAL.email,
      name:       ADMIN_CREDENTIAL.name,
      role:       ADMIN_CREDENTIAL.role,
      avatar:     ADMIN_CREDENTIAL.avatar,
      logged_in_at: Date.now(),
      expires_at:   remember ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null
    };

    // Store session
    sessionStorage.setItem('gv_admin_session', JSON.stringify(session));
    if (remember) localStorage.setItem('gv_admin_session_persist', JSON.stringify(session));

    // Log the login action
    logAction('login', 'system', 'Admin login successful');

    // Redirect to dashboard
    window.location.href = '/admin/dashboard.html';

  } else {
    // Increment attempt counter
    const newAttempts = attempts + 1;
    localStorage.setItem('gv_admin_attempts', newAttempts);

    if (newAttempts >= 5) {
      // Lock for 60 seconds
      const lockUntil = Date.now() + 60000;
      localStorage.setItem('gv_admin_lock_until', lockUntil);
      showFormError('5 failed attempts. Locked for 60 seconds.');
      startLockCountdown(lockUntil);
      disableForm();
    } else {
      showFormError(`Incorrect email or password. ${5 - newAttempts} attempts remaining.`);
      shakeFormCard(); // CSS animation: slight horizontal shake
    }
  }
}
```

#### Auth Guard (runs on every admin page except login)
```javascript
// Called at the very top of every admin page's DOMContentLoaded
function checkAdminAuth() {
  // Check sessionStorage first
  let session = sessionStorage.getItem('gv_admin_session');

  // If not in session, check for persisted login
  if (!session) {
    const persisted = localStorage.getItem('gv_admin_session_persist');
    if (persisted) {
      const data = JSON.parse(persisted);
      // Check if persisted session is still valid (within 7 days)
      if (data.expires_at && Date.now() < data.expires_at) {
        sessionStorage.setItem('gv_admin_session', persisted);
        session = persisted;
      } else {
        // Expired — clear and redirect
        localStorage.removeItem('gv_admin_session_persist');
      }
    }
  }

  if (!session) {
    window.location.href = '/admin/index.html';
    return null;
  }

  return JSON.parse(session);
}
```

#### Admin Logout
```javascript
function adminLogout() {
  sessionStorage.removeItem('gv_admin_session');
  localStorage.removeItem('gv_admin_session_persist');
  logAction('logout', 'system', 'Admin logged out');
  window.location.href = '/admin/index.html';
}
```

### 3.3 Admin Sidebar Profile Card

At the bottom of every admin sidebar, render:

```
┌─────────────────────────┐
│  [SS]  Sumit Shaw        │
│        stshaw112@gmail   │
│        Super Admin       │
│  ──────────────────────  │
│  [⚙ Settings] [↪ Logout]│
└─────────────────────────┘
```

- `[SS]` is a circle div with initials, accent background color
- Name pulled from session.name
- Email pulled from session.email (truncated if long)
- Role badge "Super Admin" in accent color
- Settings → admin/settings.html
- Logout → calls adminLogout()

### 3.4 Admin Login Page UI Details

```
Background: #0F0F0F full page
Card: #1A1A1A, border 1px #2E2E2E, border-radius 16px, padding 40px
      subtle box-shadow: 0 0 40px rgba(255,0,0,0.08)  ← red glow hint

Header:
  - SVG controller icon in accent red (32px)
  - "GameVault" in Rajdhani font, 28px, bold, white
  - "Admin Panel" in Inter, 13px, muted gray, letter-spacing 0.1em

Email input: dark bg (#242424), white text, red focus ring
Password input: same + eye icon button on right (toggles type)

Error message: red text (#EF4444), 13px, appears below password field
Lock countdown: red countdown text "Locked: 47s remaining"

Sign In button:
  background: #FF0000
  color: white
  width: 100%
  height: 44px
  border-radius: 8px
  font-weight: 600
  On hover: #CC0000
  On click (loading): show spinner, disable button

Footer below card:
  "← Back to GameVault" link → index.html
```

---

## 4. ADMIN PANEL — ALL PAGES WITH AUTH

All pages unchanged from GAMEVAULT_COMPLETE.md except for two updates:

### Update 1 — Auth Check at Top of Every Page
Every admin HTML page must include this as the FIRST script that runs:
```html
<script>
  // Auth guard — runs before DOM renders
  (function() {
    const s = sessionStorage.getItem('gv_admin_session');
    const p = localStorage.getItem('gv_admin_session_persist');
    if (!s && !p) window.location.replace('/admin/index.html');
    if (p && !s) {
      const d = JSON.parse(p);
      if (!d.expires_at || Date.now() > d.expires_at) {
        localStorage.removeItem('gv_admin_session_persist');
        window.location.replace('/admin/index.html');
      }
    }
  })();
</script>
```
This runs synchronously before any content renders — no flash of admin UI for unauthenticated users.

### Update 2 — Admin Sidebar with Profile Card
Every admin page sidebar must show:
- All navigation links (same as before)
- Profile card at the bottom (name, email, role, logout button)
- Active page highlighted in sidebar

---

## 5. PUBLIC USER PROFILE SYSTEM

### 5.1 Overview

Public users can optionally create a free account to:
- Save their wishlist across devices (stored per-user in localStorage)
- Bookmark articles
- See all their submitted reviews in one place
- Track upcoming games they want to be notified about
- Customise their display name and avatar color

No backend. All user data stored in localStorage.
Each user is identified by a unique ID generated at registration (uuid-like string).
Multiple user accounts can exist on the same browser (stored in gv_users[] array).

### 5.2 User Registration Page  (register.html)

#### Visual Design
- Matches admin login visual style but lighter / game-themed
- Split layout on desktop: left = dark panel with GameVault branding art, right = form
- Single column on mobile

#### Form Fields
```
Username         [gfx_sumit                  ]  ← 3-20 chars, alphanumeric + underscore
Email Address    [you@email.com              ]  ← type="email"
Password         [••••••••••••               ]  ← min 6 chars, show/hide toggle
Confirm Password [••••••••••••               ]
Avatar Color     [ ● ] [ ● ] [ ● ] [ ● ] [ ● ]  ← 5 color swatches to pick from
                 [  Create Account  ]
Already have an account? Sign In →
```

#### Validation Rules
- Username: 3–20 chars, only letters/numbers/underscore, must be unique in gv_users[]
- Email: valid format, must be unique in gv_users[]
- Password: minimum 6 characters
- Confirm password: must match
- Show inline error below each field on blur

#### Registration Logic
```javascript
function registerUser(username, email, password, avatarColor) {
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');

  // Check uniqueness
  if (users.find(u => u.email === email)) {
    return { error: 'email', message: 'This email is already registered.' };
  }
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { error: 'username', message: 'This username is taken.' };
  }

  // Create new user object
  const newUser = {
    id:           'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    username:     username,
    email:        email,
    password:     password,       // plaintext — this is client-side only, no real security needed
    avatar_color: avatarColor,    // hex color string
    avatar_initials: username.slice(0, 2).toUpperCase(),
    joined_at:    Date.now(),
    wishlist:     [],             // game IDs
    wishlist_status: {},          // { gameId: "want|playing|completed|dropped" }
    saved_articles: [],           // article IDs
    watchlist:    [],             // upcoming game IDs
    reviews:      [],             // { gameId, rating, text, status, submitted_at }
    goty_votes:   {}              // { category: gameId }
  };

  users.push(newUser);
  localStorage.setItem('gv_users', JSON.stringify(users));

  // Auto-login after registration
  loginUser(email, password, false);

  return { success: true };
}
```

### 5.3 User Login Page  (login.html)

#### Visual Design
- Same layout as register.html but simpler
- Left panel: dark branding, right panel: form

#### Form Fields
```
Email Address    [you@email.com              ]
Password         [••••••••••••               ]
Remember Me      [ ] Keep me logged in for 30 days
                 [  Sign In  ]
Don't have an account? Create one →
Forgot password? [Reset] ← just clears password field, shows "Check your email" (fake)
```

#### Login Logic
```javascript
function loginUser(email, password, remember) {
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  const session = {
    id:         user.id,
    username:   user.username,
    email:      user.email,
    avatar_color:    user.avatar_color,
    avatar_initials: user.avatar_initials,
    logged_in_at:    Date.now(),
    expires_at:      remember ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null
  };

  sessionStorage.setItem('gv_user_session', JSON.stringify(session));
  if (remember) localStorage.setItem('gv_user_session_persist', JSON.stringify(session));

  // Redirect to where they came from, or profile
  const returnUrl = new URLSearchParams(window.location.search).get('return') || '/profile.html';
  window.location.href = returnUrl;
}
```

### 5.4 Navbar User State (all public pages)

The navbar right side changes based on login state:

**Logged Out:**
```
[🔍 Search]  [♥ Wishlist]  [Sign In]  [Join Free]
```
- "Sign In" → login.html?return={current_page}
- "Join Free" → register.html
- "♥ Wishlist" → login.html?return=wishlist.html (redirects to login first)

**Logged In:**
```
[🔍 Search]  [♥ 4]  [  SS  ▾ ]
                        ↓ dropdown:
                     My Profile
                     Wishlist (4)
                     Saved Articles (2)
                     My Reviews (1)
                     ──────────────
                     Settings
                     Sign Out
```
- Avatar circle: user's `avatar_color` background, `avatar_initials` text
- Dropdown appears on click (toggle), closes on outside click
- Badge count on wishlist icon = user's wishlist.length

#### Auth State Detection (runs on every public page)
```javascript
// In js/user.js — call getLoggedInUser() on any page to get current user or null
function getLoggedInUser() {
  let session = sessionStorage.getItem('gv_user_session');

  if (!session) {
    const persisted = localStorage.getItem('gv_user_session_persist');
    if (persisted) {
      const data = JSON.parse(persisted);
      if (data.expires_at && Date.now() < data.expires_at) {
        sessionStorage.setItem('gv_user_session', persisted);
        session = persisted;
      } else {
        localStorage.removeItem('gv_user_session_persist');
        return null;
      }
    }
  }

  return session ? JSON.parse(session) : null;
}

// Get full user data from gv_users by session ID
function getUserData(userId) {
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
  return users.find(u => u.id === userId) || null;
}

// Save updated user data back to gv_users
function saveUserData(updatedUser) {
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index > -1) {
    users[index] = updatedUser;
    localStorage.setItem('gv_users', JSON.stringify(users));
  }
}
```

### 5.5 User Profile Page  (profile.html)

**Purpose:** One page where users can see and manage everything they've saved.

#### Layout
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│  SIDEBAR     │   CONTENT AREA                        │
│              │                                       │
│  [SS]        │   (switches based on active tab)      │
│  gfx_sumit   │                                       │
│  Joined 2025 │                                       │
│              │                                       │
│  ─────────── │                                       │
│  ♥ Wishlist  │                                       │
│  🔖 Articles │                                       │
│  ★ Reviews  │                                       │
│  🔔 Watchlist│                                       │
│  ⚙ Settings │                                       │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
```

On mobile: sidebar collapses to horizontal tab strip at top.

#### Tab 1 — Wishlist  (#wishlist)

- Reads user.wishlist[] → fetches each game (custom first, then RAWG)
- Shows full game cards in a responsive grid
- Each card has:
  - Status dropdown: Want to Play / Currently Playing / Completed / Dropped
  - Remove button (× icon, top right of card) with undo toast
  - Quick "View Game" link → game.html?id=
- Stats bar at top: total saved, completed count, playing count, avg rating
- Sort by: Date Added / Title / Rating / Release Date
- Filter by: Status / Platform / Genre
- If wishlist is empty: illustration + "Browse Games" CTA button
- Syncs status changes immediately to user data in gv_users

#### Tab 2 — Saved Articles  (#articles)

- Reads user.saved_articles[] array of article IDs
- Shows article cards: featured image, category badge, title, excerpt, date
- "Unsave" button on each card
- Filter by category
- If empty: "Bookmark articles by clicking the 🔖 icon" message
- Bookmark icon appears on every article card and article.html page
  - Filled = saved, outline = not saved
  - Click toggles save/unsave for logged-in user

#### Tab 3 — My Reviews  (#reviews)

- Reads user.reviews[] — all reviews the user has ever submitted
- Shows: game cover (small), game title, user's star rating, review text, date, status badge
- Status badge: "Pending Approval" (yellow) or "Published" (green) or "Rejected" (red)
- "Edit" button: opens inline edit modal for pending reviews
- "Delete" button: removes from both user.reviews[] and gv_reviews[gameId]
- If empty: "Write your first review on any game page"

#### Tab 4 — Watchlist  (#watchlist)

- Reads user.watchlist[] — upcoming games user wants to track
- Shows game cards with countdown timers
- Sorted by: release date (soonest first)
- "Remove from Watchlist" button per card
- If empty: "Add upcoming games to your watchlist" with link to upcoming.html

#### Tab 5 — Settings  (#settings)

Three sub-sections:

**Profile Info**
```
Display Name      [gfx_sumit                ]  ← editable username
Email             [you@email.com            ]  ← editable
Avatar Color      [ ● ] [ ● ] [ ● ] [ ● ] [ ● ] ← color swatch picker
                  Preview: [SS] ← live preview circle updates as color changes
                  [  Save Changes  ]
```

**Change Password**
```
Current Password  [••••••••••              ]
New Password      [••••••••••              ]
Confirm New       [••••••••••              ]
                  [  Update Password  ]
```

**Danger Zone**
```
┌─────────────────────────────────────────────────┐
│  ⚠ Clear all my data                           │
│  This will delete your wishlist, saved          │
│  articles, reviews, and watchlist.              │
│  Your account will remain active.               │
│  [  Clear My Data  ]  ← opens confirmation modal│
├─────────────────────────────────────────────────┤
│  ⚠ Delete Account                              │
│  Permanently removes your account and all data. │
│  [  Delete Account  ] ← double confirm required │
└─────────────────────────────────────────────────┘
```

### 5.6 User Data Functions  (js/user.js)

```javascript
// ── WISHLIST ───────────────────────────────────────────

function toggleUserWishlist(gameId) {
  const user = getFullCurrentUser();
  if (!user) { redirectToLogin(); return; }
  const idx = user.wishlist.indexOf(gameId);
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    delete user.wishlist_status[gameId];
  } else {
    user.wishlist.push(gameId);
    user.wishlist_status[gameId] = 'want';
  }
  saveUserData(user);
  return idx === -1; // returns true if added, false if removed
}

function setWishlistStatus(gameId, status) {
  const user = getFullCurrentUser();
  if (!user) return;
  user.wishlist_status[gameId] = status;
  saveUserData(user);
}

function isInWishlist(gameId) {
  const user = getFullCurrentUser();
  if (!user) return false;
  return user.wishlist.includes(gameId);
}

// ── SAVED ARTICLES ─────────────────────────────────────

function toggleSavedArticle(articleId) {
  const user = getFullCurrentUser();
  if (!user) { redirectToLogin(); return; }
  const idx = user.saved_articles.indexOf(articleId);
  if (idx > -1) user.saved_articles.splice(idx, 1);
  else user.saved_articles.push(articleId);
  saveUserData(user);
  return idx === -1;
}

function isArticleSaved(articleId) {
  const user = getFullCurrentUser();
  if (!user) return false;
  return user.saved_articles.includes(articleId);
}

// ── REVIEWS ────────────────────────────────────────────

function submitUserReview(gameId, rating, text) {
  const user = getFullCurrentUser();
  if (!user) { redirectToLogin(); return; }

  const review = {
    id:           'rev_' + Date.now(),
    game_id:      gameId,
    rating:       rating,
    text:         text,
    status:       'pending',
    submitted_at: Date.now()
  };

  // Add to user's review list
  user.reviews.push(review);
  saveUserData(user);

  // Add to global gv_reviews for admin moderation
  const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
  if (!allReviews[gameId]) allReviews[gameId] = [];
  allReviews[gameId].push({
    ...review,
    username: user.username,
    avatar_color: user.avatar_color,
    avatar_initials: user.avatar_initials,
    user_id: user.id
  });
  localStorage.setItem('gv_reviews', JSON.stringify(allReviews));

  return review;
}

// ── WATCHLIST ──────────────────────────────────────────

function toggleWatchlist(gameId) {
  const user = getFullCurrentUser();
  if (!user) { redirectToLogin(); return; }
  const idx = user.watchlist.indexOf(gameId);
  if (idx > -1) user.watchlist.splice(idx, 1);
  else user.watchlist.push(gameId);
  saveUserData(user);
  return idx === -1;
}

// ── ACCOUNT ────────────────────────────────────────────

function updateUserProfile(userId, updates) {
  // updates: { username?, email?, avatar_color? }
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
  const user = users.find(u => u.id === userId);
  if (!user) return { error: 'User not found' };

  // Check username uniqueness if changing
  if (updates.username && updates.username !== user.username) {
    if (users.find(u => u.id !== userId && u.username.toLowerCase() === updates.username.toLowerCase())) {
      return { error: 'username', message: 'Username already taken.' };
    }
  }

  Object.assign(user, updates);
  user.avatar_initials = (updates.username || user.username).slice(0, 2).toUpperCase();
  saveUserData(user);

  // Refresh session data
  const session = JSON.parse(sessionStorage.getItem('gv_user_session') || '{}');
  Object.assign(session, { username: user.username, avatar_color: user.avatar_color, avatar_initials: user.avatar_initials });
  sessionStorage.setItem('gv_user_session', JSON.stringify(session));

  return { success: true };
}

function changeUserPassword(userId, currentPassword, newPassword) {
  const user = getUserData(userId);
  if (!user) return { error: 'User not found' };
  if (user.password !== currentPassword) return { error: 'Current password is incorrect.' };
  user.password = newPassword;
  saveUserData(user);
  return { success: true };
}

function deleteUserAccount(userId) {
  // Remove user from gv_users
  const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem('gv_users', JSON.stringify(filtered));

  // Remove their reviews from gv_reviews
  const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
  for (const gameId in allReviews) {
    allReviews[gameId] = allReviews[gameId].filter(r => r.user_id !== userId);
  }
  localStorage.setItem('gv_reviews', JSON.stringify(allReviews));

  // Clear session
  sessionStorage.removeItem('gv_user_session');
  localStorage.removeItem('gv_user_session_persist');

  window.location.href = '/index.html';
}

// Helper — get full user object from current session
function getFullCurrentUser() {
  const session = getLoggedInUser();
  if (!session) return null;
  return getUserData(session.id);
}

// Redirect to login, preserving current page as return URL
function redirectToLogin() {
  window.location.href = '/login.html?return=' + encodeURIComponent(window.location.pathname);
}

function logoutUser() {
  sessionStorage.removeItem('gv_user_session');
  localStorage.removeItem('gv_user_session_persist');
  window.location.reload();
}
```

### 5.7 How User Auth Affects Existing Pages

| Page | Logged Out Behaviour | Logged In Behaviour |
|---|---|---|
| game.html | Heart button → redirects to login | Heart button toggles wishlist immediately |
| game.html | "Notify Me" on upcoming → redirects | Adds to user watchlist |
| game.html | Submit review → redirects to login | Submits review under username |
| article.html | Bookmark icon shown (grayed out) | Bookmark icon toggles save |
| wishlist.html | Shows anonymous localStorage wishlist | Redirects to profile.html#wishlist |
| upcoming.html | "Notify Me" → redirects to login | Adds to user watchlist |
| goty.html | Vote button → redirects to login | Records vote under user account |
| index.html | Navbar: Sign In + Join Free | Navbar: avatar dropdown |

### 5.8 Avatar Color Options

Offer these 8 preset colors for user avatar backgrounds:

```javascript
const AVATAR_COLORS = [
  { name: "Red",    hex: "#EF4444" },
  { name: "Blue",   hex: "#3B82F6" },
  { name: "Green",  hex: "#22C55E" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Orange", hex: "#F97316" },
  { name: "Pink",   hex: "#EC4899" },
  { name: "Teal",   hex: "#14B8A6" },
  { name: "Yellow", hex: "#EAB308" }
];
```

Avatar circle: 40px × 40px, border-radius 50%, `avatar_color` as background,
white text, font-weight 600, font-size 14px, uppercase 2-letter initials.

---

## 6. UPDATED LOCALSTORAGE SCHEMA

### New Keys Added by This Module

```javascript
// ── ADMIN AUTH ─────────────────────────────────────────

// sessionStorage (clears on tab close)
gv_admin_session          // { email, name, role, avatar, logged_in_at, expires_at }

// localStorage (persists — only if "Remember Me" checked)
gv_admin_session_persist  // same object as above, checked on each page load

// localStorage (brute force protection)
gv_admin_attempts         // integer — failed login attempts
gv_admin_lock_until       // timestamp — form locked until this time


// ── USER ACCOUNTS ──────────────────────────────────────

// localStorage
gv_users                  // array of ALL user account objects:
[{
  id:               "user_1714000000000_ab3x7",
  username:         "gfx_sumit",
  email:            "user@email.com",
  password:         "userpassword",        // plaintext (client-side only)
  avatar_color:     "#3B82F6",
  avatar_initials:  "GS",
  joined_at:        1714000000000,
  wishlist:         ["3498", "452638", "game_1714000000000"],
  wishlist_status:  { "3498": "playing", "452638": "want" },
  saved_articles:   ["art_1714000000000"],
  watchlist:        ["game_1714000000001"],
  reviews: [{
    id:           "rev_1714000000000",
    game_id:      "3498",
    rating:       5,
    text:         "Amazing game...",
    status:       "approved",              // pending|approved|rejected
    submitted_at: 1714000000000
  }],
  goty_votes: {
    goty:             "3498",
    best_story:       "452638",
    best_visuals:     "3498",
    best_multiplayer: "452638"
  }
}]


// sessionStorage (clears on tab close)
gv_user_session           // { id, username, email, avatar_color, avatar_initials, logged_in_at, expires_at }

// localStorage (persists — only if "Remember Me" checked)
gv_user_session_persist   // same as above
```

### Modified Keys from GAMEVAULT_COMPLETE.md

```javascript
// gv_reviews — now includes username + user metadata per review
{
  "3498": [{
    id:               "rev_1714000000000",
    game_id:          "3498",
    rating:           5,
    text:             "Amazing game...",
    status:           "approved",
    is_featured:      false,
    username:         "gfx_sumit",          // ← NEW
    avatar_color:     "#3B82F6",            // ← NEW
    avatar_initials:  "GS",                 // ← NEW
    user_id:          "user_1714000000000", // ← NEW
    submitted_at:     1714000000000
  }]
}
```

### Review Card Update (game.html)

When rendering approved reviews, now show:
```
┌─────────────────────────────────────────────────┐
│  [GS]  gfx_sumit            ★★★★★   3 days ago │
│  (avatar circle)                                │
│                                                 │
│  "Amazing game, the story was incredible and    │
│   the combat system is the best I've played." │
│                                                 │
│  ⭐ Featured Review    ← if is_featured = true  │
└─────────────────────────────────────────────────┘
```

---

## 7. MASTER PROMPT ADDON

> Paste this AFTER or ALONGSIDE the prompt from GAMEVAULT_COMPLETE.md Section 7.
> If starting fresh, merge both prompts in the same session.

---

```
═══════════════════════════════════════════════════════════
ADDON: ADMIN AUTHENTICATION + USER PROFILE SYSTEM
Add this to the GameVault project alongside the base build.
═══════════════════════════════════════════════════════════

══════════════════════════════════
PART A — ADMIN AUTHENTICATION
══════════════════════════════════

The admin panel has ONE hardcoded credential. Store it in js/config.js:

  Email:    stshaw112@gmail.com
  Password: Gamervault@2026
  Name:     Sumit Shaw
  Role:     superadmin
  Avatar:   SS (initials)

ADMIN LOGIN PAGE (admin/index.html):

Build a full-page dark login screen (#0F0F0F background).
Center a card (max-width 420px, #1A1A1A, border 1px #2E2E2E, border-radius 16px,
padding 40px, subtle red glow: box-shadow 0 0 40px rgba(255,0,0,0.08)).

Card contents (top to bottom):
  1. SVG controller icon (32px, red #FF0000)
  2. "GameVault" in Rajdhani font, 28px, bold, white
  3. "Admin Panel" in Inter, 13px, muted, letter-spacing 0.1em
  4. Email input (full width, dark bg, white text, red focus border)
  5. Password input + eye icon toggle (show/hide password)
  6. "Remember Me" checkbox — persists session 7 days in localStorage
  7. Error message area (hidden by default, red text)
  8. "Sign In" button — red bg, white text, full width, 44px height
  9. Below card: "← Back to GameVault" link

LOGIN LOGIC:
  - On submit: compare email + password to ADMIN_CREDENTIAL in config.js
  - Exact match, case-sensitive
  - Success: write session to sessionStorage.gv_admin_session
    { email, name, role:"superadmin", avatar:"SS", logged_in_at, expires_at }
    If "Remember Me": also write to localStorage.gv_admin_session_persist
  - Redirect to admin/dashboard.html on success
  - Failure: show error "Incorrect email or password. X attempts remaining."
  - After 5 failures: lock form 60 seconds, show countdown timer, shake animation
  - Track attempts in localStorage.gv_admin_attempts + gv_admin_lock_until

AUTH GUARD (add to EVERY admin page as first inline script before any content):
  Read sessionStorage.gv_admin_session
  If missing, check localStorage.gv_admin_session_persist for valid unexpired session
  If neither valid, immediately window.location.replace('/admin/index.html')
  This runs synchronously — no flash of admin UI for unauthenticated users

ADMIN SIDEBAR PROFILE CARD:
  At the bottom of every admin page sidebar, render a card showing:
  - Circle avatar with "SS" initials on accent red background
  - Name: "Sumit Shaw"
  - Email: "stshaw112@gmail.com" (truncated)
  - Role badge: "Super Admin"
  - Settings link and Logout button
  Logout: clear both sessionStorage.gv_admin_session and
          localStorage.gv_admin_session_persist → redirect to admin/index.html

══════════════════════════════════
PART B — PUBLIC USER PROFILE SYSTEM
══════════════════════════════════

Build a complete user account system for public visitors.
No backend — all user data in localStorage under gv_users[] array.

NEW PAGES TO BUILD:

1. register.html — User registration
2. login.html — User login
3. profile.html — User profile hub (all saves in one place)

─────────────────────────
register.html
─────────────────────────
Split layout desktop: left = dark branding panel, right = form.
Single column on mobile.

Form fields:
  Username (3-20 chars, letters/numbers/underscore, must be unique)
  Email (valid format, must be unique)
  Password (min 6 chars, show/hide toggle)
  Confirm Password (must match)
  Avatar Color (8 color swatches: red, blue, green, purple, orange, pink, teal, yellow)
  "Create Account" button
  "Already have an account? Sign In →" link

On submit:
  Validate all fields with inline errors below each field
  Check uniqueness in gv_users array
  Create new user object:
  {
    id: "user_" + Date.now() + "_" + random5chars,
    username, email, password,
    avatar_color (hex), avatar_initials (first 2 chars uppercase),
    joined_at: Date.now(),
    wishlist: [], wishlist_status: {},
    saved_articles: [], watchlist: [],
    reviews: [], goty_votes: {}
  }
  Push to gv_users array in localStorage
  Auto-login and redirect to profile.html

─────────────────────────
login.html
─────────────────────────
Same visual style as register.html.

Form fields:
  Email input
  Password input with show/hide toggle
  "Remember Me" checkbox — persists 30 days
  "Sign In" button
  "Don't have an account? Create one →" link

On submit:
  Find user in gv_users where email + password match
  Write gv_user_session to sessionStorage:
  { id, username, email, avatar_color, avatar_initials, logged_in_at, expires_at }
  If Remember Me: also write gv_user_session_persist to localStorage
  Redirect to ?return= URL param, or profile.html if none

─────────────────────────
profile.html
─────────────────────────
Requires user to be logged in. If not, redirect to login.html?return=profile.html

Layout:
  Left sidebar (240px): avatar circle, username, "Joined {date}", nav tabs
  Right content area: shows active tab content

Sidebar nav tabs:
  ♥ Wishlist        (shows count badge)
  🔖 Saved Articles  (shows count badge)
  ★ My Reviews      (shows count badge)
  🔔 Watchlist       (shows count badge)
  ⚙ Settings

On mobile: sidebar becomes horizontal scrollable tab strip at top.

TAB 1 — Wishlist:
  Read user.wishlist[] from gv_users[currentUser]
  Fetch each game (check gv_custom_games first, then RAWG API)
  Show game cards in responsive grid (3 cols desktop, 2 tablet, 1 mobile)
  Each card:
    - Game cover, title, platform icons, rating badge
    - Status dropdown: "Want to Play" / "Currently Playing" / "Completed" / "Dropped"
    - Remove button (×) with 5-second undo toast
    - "View Game" link
  Stats bar: total saved, completed, playing, avg metacritic
  Sort by: Date Added / Title / Rating / Release Date
  Filter by: Status / Platform
  Empty state: large illustration + "Browse Games" button → browse.html

TAB 2 — Saved Articles:
  Read user.saved_articles[] array
  Find each article in gv_articles by ID
  Show article cards: featured image, category, title, excerpt, date
  Unsave button per card (removes from saved_articles)
  Filter by category
  Empty state: "Bookmark articles by clicking the 🔖 icon on any article"

TAB 3 — My Reviews:
  Read user.reviews[] from their user object
  Show review cards: game cover (48px), game title, star rating, text, date
  Status badge: "Pending" (yellow) / "Published" (green) / "Rejected" (red)
  Edit button for pending reviews → inline modal with textarea + star picker
  Delete button → removes from both user.reviews and gv_reviews[gameId]
  Empty state: "Write your first review on any game page"

TAB 4 — Watchlist:
  Read user.watchlist[]
  Fetch each game, show cards with countdown timers
  Sort by release date soonest first
  Remove button per card
  Empty state: "Track upcoming games from the Upcoming page"

TAB 5 — Settings:
  Three sections:

  PROFILE INFO:
    Username input (editable, unique check on save)
    Email input (editable)
    Avatar color swatches (8 options, live preview of circle)
    "Save Changes" button

  CHANGE PASSWORD:
    Current password, new password, confirm new password
    "Update Password" button

  DANGER ZONE:
    "Clear all my data" button — deletes wishlist, articles, reviews, watchlist
    Keeps account active. Requires typing "CLEAR" in a confirmation input.
    "Delete Account" button — removes user entirely from gv_users
    Clears session. Requires typing "DELETE" in confirmation input.

─────────────────────────
NAVBAR UPDATES (all public pages)
─────────────────────────

Every public page navbar must check gv_user_session on load.

LOGGED OUT state:
  Right side of navbar: [Search] [Sign In] [Join Free]
  Wishlist heart icon: shown, clicking → login.html?return={currentPage}

LOGGED IN state:
  Right side of navbar: [Search] [♥ {count}] [{initials} ▾]
  Avatar circle: user.avatar_color background, user.avatar_initials text, 36px
  Clicking avatar: toggle dropdown showing:
    - Username and email (header)
    - "My Profile" → profile.html
    - "Wishlist ({count})" → profile.html#wishlist
    - "Saved Articles ({count})" → profile.html#articles
    - Divider
    - "Sign Out" → logoutUser()
  Dropdown closes on outside click or Escape key

─────────────────────────
AFFECTED EXISTING PAGES
─────────────────────────

game.html:
  - Heart/wishlist button: if not logged in → redirect to login.html?return={currentUrl}
    if logged in → toggleUserWishlist(gameId) → update heart icon fill
  - Review submit form: if not logged in → show "Sign in to leave a review" link
    if logged in → submitUserReview(gameId, rating, text)
  - Reviews displayed: show username + avatar circle per review
    Format: [circle] username | ★★★★★ | 3 days ago | review text

article.html and articles.html:
  - Add bookmark icon (🔖) to every article card and article page header
  - If logged out: show grayed-out bookmark, click → login.html?return={currentUrl}
  - If logged in: filled = saved, outline = not saved, click toggles

upcoming.html:
  - "Notify Me" button: if not logged in → redirect to login
    if logged in → toggleWatchlist(gameId) → button text changes "Notifying ✓"

goty.html:
  - Vote button: if not logged in → redirect to login
    if logged in → record vote under user account in gv_users[user].goty_votes

wishlist.html:
  - If logged in: redirect to profile.html#wishlist
  - If logged out: show anonymous localStorage wishlist as before (legacy behaviour)

─────────────────────────
USER DATA FUNCTIONS (js/user.js)
─────────────────────────

Build these functions in js/user.js:

  getLoggedInUser()               - returns session object or null
  getFullCurrentUser()            - returns full user object from gv_users or null
  getUserData(userId)             - get user by ID from gv_users
  saveUserData(updatedUser)       - write updated user back to gv_users
  registerUser(username,email,password,avatarColor) - creates + saves + logs in
  loginUser(email,password,remember) - validates + creates session
  logoutUser()                    - clears session + reload
  redirectToLogin()               - go to login.html?return={currentPath}

  toggleUserWishlist(gameId)      - add/remove from user.wishlist
  setWishlistStatus(gameId,status)- update user.wishlist_status[gameId]
  isInWishlist(gameId)            - returns boolean

  toggleSavedArticle(articleId)  - add/remove from user.saved_articles
  isArticleSaved(articleId)       - returns boolean

  submitUserReview(gameId,rating,text) - adds to user.reviews + gv_reviews
  deleteUserReview(reviewId,gameId)    - removes from both

  toggleWatchlist(gameId)        - add/remove from user.watchlist
  isInWatchlist(gameId)          - returns boolean

  updateUserProfile(userId,updates)    - update username/email/avatar
  changeUserPassword(userId,current,new) - validate + update password
  clearUserData(userId)          - wipe wishlist/articles/reviews/watchlist
  deleteUserAccount(userId)      - remove from gv_users + clear reviews + logout

═══════════════════════════════════════════════════════════
FINAL CHECKLIST — VERIFY BOTH SYSTEMS WORK
═══════════════════════════════════════════════════════════

ADMIN AUTH:
□ admin/index.html has no navbar/footer — completely isolated
□ Login only accepts stshaw112@gmail.com + Gamervault@2026 exactly
□ 5 failed attempts locks form 60 seconds with visible countdown
□ Every admin page has synchronous auth guard as first script
□ Admin sidebar shows Sumit Shaw profile card with logout button
□ Logout clears BOTH sessionStorage and localStorage persist key
□ "Remember Me" keeps admin session alive for 7 days across tab closes

USER PROFILE:
□ register.html validates username uniqueness in gv_users
□ register.html validates email uniqueness in gv_users
□ login.html redirects to ?return= URL after login
□ profile.html redirects to login if no session
□ All 5 profile tabs render correctly with real data
□ Wishlist status dropdown saves immediately on change
□ Article bookmark icon state reflects saved status on page load
□ Reviews show username + avatar on game.html
□ Deleting a review removes it from BOTH user.reviews AND gv_reviews
□ Avatar color swatch selection shows live preview on settings tab
□ "Delete Account" requires typing "DELETE" in confirmation box
□ Navbar correctly shows logged-out vs logged-in state on ALL pages
□ Dropdown menu closes on outside click
□ gv_users array correctly updated by every user action
```

---

*End of GameVault Admin Authentication & User Profile System Documentation*
*New pages: admin/index.html (auth), register.html, login.html, profile.html*
*New JS modules: js/user.js, js/profile.js — updated: js/auth.js*
*Admin credential: stshaw112@gmail.com / Gamervault@2026*
