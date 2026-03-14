# GAMEVAULT — Complete Project Documentation & Build Prompt
> Full-stack game discovery platform with admin dashboard.
> Technology: HTML5 · CSS3 · Vanilla JavaScript · RAWG API · localStorage
> Paste Section 7 (the Master Prompt) into any agentic coder to build the entire project.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [File & Folder Structure](#2-file--folder-structure)
3. [Public Website — All Pages](#3-public-website--all-pages)
4. [Admin Dashboard — All Pages](#4-admin-dashboard--all-pages)
5. [RAWG API Reference](#5-rawg-api-reference)
6. [Data Architecture & localStorage Schema](#6-data-architecture--localstorage-schema)
7. [MASTER BUILD PROMPT](#7-master-build-prompt)

---

## 1. PROJECT OVERVIEW

**GameVault** is a fully client-side game discovery platform — like IGN meets Steam — built
with zero backend. All game data comes from the free RAWG API. All user and admin content
is stored in localStorage. The project consists of two parts:

- **Public Site** — 8 pages for visitors to browse, discover, wishlist, and review games
- **Admin Dashboard** — 11 pages for the site owner to upload articles, manage banners,
  moderate reviews, control GOTY voting, and configure every part of the site

**Key Constraints:**
- Pure HTML + CSS + Vanilla JS only. No React, no Vue, no build tools.
- No backend. No server. No database. No login for public users.
- Admin panel protected by a hardcoded password (role-based, sessionStorage).
- All images uploaded by admin stored as base64 strings in localStorage.
- RAWG API free tier — 500,000+ games, no payment required.
- Deploy as static files on Vercel, Netlify, or GitHub Pages.

---

## 2. FILE & FOLDER STRUCTURE

```
gamevault/
│
├── index.html                  ← Public: Home / Discovery Feed
├── game.html                   ← Public: Game Detail Page
├── browse.html                 ← Public: Browse & Search
├── upcoming.html               ← Public: Upcoming Releases
├── goty.html                   ← Public: Game of the Year Voting
├── genres.html                 ← Public: Genres Explorer
├── wishlist.html               ← Public: My Wishlist / Library
├── articles.html               ← Public: Articles & News Listing
├── article.html                ← Public: Single Article View
│
├── css/
│   ├── reset.css               ← CSS reset / normalize
│   ├── variables.css           ← All CSS custom properties (colors, fonts, spacing)
│   ├── global.css              ← Navbar, footer, cards, badges, buttons
│   ├── home.css                ← Hero, horizontal scroll rows
│   ├── game.css                ← Detail page, gallery, requirements, reviews
│   ├── browse.css              ← Search, filters, results grid
│   ├── upcoming.css            ← Calendar grid, countdown timers
│   ├── goty.css                ← Nominee cards, vote chart
│   ├── articles.css            ← Article list, single article
│   └── admin.css               ← All admin panel styles
│
├── js/
│   ├── config.js               ← RAWG API key, site settings constants
│   ├── api.js                  ← All RAWG API fetch functions
│   ├── storage.js              ← localStorage read/write helpers
│   ├── auth.js                 ← Admin session check, role validation
│   ├── utils.js                ← Shared helpers (slugify, formatDate, debounce)
│   ├── components.js           ← Reusable HTML builders (game card, rating badge)
│   ├── home.js                 ← Home page logic
│   ├── game.js                 ← Game detail page logic
│   ├── browse.js               ← Browse + search + filter logic
│   ├── upcoming.js             ← Upcoming page + countdown timer logic
│   ├── goty.js                 ← GOTY voting logic + chart
│   ├── genres.js               ← Genres page logic
│   ├── wishlist.js             ← Wishlist CRUD logic
│   └── articles.js             ← Articles listing + single article logic
│
├── admin/
│   ├── index.html              ← Admin: Login Gate
│   ├── dashboard.html          ← Admin: Overview / Stats
│   ├── articles.html           ← Admin: Article Manager + Editor
│   ├── games.html              ← Admin: Custom Game Manager
│   ├── banners.html            ← Admin: Homepage Banner Manager
│   ├── reviews.html            ← Admin: Review Moderation Queue
│   ├── media.html              ← Admin: Media Library
│   ├── goty.html               ← Admin: GOTY Voting Manager
│   ├── navigation.html         ← Admin: Nav & Menu Manager
│   ├── settings.html           ← Admin: Site Settings
│   └── log.html                ← Admin: Activity Log
│
└── assets/
    ├── favicon.ico
    ├── logo.svg
    └── placeholder.jpg         ← Default fallback image
```

---

## 3. PUBLIC WEBSITE — ALL PAGES

### PAGE 1 — Home / Discovery Feed  (`index.html`)

**Purpose:** Main entry point. Feels like Netflix/Steam homepage.

#### Hero Section
- Full-screen banner featuring the top-rated game of the week from RAWG
- Game's `background_image` used as cinematic blurred backdrop
- Overlay: Game title, rating badge, genre tags, platform icons, ESRB label, release year
- Two CTA buttons: "View Game" (→ game.html?slug=) and "Add to Wishlist"
- Auto-rotates every 6 seconds through top 3 games with smooth fade transition
- Pause on hover

#### Content Rows (horizontal scroll, each with arrow nav buttons)
| Row Label | RAWG Query |
|---|---|
| Trending Now | `?ordering=-rating&page_size=12` |
| New Releases | `?dates={30_days_ago},{today}&ordering=-released&page_size=12` |
| Coming Soon | `?dates={tomorrow},{6_months}&ordering=released&page_size=12` |
| Top Rated All Time | `?metacritic=90,100&ordering=-metacritic&page_size=12` |
| Action Games | `?genres=4&ordering=-rating&page_size=12` |
| RPG Games | `?genres=5&ordering=-rating&page_size=12` |
| PC Exclusives | `?platforms=4&ordering=-rating&page_size=12` |
| Admin Featured | Read from `gv_custom_games` where `feature_flags.hero = true` |

#### Game Card Component (used on ALL pages)
- Thumbnail image (`background_image`)
- Game title (truncated at 2 lines)
- Rating badge — color coded: green ≥80, yellow 60–79, red <60
- Platform icons row (PC, PS5, Xbox, Switch as small SVG icons)
- First 2 genre tags as pills
- On hover: card scales 1.05x, shows wishlist heart button + "View Game" overlay
- Clicking anywhere → `game.html?id={game.id}`

#### Featured Articles Strip
- Horizontal row of latest 3 published articles from `gv_articles` localStorage
- Shows: featured image, category badge, title, short excerpt, read time

---

### PAGE 2 — Game Detail Page  (`game.html?id={id}`)

**Purpose:** Full information page for a single game. Reads `?id=` from URL.
Checks `gv_custom_games` first, falls back to RAWG API `/games/{id}`.

#### Header / Hero
- Full-width `background_image` with dark gradient overlay
- Game title (large), `description_raw` (truncated, "Read More" expands)
- Score cluster: Metacritic score (large, color-coded), RAWG rating out of 5, total ratings count
- Platform icons, genre pills, ESRB badge, release date
- Action row: "♥ Wishlist", "🔗 Share", "🌐 Official Site" (from `website` field)

#### Trailer
- If `clip` exists on RAWG response, embed video player
- If admin added `trailer_url`, embed YouTube iframe
- Autoplay muted on load, unmute on click

#### Screenshots Gallery
- Horizontal thumbnail strip from `/games/{id}/screenshots`
- Click any → full-screen lightbox modal with prev/next arrow navigation
- Keyboard support: left/right arrows, Escape to close
- Counter: "3 / 12" shown in lightbox

#### System Requirements (PC only)
- Two-column table: Minimum vs Recommended
- Rows: OS, Processor, Memory, Graphics, DirectX, Storage
- Data from `platforms[]` where `platform.slug = "pc"`
- Show "Requirements not available" gracefully if missing

#### Rating Breakdown
- Pulled from `ratings[]` array on game object
- Four categories: Exceptional, Recommended, Meh, Skip
- Animated horizontal bar chart (CSS width transition on load)
- Each bar shows count and percentage

#### User Reviews Section
- Write a Review form: 1–5 star picker (clickable stars) + text area + "Submit" button
- Submitted reviews saved to `gv_reviews[game_id]` with status `"pending"`
- Only reviews with status `"approved"` shown publicly
- Reviews displayed as cards: star rating, review text, relative timestamp
- "Pinned" reviews (set by admin) shown first with a ⭐ badge
- Empty state: "No reviews yet. Be the first!"

#### More Info Sidebar
- Developer(s), Publisher(s) from `developers[]`, `publishers[]`
- Tags from `tags[]` — first 10, as clickable pills → browse.html?tag={slug}
- Where to Buy: `stores[]` list with external links
- DLC & Additions: from `/games/{id}/additions` — horizontal mini-card row
- More in Series: from `/games/{id}/game-series` — horizontal mini-card row

---

### PAGE 3 — Browse & Search  (`browse.html`)

**Purpose:** Full catalogue search and filter experience.

#### Search Bar
- Prominent top search input, `?search=` RAWG param with 300ms debounce
- Autocomplete dropdown: first 5 results shown as preview cards
- URL updates with search query for shareable links
- Clear (×) button resets search

#### Filter Sidebar (collapsible on mobile)
| Filter | Type | Source |
|---|---|---|
| Genre | Multi-select checkboxes | `/genres` endpoint |
| Platform | Checkboxes | PC=4, PS5=187, Xbox=186, Switch=7 |
| Release Year | Range slider 1980–2025 | `dates` param |
| Min Metacritic | Single slider 0–100 | `metacritic` param |
| ESRB Rating | Dropdown | `esrb_rating` param |
| Sort By | Radio buttons | `ordering` param |
| Include Custom Games | Checkbox | Merge `gv_custom_games` into results |

#### Sort Options
- Relevance (default for search), Highest Rated, Newest, Oldest, Most Popular, A–Z, Z–A

#### Results Grid
- Responsive CSS grid: 4 cols desktop, 2 cols tablet, 1 col mobile
- "Showing 1–20 of 4,320 results" count line
- Grid / List view toggle (saves preference to localStorage)
- Infinite scroll: load next page when user reaches bottom (uses `next` URL from API response)
- Empty state with "No games found" illustration

---

### PAGE 4 — Upcoming Releases  (`upcoming.html`)

**Purpose:** Calendar-style view of upcoming game releases with live countdowns.

- RAWG query: `?dates={today},{6_months_later}&ordering=released&page_size=40`
- Merge with `gv_custom_games` where `released` is in the future
- Games grouped into monthly sections (e.g. "April 2025", "May 2025")
- Each game card shows: cover, title, platform icons, exact release date
- Live countdown timer below each card: "14 days 6 hrs 22 min" — updates every second
- "Notify Me" button → adds to `gv_watchlist` in localStorage with a toast confirmation
- Platform tabs at top: All / PC / Console / Mobile — filters visible cards
- Hype bar: `added` count from RAWG shown as a relative width bar per game

---

### PAGE 5 — Game of the Year Voting  (`goty.html`)

**Purpose:** Community voting for GOTY award across multiple categories.

#### Nominees Section
- Top 10 games pulled from RAWG: `?dates={year}-01-01,{year}-12-31&ordering=-metacritic&page_size=10`
- Admin can override nominee list via `gv_goty_nominees` in localStorage
- Each nominee shown as a large card: cover art, title, developer, Metacritic score

#### Voting Mechanic
- One vote per visitor per category, stored in `gv_user_votes`
- On vote: card pulses, vote count animates up, "Your Vote" badge appears on chosen card
- Categories: Game of the Year / Best Story / Best Visuals / Best Multiplayer
- Category tabs switch between vote views

#### Live Leaderboard
- Animated horizontal bar chart below nominees
- Bars update immediately when user votes
- Total vote count shown
- "Voting closes {date}" — set by admin in `gv_settings`

#### Winner Announcement Banner
- If admin sets `gv_goty_votes.winner_announced = true`, show winner banner at top
- Confetti animation on banner reveal

---

### PAGE 6 — Genres Explorer  (`genres.html`)

**Purpose:** Visual directory of all game genres.

- Fetches `/genres` from RAWG (returns ~20 genres with `image_background` and `games_count`)
- Rendered as responsive image-card grid (3 cols desktop, 2 tablet, 1 mobile)
- Each card: genre background image, genre name, game count ("4,200+ games")
- On hover: image zooms 1.1x with smooth transition, dark overlay lightens
- Click → `browse.html?genre={id}` to see all games in that genre

---

### PAGE 7 — Wishlist & My Library  (`wishlist.html`)

**Purpose:** Personal game collection — no login, all localStorage.

- Reads `gv_wishlist` array of game IDs from localStorage
- For each saved ID: checks `gv_custom_games` first, then fetches from RAWG
- Stats bar at top: Total Saved, Completed, Playing, avg rating of wishlist
- Each game shows a status dropdown: "Want to Play" / "Playing" / "Completed" / "Dropped"
- Status stored in `gv_wishlist_status[game_id]`
- Remove button with 5-second undo toast
- Sort by: Date Added / Rating / Release Date / Title
- Filter by: Status / Platform / Genre
- Empty state: "Your library is empty. Start adding games!" with link to browse

---

### PAGE 8–9 — Articles  (`articles.html` + `article.html`)

**Purpose:** News and editorial content managed entirely from admin.

**articles.html (listing)**
- Reads all `gv_articles` where `status = "published"` from localStorage
- Filter tabs: All / News / Reviews / Features / Guides / Opinion
- Search bar filters by title
- Cards: featured image, category badge (color-coded), title, author, date, read-time estimate
- Pagination: 9 per page

**article.html?slug={slug} (single)**
- Reads article from `gv_articles` by matching slug
- Renders: featured image, category, title, author, date, rich text body
- Related game card (if `related_game_id` set) in sidebar
- Tags as clickable pills
- "More Articles" row at bottom (same category)
- Share button copies URL to clipboard

---

## 4. ADMIN DASHBOARD — ALL PAGES

All admin pages at `/admin/`. Every page starts with this auth check:
```javascript
// Top of every admin page JS
const session = sessionStorage.getItem('gv_admin_session');
if (!session) window.location.href = '/admin/index.html';
const { role } = JSON.parse(session);
```

### ADMIN PAGE A0 — Login Gate  (`admin/index.html`)

- Username + password fields (show/hide toggle on password)
- Credentials hardcoded in `config.js` as a roles object:
  ```javascript
  const ADMIN_ROLES = {
    "admin":     { password: "gv_admin_2025",     role: "superadmin" },
    "editor":    { password: "gv_editor_2025",    role: "editor" },
    "moderator": { password: "gv_mod_2025",       role: "moderator" }
  };
  ```
- On success: write `{role, logged_in_at}` to sessionStorage → redirect based on role
- "Remember me" checkbox → also write to localStorage for persistence
- Lock form for 60 seconds after 5 failed attempts
- Dark theme locked — no toggle

---

### ADMIN PAGE A1 — Dashboard Home  (`admin/dashboard.html`)

**Roles:** Super Admin, Editor

#### Stats Cards Row
- Total Published Articles (from `gv_articles` count)
- Total Custom Games (from `gv_custom_games` count)
- Pending Reviews (from `gv_reviews` where status = "pending")
- Active Banners (from `gv_banners` where `is_active = true`)
- Total Media Files (from `gv_media` count)
- Total GOTY Votes (sum of all votes in `gv_goty_votes`)

#### Quick Actions
- "+ New Article" → `admin/articles.html?action=new`
- "+ Add Game" → `admin/games.html?action=new`
- "+ Upload Banner" → `admin/banners.html?action=new`
- "Review Queue" → `admin/reviews.html`

#### Recent Activity Feed
- Last 5 articles (title, status badge, timestamp)
- Last 5 pending reviews (game name, star rating, first 60 chars of text)
- Last 10 entries from `gv_activity_log`

---

### ADMIN PAGE A2 — Article Manager  (`admin/articles.html`)

**Roles:** Super Admin, Editor

#### Articles Table
| Column | Detail |
|---|---|
| Title | Truncated to 50 chars, clickable → edit |
| Category | Color-coded badge |
| Status | Draft / Published / Scheduled |
| Date | Created or scheduled date |
| Actions | Edit · Preview · Delete |

- Search bar (live filter by title)
- Status filter tabs: All / Published / Draft / Scheduled
- Sort: Newest / Oldest / A–Z
- Bulk select + bulk delete / bulk publish
- Pagination: 10 per page

#### Article Editor (New / Edit — same page, ?action=new or ?id=xxx)

**Form Fields:**
| Field | Type | Notes |
|---|---|---|
| Title | Text input | Required. Auto-generates slug (shown below, editable) |
| Body | Rich text | Toolbar: B, I, H2, H3, Link, Image embed, Blockquote, Code |
| Featured Image | File upload | Stores to `gv_media`, shows preview |
| Category | Select | News / Review / Feature / Guide / Opinion |
| Tags | Tag input | Comma-separated, autocomplete from existing tags |
| Related Game | Search picker | Type → searches RAWG live → select to attach |
| Author | Text | Auto-filled from session username, editable |
| Meta Title | Text | SEO. 60 char counter |
| Meta Description | Textarea | SEO. 160 char counter |
| Is Featured | Checkbox | Pins to homepage articles strip |
| Status | Radio | Draft · Publish Now · Schedule |
| Scheduled At | DateTime picker | Shown only when status = Schedule |

**Editor Behaviour:**
- Auto-save every 30 seconds → writes to `gv_articles` with status `"draft"`, shows "Draft saved" indicator
- "Preview" button → opens `article.html?slug={slug}&preview=true` in new tab
- "Save Draft" button
- "Publish" button → sets status to `"published"`, adds to activity log

---

### ADMIN PAGE A3 — Custom Game Manager  (`admin/games.html`)

**Roles:** Super Admin, Editor

#### Games Table
- Columns: Cover (thumbnail), Name, Platforms, Status, Feature Flags, Actions
- Filter: All / Draft / Live / Archived
- Actions: Edit · Duplicate · Archive · Delete

#### Game Upload Form Fields

**Basic Info**
| Field | Type | Required |
|---|---|---|
| Game Title | Text | ✅ |
| Slug | Text (auto-generated, editable) | ✅ |
| Short Description | Textarea (2 lines) | ✅ |
| Full Description | Rich text | ✅ |
| Release Date | Date picker | ✅ |
| Developer | Text | Optional |
| Publisher | Text | Optional |

**Media**
| Field | Type | Notes |
|---|---|---|
| Cover Image | File upload | Required. Stored as base64 |
| Background Image | File upload | For hero/detail header |
| Screenshots | Multi-file upload | Up to 8. Drag to reorder. |
| Trailer URL | Text (URL) | YouTube embed |

**Classification**
| Field | Type | Notes |
|---|---|---|
| Genres | Multi-checkbox | Matches RAWG genre slugs |
| Platforms | Multi-checkbox | PC, PS5, Xbox Series X, Switch, Mobile |
| ESRB Rating | Select | E / E10+ / T / M / AO / RP |
| Metacritic Score | Number 0–100 | Optional manual score |
| Tags | Tag input | Custom tags |

**Links & Purchasing**
| Field | Type |
|---|---|
| Official Website | URL |
| Where to Buy | Repeatable rows: Store Name + URL |

**System Requirements (PC)**
| Field | Min | Recommended |
|---|---|---|
| OS | Text | Text |
| Processor | Text | Text |
| Memory | Text | Text |
| Graphics | Text | Text |
| DirectX | Text | Text |
| Storage | Text | Text |

**Feature Flags**
| Toggle | Effect |
|---|---|
| Show in Hero Banner | Game appears as hero on homepage |
| Show in Upcoming Row | Game appears in "Coming Soon" row |
| GOTY Nominee | Game appears on GOTY voting page |
| Featured in Browse | Pinned to top of browse results |

**Status**
- Draft → not visible on public site
- Live → visible everywhere
- Archived → hidden from public, preserved in admin

---

### ADMIN PAGE A4 — Banner Manager  (`admin/banners.html`)

**Roles:** Super Admin, Editor

#### Active Banners List
- Cards showing current banners in slot order
- Drag-handle to reorder
- On/Off toggle per banner
- Edit / Delete actions

#### Banner Upload Form Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Title | Text | ✅ | Overlay headline |
| Desktop Image | File upload | ✅ | Recommended 1920×600px |
| Mobile Image | File upload | Optional | Recommended 768×400px |
| Link URL | Text | ✅ | Internal path or external URL |
| CTA Button Text | Text | Optional | e.g. "Explore Now" |
| Badge Text | Text | Optional | e.g. "New Release", "GOTY 2025" |
| Start Date | Date picker | Optional | Auto-show from this date |
| End Date | Date picker | Optional | Auto-hide after this date |
| Slot Position | Select | ✅ | 1 = Main Hero, 2 = Secondary, 3 = Sidebar |
| Background Color | Color picker | Optional | Fallback if image fails |
| Is Active | Toggle | ✅ | Off = stored but not shown |

- "Preview" button → shows banner rendered in a modal at desktop and mobile widths

---

### ADMIN PAGE A5 — Review Moderation  (`admin/reviews.html`)

**Roles:** Super Admin, Editor, Moderator

#### Queue Table
- Columns: Game, Rating, Review Text (truncated), Submitted, Status, Actions
- Filter tabs: Pending / Approved / All
- Filter by: Game (search), Star rating
- Sort by: Newest / Oldest

#### Per Review Actions
- **Approve** → sets `status: "approved"`, review goes live on game page
- **Reject** → deletes review from `gv_reviews`
- **Edit** → inline text editing before approving
- **Pin** → sets `is_featured: true`, review shows first on game page
- **Bulk Approve** → select multiple → approve all in one click

---

### ADMIN PAGE A6 — Media Library  (`admin/media.html`)

**Roles:** Super Admin, Editor

- Drag-drop upload zone (or click to browse) — JPG, PNG, WEBP, GIF accepted
- All uploaded files rendered as thumbnail grid
- Each thumbnail: filename label, file size, upload date
- Hover: shows "Copy Key" and "Delete" buttons

#### Filter & Search
- Search by filename
- Filter by type: Banner / Game Cover / Article Image / Screenshot / Other

#### Image Detail Panel (click any image)
- Full-size preview
- Dimensions (W × H px)
- File size in KB
- Upload date
- "Used In" list — which articles/games/banners reference this image
- Rename field
- Delete button (with warning if used elsewhere)

#### Storage Usage Bar
- Shows `localStorage` usage as a progress bar
- Warning at 4MB, hard limit notice at 5MB
- "Bulk Delete Unused" button removes all images with empty `used_in[]`

---

### ADMIN PAGE A7 — GOTY Manager  (`admin/goty.html`)

**Roles:** Super Admin only

- Nominee list with drag-to-reorder handles
- "+ Add Nominee" → RAWG search picker or select from `gv_custom_games`
- Remove nominee button (confirmation required)
- Live vote count bar chart — updates on page load
- "Reset All Votes" button (double-confirmation modal)
- Voting status toggle: Enable Voting / Disable Voting → saves to `gv_settings.goty_voting_open`
- Category manager: add/rename/delete award categories
- "Announce Winner" toggle → sets `gv_goty_votes.winner_announced = true` + winner game ID
- Export Results: downloads vote data as `goty_results.json`

---

### ADMIN PAGE A8 — Navigation Manager  (`admin/navigation.html`)

**Roles:** Super Admin only

- Navbar links list — drag to reorder
- Per link: Label, URL, Visible toggle
- "+ Add Custom Link" → Label + URL + "Open in new tab" checkbox
- Announcement Bar section:
  - Enable/disable toggle
  - Rich text content (with link support)
  - Background color picker
  - Start/end date optional
- Footer Columns: edit link group labels and individual link URLs

---

### ADMIN PAGE A9 — Site Settings  (`admin/settings.html`)

**Roles:** Super Admin only

#### General Settings
| Setting | Type |
|---|---|
| Site Name | Text (replaces "GameVault" across all pages) |
| Site Tagline | Text |
| Favicon | File upload (ICO or PNG) |
| Default OG Image | File upload (for social sharing) |
| RAWG API Key | Text (password-masked, reveal button) |
| Items Per Page | Select: 10 / 20 / 40 |
| GOTY Year | Number (which year GOTY page shows) |
| Voting Close Date | Date picker |

#### Feature Toggles
| Toggle | Effect |
|---|---|
| Reviews On/Off | Disables public review submission globally |
| GOTY Page On/Off | Hides /goty.html from public |
| Wishlist On/Off | Hides wishlist feature |
| Articles On/Off | Hides articles pages |
| Default Theme | Dark / Light for first-time visitors |
| Maintenance Mode | Shows maintenance banner on all public pages |

#### Data Management
| Action | Behaviour |
|---|---|
| Export All Data | Downloads full localStorage as `gamevault_backup.json` |
| Import Data | Reads JSON file → overwrites localStorage |
| Clear All Reviews | Wipes `gv_reviews` (double-confirm) |
| Clear All Votes | Wipes `gv_goty_votes` (double-confirm) |
| Reset to Defaults | Clears all `gv_*` keys (triple-confirm) |

---

### ADMIN PAGE A10 — Activity Log  (`admin/log.html`)

**Roles:** Super Admin only

- Full history of every admin action written to `gv_activity_log`
- Columns: Timestamp, Action Type, Content Type, Content Title, Admin Role
- Filter by: Action Type (Create/Edit/Delete/Publish/Login), Content Type
- Search by keyword
- Sort: Newest first (default)
- "Clear Log" button (confirmation required)
- "Export Log" → downloads as `activity_log.txt`

---

## 5. RAWG API REFERENCE

**Base URL:** `https://api.rawg.io/api`
**Auth:** Append `?key=YOUR_FREE_KEY` to every request
**Get your key:** https://rawg.io/apidocs (free, instant)

### Endpoints Used

| Page | Method | Endpoint | Key Params |
|---|---|---|---|
| Home hero | GET | `/games` | `ordering=-rating&page_size=1` |
| Trending row | GET | `/games` | `ordering=-rating&page_size=12` |
| New releases | GET | `/games` | `dates={-30d},{today}&ordering=-released` |
| Upcoming | GET | `/games` | `dates={today},{+6m}&ordering=released` |
| Top rated | GET | `/games` | `metacritic=90,100&ordering=-metacritic` |
| Browse/search | GET | `/games` | `search=`, `genres=`, `platforms=`, `ordering=` |
| GOTY nominees | GET | `/games` | `dates={year}-01-01,{year}-12-31&ordering=-metacritic&page_size=10` |
| Genre rows | GET | `/games` | `genres={id}&ordering=-rating&page_size=12` |
| Game detail | GET | `/games/{id}` | — |
| Screenshots | GET | `/games/{id}/screenshots` | — |
| DLC/Additions | GET | `/games/{id}/additions` | — |
| Same series | GET | `/games/{id}/game-series` | — |
| Reddit posts | GET | `/games/{id}/reddit` | — |
| Genres list | GET | `/genres` | — |
| Platforms list | GET | `/platforms` | — |

### Key Query Parameters

| Param | Values | Notes |
|---|---|---|
| `ordering` | `-rating`, `-released`, `-metacritic`, `name`, `-added` | Prefix `-` = descending |
| `page_size` | 1–40 | Max 40 per request |
| `page` | Integer | For pagination |
| `dates` | `YYYY-MM-DD,YYYY-MM-DD` | Date range |
| `platforms` | `4`=PC, `187`=PS5, `186`=Xbox, `7`=Switch | Comma-separate multiple |
| `genres` | Slug or ID | From `/genres` response |
| `esrb_rating` | `1`=E, `2`=E10+, `3`=T, `4`=M, `5`=AO | |
| `metacritic` | `80,100` | Range format |
| `search` | String | URL-encoded query |
| `search_precise` | `true` / `false` | Exact match |
| `tags` | Slug or ID | From `/tags` response |

### Caching Strategy
```javascript
// Cache RAWG responses in sessionStorage for 10 minutes
// Key: "rawg_cache_" + url_hash
// Saves API calls on page revisit within same session
function cachedFetch(url) {
  const key = "rawg_cache_" + btoa(url).slice(0, 40);
  const cached = sessionStorage.getItem(key);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < 600000) return Promise.resolve(data); // 10 min
  }
  return fetch(url)
    .then(r => r.json())
    .then(data => {
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
      return data;
    });
}
```

---

## 6. DATA ARCHITECTURE & LOCALSTORAGE SCHEMA

### Admin-Managed Data (written by admin panel)

```javascript
// gv_articles — array of article objects
[{
  id: "art_1714000000000",
  title: "Best RPGs of 2025",
  slug: "best-rpgs-2025",
  body: "<p>Rich HTML content...</p>",
  category: "feature",           // news|review|feature|guide|opinion
  tags: ["rpg", "2025", "pc"],
  featured_image: "media_key",   // reference to gv_media key
  author: "admin",
  related_game_id: 3498,         // RAWG game ID or custom game ID
  meta_title: "Best RPGs 2025",
  meta_description: "Our picks for...",
  is_featured: true,
  status: "published",           // draft|published|scheduled
  scheduled_at: null,
  created_at: 1714000000000,
  updated_at: 1714000000000
}]

// gv_custom_games — array of admin-uploaded game objects
[{
  id: "game_1714000000000",
  name: "Shadow's Edge",
  slug: "shadows-edge",
  short_description: "A dark action RPG",
  description: "<p>Full description...</p>",
  cover_image: "data:image/jpeg;base64,...",
  background_image: "data:image/jpeg;base64,...",
  screenshots: ["data:image/...", "data:image/..."],
  trailer_url: "https://youtube.com/embed/xxx",
  genres: ["action", "rpg"],
  platforms: ["pc", "ps5"],
  released: "2025-11-15",
  developer: "Indie Studio",
  publisher: "Self Published",
  esrb_rating: "T",
  metacritic: null,
  website: "https://example.com",
  stores: [{ name: "Steam", url: "https://store.steampowered.com/..." }],
  requirements_min: { os: "Windows 10", processor: "Intel i5", memory: "8 GB RAM", graphics: "GTX 1060", storage: "20 GB" },
  requirements_rec: { os: "Windows 11", processor: "Intel i7", memory: "16 GB RAM", graphics: "RTX 3070", storage: "20 GB" },
  tags: ["indie", "dark fantasy"],
  feature_flags: { hero: false, upcoming_row: true, goty_nominee: false, featured_browse: false },
  status: "live",                // draft|live|archived
  created_at: 1714000000000
}]

// gv_banners — array of banner objects
[{
  id: "ban_1714000000000",
  title: "Summer Game Fest 2025",
  image_desktop: "data:image/jpeg;base64,...",
  image_mobile: "data:image/jpeg;base64,...",
  link_url: "/upcoming.html",
  cta_text: "See Upcoming Games",
  badge_text: "Live Now",
  bg_color: "#0f0f0f",
  start_date: "2025-06-01",
  end_date: "2025-06-30",
  slot: 1,                       // 1=main hero, 2=secondary, 3=sidebar
  is_active: true,
  created_at: 1714000000000
}]

// gv_reviews — reviews keyed by game ID
{
  "3498": [{
    id: "rev_1714000000000",
    rating: 5,
    text: "Absolutely incredible game...",
    status: "approved",          // pending|approved
    is_featured: false,
    created_at: 1714000000000
  }]
}

// gv_media — uploaded image registry
[{
  id: "media_1714000000000",
  label: "goty-banner-2025.jpg",
  type: "banner",                // banner|cover|article|screenshot|other
  data: "data:image/jpeg;base64,...",
  width: 1920,
  height: 600,
  size_kb: 284,
  used_in: ["ban_1714000000000"],
  uploaded_at: 1714000000000
}]

// gv_goty_config — GOTY page configuration
{
  year: 2025,
  voting_open: true,
  winner_announced: false,
  winner_game_id: null,
  nominees: [3498, 452638, "game_1714000000000"],
  categories: ["goty", "best_story", "best_visuals", "best_multiplayer"],
  voting_close_date: "2025-12-31"
}

// gv_goty_votes — vote tallies (aggregate only, not per-user)
{
  goty:           { "3498": 142, "452638": 89 },
  best_story:     { "3498": 98,  "452638": 110 },
  best_visuals:   { "3498": 201, "452638": 67 },
  best_multiplayer: { "452638": 187, "3498": 44 }
}

// gv_settings — site configuration
{
  site_name: "GameVault",
  site_tagline: "Discover Your Next Game",
  rawg_api_key: "your_key_here",
  items_per_page: 20,
  default_theme: "dark",
  features: {
    reviews: true,
    goty: true,
    wishlist: true,
    articles: true,
    maintenance_mode: false
  },
  announcement: {
    active: false,
    text: "",
    bg_color: "#1D4ED8"
  }
}

// gv_navigation — navbar and footer config
{
  navbar: [
    { label: "Home",     url: "/",             visible: true },
    { label: "Browse",   url: "/browse.html",  visible: true },
    { label: "Upcoming", url: "/upcoming.html",visible: true },
    { label: "GOTY",     url: "/goty.html",    visible: true },
    { label: "Genres",   url: "/genres.html",  visible: true },
    { label: "Articles", url: "/articles.html",visible: true }
  ],
  footer_links: [
    { group: "Explore", links: [{ label: "Browse", url: "/browse.html" }] }
  ]
}

// gv_activity_log — admin action history
[{
  action: "publish",             // create|edit|delete|publish|login|settings
  content_type: "article",       // article|game|banner|review|setting|goty
  content_title: "Best RPGs of 2025",
  admin_role: "superadmin",
  timestamp: 1714000000000
}]
```

### User Data (written by public site visitors)

```javascript
gv_wishlist          // string[] — array of game IDs (RAWG int or custom "game_xxx" string)
gv_wishlist_status   // { [game_id]: "want"|"playing"|"completed"|"dropped" }
gv_watchlist         // string[] — upcoming game IDs user wants notification for
gv_user_votes        // { goty: "3498", best_story: "452638", ... } — one per category
gv_theme             // "dark" | "light"
```

### Session Data (sessionStorage — clears on tab close)

```javascript
gv_admin_session     // { role: "superadmin"|"editor"|"moderator", logged_in_at: timestamp }
rawg_cache_{hash}    // { data: {}, ts: timestamp } — 10-minute RAWG response cache
```

---

## 7. MASTER BUILD PROMPT

> Copy everything below this line and paste directly into Cursor, Bolt.new,
> Lovable, Windsurf, or any agentic coding tool.

---

```
Build a complete multi-page web application called GameVault — a game discovery
platform similar to IGN and Steam. The project has two parts: a public-facing
website and a password-protected admin dashboard.

═══════════════════════════════════════════════
ABSOLUTE TECHNICAL RULES — NEVER BREAK THESE
═══════════════════════════════════════════════

1. Pure HTML5, CSS3, and Vanilla JavaScript ONLY.
   No React. No Vue. No Angular. No build tools. No npm. No bundlers.

2. Zero backend. Zero server. Zero database. Zero external APIs except RAWG.
   All user and admin data lives in localStorage or sessionStorage.

3. All pages are .html files. All styles in .css files. All logic in .js files.
   No inline styles. No inline scripts (except one-line event handlers are OK).

4. Every page must be fully responsive: desktop (1280px+), tablet (768px), mobile (375px).

5. The entire project must deploy as static files on Vercel with zero configuration.

6. All images uploaded by admin are stored as base64 strings in localStorage under gv_media[].

7. RAWG API key goes in js/config.js. Use this free key: REPLACE_WITH_YOUR_RAWG_KEY
   All RAWG requests must go through the cachedFetch() function that caches
   responses in sessionStorage for 10 minutes to avoid rate limiting.

8. Every admin page must check sessionStorage for gv_admin_session on load.
   If missing or invalid, immediately redirect to /admin/index.html.

9. Code must be clean, commented, and production-ready.
   Every JS function must have a one-line comment explaining its purpose.

═══════════════════════════════════════════════
DESIGN SYSTEM
═══════════════════════════════════════════════

All CSS variables go in css/variables.css. Use these exact values:

  /* Colors */
  --color-bg:          #0F0F0F;      /* Page background */
  --color-surface:     #1A1A1A;      /* Cards, panels */
  --color-surface-2:   #242424;      /* Hover states, inputs */
  --color-border:      #2E2E2E;      /* All borders */
  --color-text-1:      #FFFFFF;      /* Primary text */
  --color-text-2:      #AAAAAA;      /* Secondary text */
  --color-text-3:      #666666;      /* Muted text */
  --color-accent:      #FF0000;      /* Brand red (YouTube-inspired) */
  --color-accent-hover:#CC0000;      /* Darker red for hover */
  --color-success:     #22C55E;      /* Green for high ratings */
  --color-warning:     #EAB308;      /* Yellow for mid ratings */
  --color-danger:      #EF4444;      /* Red for low ratings */
  --color-blue:        #3B82F6;      /* Info, links */

  /* Typography */
  --font-display:  'Rajdhani', sans-serif;   /* Load from Google Fonts. Headings only */
  --font-body:     'Inter', sans-serif;       /* Load from Google Fonts. All body text */
  --font-mono:     'JetBrains Mono', monospace; /* Code, system requirements */

  /* Spacing scale */
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px; --space-2xl: 48px; --space-3xl: 64px;

  /* Radii */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;

  /* Transitions */
  --transition: 0.2s ease;
  --transition-slow: 0.4s ease;

Light mode: add a .light-mode class to <body> that overrides:
  --color-bg: #F5F5F5; --color-surface: #FFFFFF; --color-surface-2: #F0F0F0;
  --color-border: #E0E0E0; --color-text-1: #0F0F0F; --color-text-2: #555555;

Global component styles in css/global.css:
- .game-card: surface background, border, radius-lg, overflow hidden, cursor pointer,
  transition transform + box-shadow. On hover: translateY(-4px), shadow 0 8px 24px rgba(0,0,0,0.4)
- .rating-badge: small pill, font-weight 600, font-size 12px.
  ≥80 = success color, 60–79 = warning color, <60 = danger color
- .btn-primary: accent background, white text, radius-md, padding 10px 20px, no border,
  cursor pointer. Hover: accent-hover
- .btn-ghost: transparent bg, border 1px solid border-color, text-2 color.
  Hover: surface-2 background
- .tag-pill: surface-2 background, text-2 color, radius-sm, padding 4px 10px, font-size 12px
- .skeleton: surface-2 background, border-radius inherit, animate pulse (opacity 0.5 to 1, 1.5s infinite)
- Toast notification: fixed bottom-right, surface background, border, radius-md, padding 12px 16px,
  slides in from right, auto-dismisses after 3 seconds

═══════════════════════════════════════════════
SHARED JS MODULES
═══════════════════════════════════════════════

Build these utility modules first. All other JS files import from them.

js/config.js — exports:
  RAWG_KEY, RAWG_BASE, PLATFORM_IDS{}, GENRE_IDS{}, ADMIN_ROLES{},
  LS_KEYS{} (all localStorage key constants)

js/api.js — exports:
  cachedFetch(url)          — fetch with 10-min sessionStorage cache
  getGames(params)          — GET /games with params object
  getGameById(id)           — GET /games/{id}
  getScreenshots(id)        — GET /games/{id}/screenshots
  getAdditions(id)          — GET /games/{id}/additions
  getSeries(id)             — GET /games/{id}/game-series
  getGenres()               — GET /genres
  searchGames(query)        — GET /games?search={query}&page_size=5

js/storage.js — exports:
  getArticles()             — read gv_articles, filter published only for public
  saveArticle(article)      — write to gv_articles array
  deleteArticle(id)         — remove from gv_articles by id
  getCustomGames()          — read gv_custom_games where status=live
  saveCustomGame(game)      — write to gv_custom_games
  getBanners(slot)          — read gv_banners, filter by slot + active + date range
  getReviews(gameId)        — read gv_reviews[gameId] where status=approved
  saveReview(gameId, review)— write pending review to gv_reviews[gameId]
  getWishlist()             — read gv_wishlist array
  toggleWishlist(gameId)    — add or remove from gv_wishlist, return new state
  getSettings()             — read gv_settings with defaults fallback
  logAction(action)         — append to gv_activity_log

js/auth.js — exports:
  checkAdminAuth()          — reads sessionStorage, redirects if missing
  getAdminRole()            — returns current role string
  login(username, password) — validates, writes session, returns role or null
  logout()                  — clears session, redirects to /admin/index.html
  canAccess(role, page)     — returns bool based on access matrix

js/utils.js — exports:
  slugify(text)             — converts string to url-safe slug
  formatDate(timestamp)     — returns "Apr 14, 2025"
  relativeTime(timestamp)   — returns "3 hours ago"
  debounce(fn, delay)       — returns debounced function
  truncate(text, len)       — truncates with ellipsis
  estimateReadTime(html)    — returns "5 min read"
  showToast(message, type)  — injects and animates a toast notification

js/components.js — exports:
  buildGameCard(game)       — returns HTML string for a game card
  buildArticleCard(article) — returns HTML string for an article card
  buildRatingBadge(score)   — returns HTML string for colored rating badge
  buildPlatformIcons(platforms) — returns HTML string of platform SVG icons
  buildSkeletonCard()       — returns HTML string of loading skeleton card
  buildCountdown(dateStr)   — returns HTML string + starts live countdown interval

═══════════════════════════════════════════════
GLOBAL NAVBAR (injected on every public page)
═══════════════════════════════════════════════

Build as a JS function injectNavbar() in components.js, called at top of each page.
Reads gv_navigation.navbar from localStorage and gv_settings.site_name.

Structure:
  [Logo + Site Name]   [Nav Links]   [Search Icon]  [Wishlist Icon + Count]  [Theme Toggle]

- Logo: SVG controller icon + site name text
- Nav links: render from gv_navigation.navbar where visible=true
- Active link: highlight based on current window.location.pathname
- Search icon: on click, expands an inline search bar that slides down below navbar
- Wishlist icon: shows badge with gv_wishlist.length count
- Theme toggle: sun/moon SVG icon, toggles .light-mode on <body>, saves to gv_theme
- Mobile: hamburger icon, clicking reveals a full-height slide-in drawer menu
- Announcement bar: if gv_settings.announcement.active=true, show strip above navbar
  with configured text and background color

═══════════════════════════════════════════════
PUBLIC PAGES — BUILD EACH IN ORDER
═══════════════════════════════════════════════

--- index.html (Home) ---

On DOMContentLoaded:
1. injectNavbar()
2. Load hero: getGames({ordering:"-rating",page_size:3}) → rotate through top 3 as hero
   - Full screen div with background-image, dark gradient overlay
   - Title, rating badge, genres, platforms, description (100 chars), two CTA buttons
   - Auto-rotate every 6000ms with CSS opacity fade transition
   - Small dot indicators for which slide is active, click to jump
3. Build 7 horizontal scroll rows in this order:
   - Trending Now, New Releases, Coming Soon, Top Rated All Time, Action, RPG, PC Exclusives
   - Each row: section title + "See All →" link + horizontal scroll container
   - Populate with 12 skeleton cards immediately, then replace with real cards from API
   - Rows load in parallel using Promise.all for speed
4. Merge gv_custom_games (status=live, feature_flags.hero=false) into "Featured" row
5. Inject articles strip: read gv_articles (status=published, limit 3), show as horizontal cards
6. injectFooter()

--- game.html ---

On DOMContentLoaded:
1. Read ?id= from URL. If missing, redirect to index.html
2. Check gv_custom_games for matching id first
3. If not found, call getGameById(id) from RAWG
4. Render all sections: hero, trailer, gallery, requirements, rating breakdown, reviews, sidebar
5. Gallery: call getScreenshots(id) → build thumbnail strip
   Lightbox: inject fixed modal with backdrop, image, prev/next buttons, counter, close button
   Keyboard listeners: ArrowLeft, ArrowRight, Escape
6. Reviews form: on submit, validate not empty → saveReview(id, {rating, text, status:"pending"})
   → show toast "Review submitted for moderation"
7. Wishlist button: read current state from gv_wishlist → toggleWishlist(id) on click
   → toggle heart icon fill + "Added"/"Add to Wishlist" text
8. "Same Series" and "DLC" rows: call getSeries(id) and getAdditions(id) in parallel
9. Load getAdditions and getSeries only after main content renders (lazy)

--- browse.html ---

On DOMContentLoaded:
1. Read URL params: ?search=, ?genre=, ?platform=, ?tag=, ?ordering=
2. Populate filter sidebar from params (pre-check boxes that match URL)
3. Call getGames() with current filter state → render results grid
4. On any filter change: debounce 300ms → rebuild query → re-fetch → re-render grid
5. Search input: debounce 300ms → update search param → re-fetch
6. Infinite scroll: IntersectionObserver on a sentinel div at bottom of results
   → when visible, fetch next page and append cards
7. View toggle: grid/list stored in localStorage gv_browse_view
8. Merge gv_custom_games into results if "Include Custom Games" is checked

--- upcoming.html ---

On DOMContentLoaded:
1. Fetch upcoming games. Build today and +6months date strings
2. getGames({dates: today+","+futureDate, ordering:"released", page_size:40})
3. Merge gv_custom_games where released > today and status = live
4. Group all games by month into an object: { "April 2025": [...], "May 2025": [...] }
5. Render each month as a section with month heading + game cards grid
6. Each card: call buildCountdown(game.released) → starts setInterval updating every second
7. "Notify Me" button: toggleWishlist equivalent for gv_watchlist
8. Platform filter tabs (All/PC/Console/Mobile): filter already-loaded data, no re-fetch

--- goty.html ---

On DOMContentLoaded:
1. Read gv_goty_config from localStorage, use defaults if empty
2. Fetch nominees: map gv_goty_config.nominees → getGameById for RAWG IDs,
   getCustomGame for "game_xxx" IDs → run in parallel
3. If gv_goty_config.winner_announced = true, show winner banner with confetti
4. Render nominee cards grid (2 cols desktop, 1 col mobile)
5. Render category tabs: one tab per gv_goty_config.categories
6. On vote button click:
   - Check gv_user_votes[category] — if already voted, show "Already voted" toast
   - If not voted: increment gv_goty_votes[category][gameId]++
   - Save gv_user_votes[category] = gameId
   - Animate: card border pulses, vote count increments, "Your Vote ✓" badge appears
7. Live leaderboard: horizontal bar chart built in plain CSS (no Canvas, no Chart.js)
   - Each nominee gets a bar whose width% = (votes / totalVotes) * 100
   - Animates width on load and on each new vote

--- genres.html ---

On DOMContentLoaded:
1. getGenres() → render responsive grid of genre cards
2. Each card: background-image from genre.image_background, genre name, games_count
3. Click → navigate to browse.html?genre={genre.id}

--- wishlist.html ---

On DOMContentLoaded:
1. Read gv_wishlist array. If empty, show empty state with CTA
2. For each game ID: check gv_custom_games first, then batch RAWG calls
3. Render game cards with status dropdowns and remove buttons
4. Stats bar: calculate totals from gv_wishlist_status values
5. Sort/filter controls operate on already-loaded data (no re-fetch)
6. Remove: remove from gv_wishlist → fade card out → show undo toast for 5s
   Undo restores gv_wishlist entry

--- articles.html + article.html ---

articles.html:
1. Read gv_articles (status=published) from localStorage
2. Render filter tabs (category), search bar, paginated cards grid (9 per page)

article.html:
1. Read ?slug= from URL → find matching article in gv_articles
2. Render full article: featured image, category, title, author, date, body HTML
3. If related_game_id exists: render game card in sidebar (fetch from RAWG or custom)
4. "More Articles" row: same category, limit 3

═══════════════════════════════════════════════
ADMIN DASHBOARD — BUILD EACH IN ORDER
═══════════════════════════════════════════════

All admin pages share admin/css/admin.css and admin/js/admin-common.js.

admin-common.js contains:
- injectAdminNav() — builds the admin sidebar navigation
- checkAdminAuth() — runs on every page load, redirects if no session
- logAction(action, contentType, contentTitle) — writes to gv_activity_log
- showAdminToast(msg, type) — admin-specific toast
- buildAdminTable(headers, rows, actions) — reusable table builder

Admin sidebar navigation (injected by injectAdminNav()):
  Logo → Dashboard → Articles → Games → Banners → Reviews → Media → GOTY
  → Navigation → Settings → Log → [Logout button]
  Highlight current page. Collapse to icon-only on narrow screens.
  Show role badge at bottom (Super Admin / Editor / Moderator).

--- admin/index.html (Login) ---

- Only admin page without auth check at top
- Username + password form, show/hide password toggle
- On submit: login(username, password) from auth.js
  Success: redirect based on role (superadmin→dashboard, editor→articles, moderator→reviews)
  Fail: show inline error, increment attempt counter
  5 fails: disable form, show 60-second countdown timer
- "Remember me": if checked, persist session to localStorage instead of sessionStorage

--- admin/dashboard.html ---

- 6 stats cards row (read counts from localStorage)
- 4 quick action buttons
- Recent activity feed (last 10 from gv_activity_log)
- Recent articles table (last 5)
- Pending reviews table (last 5)

--- admin/articles.html ---

Two views on same page:
VIEW 1 — Table (default, ?action not set):
- Sortable table with search + status filter + pagination
- Edit/Preview/Delete actions per row
- Bulk checkbox selection + bulk action dropdown

VIEW 2 — Editor (?action=new or ?id=xxx):
- All form fields as documented in Section 4
- Rich text: build a minimal toolbar (B, I, H2, H3, Link, Blockquote, Code) using
  document.execCommand() for simplicity — no external library
- Featured image upload: FileReader API → base64 → preview + save to gv_media
- Auto-save: setInterval every 30000ms → saveArticle({...fields, status:"draft"})
  → update "Last saved" indicator text
- Schedule datetime picker: shown/hidden based on status radio selection
- RAWG game search: debounced input → searchGames(query) → dropdown of 5 results
  → click to select and store related_game_id

--- admin/games.html ---

Two views:
VIEW 1 — Table: filter, sort, paginate gv_custom_games
VIEW 2 — Form (?action=new or ?id=xxx):
- All fields from Section 4, including multi-file screenshots upload
- Screenshots: allow up to 8 uploads, show thumbnails, drag-to-reorder (HTML5 drag API)
- System requirements: 2-column grid (Minimum / Recommended), 5 rows each
- Where to Buy: "Add Store" button appends a new row with Name + URL fields + Remove button
- Feature flags: 4 toggles with clear labels and descriptions
- Live slug preview: updates as user types in title field

--- admin/banners.html ---

Two views:
VIEW 1 — Active list: cards showing each banner with on/off toggle, reorder handles, edit/delete
  Drag-to-reorder using HTML5 Drag API → saves new order to gv_banners
VIEW 2 — Form: all banner fields from Section 4
  Desktop + mobile image upload with separate previews
  Date pickers for start/end
  "Preview Banner" button: opens a modal showing the banner rendered at 1200px width

--- admin/reviews.html ---

Single view:
- Tab strip: Pending (count badge) / Approved / All
- Table: Game thumbnail, title, star rating display, review text (first 80 chars), date
- Per row: Approve, Reject, Edit (inline textarea toggle), Pin buttons
- Bulk select + Bulk Approve
- Filters: game search input, star rating filter (1–5 or All)

--- admin/media.html ---

- Large drop zone at top (dashed border, "Drop images here or click to upload")
- File input accepts: image/jpeg, image/png, image/webp, image/gif
- On upload: FileReader → base64 → save to gv_media → render new thumbnail in grid
- Thumbnail grid: 6 cols desktop, 4 tablet, 3 mobile
- Storage bar: calculate total size of all base64 strings in gv_media
  Warning styling when >4MB, error styling when >4.8MB
- Click any thumbnail: opens detail panel (slide in from right)
  Shows: full preview, metadata, used_in list, rename field, delete button
- "Copy Key" button on each thumbnail: copies media ID to clipboard
- "Bulk Delete Unused" button: finds all gv_media where used_in is empty → confirms → deletes

--- admin/goty.html ---

- Current year nominees list (drag to reorder)
- "+ Add Nominee" opens a search modal: type to search RAWG or select from gv_custom_games
- Bar chart leaderboard: plain CSS bars (no library), reads from gv_goty_votes
- Category tabs: one per category in gv_goty_config.categories
- Voting toggle, Reset Votes button (double confirm), Announce Winner toggle
- Category manager: "+ Add Category" row appends a new category, delete icon removes
- Export button: creates and downloads goty_results.json

--- admin/navigation.html ---

- Navbar links: drag-to-reorder list, visibility toggle per item, edit label/URL
- "+ Add Link" appends new row
- Announcement bar: enable/disable toggle, textarea for text, color picker, date fields
- Changes auto-save to gv_navigation on every interaction (no save button needed)

--- admin/settings.html ---

Tabbed layout: General / Features / Data

General tab: all general settings fields
Features tab: all feature toggle switches
Data tab: export/import/clear buttons
  Export: JSON.stringify(relevant localStorage) → Blob → download link
  Import: FileReader → JSON.parse → confirm modal → overwrite localStorage keys
  Clear/Reset actions each require a confirmation modal with typed confirmation text

--- admin/log.html ---

- Full table of gv_activity_log entries, newest first
- Filter by action type and content type dropdowns
- Search input
- "Clear Log" button with confirmation
- "Export Log" button: generates .txt file from log entries

═══════════════════════════════════════════════
BEHAVIOUR & UX RULES
═══════════════════════════════════════════════

Loading States:
- Show skeleton cards immediately on page load before API responds
- Skeleton cards match the dimensions of real cards exactly
- Fade skeleton out and real content in with a 0.3s opacity transition

Error Handling:
- If RAWG API fails: show "Failed to load games. Check your connection." with retry button
- If game not found by ID: redirect to browse.html with "Game not found" toast
- If localStorage is full: show persistent banner "Storage full. Clear media to continue."
- All fetch calls wrapped in try/catch

Accessibility:
- All interactive elements are keyboard-focusable
- Wishlist and vote buttons have aria-label attributes
- Images have descriptive alt text
- Color alone never conveys meaning (always paired with icon or text)

Performance:
- Images use loading="lazy" attribute
- Row content loads in parallel with Promise.all
- sessionStorage cache prevents redundant API calls

Animations:
- Card hover: transform + box-shadow, CSS only, 0.2s ease
- Page hero fade: CSS opacity transition
- Countdown timer: updates every second with setInterval
- Vote count: CSS counter-increment animation
- Toast: slides in from right, slides out after 3s
- Skeleton pulse: CSS keyframe animation

═══════════════════════════════════════════════
FOOTER (injected on all public pages)
═══════════════════════════════════════════════

Four columns: About, Explore, Genres (top 4), Connect
Bottom strip: "Powered by RAWG API" (required attribution) + theme toggle + copyright
Reads column content from gv_navigation.footer_links

═══════════════════════════════════════════════
FINAL CHECKLIST — VERIFY BEFORE DONE
═══════════════════════════════════════════════

□ All 9 public pages exist and are linked correctly
□ All 11 admin pages exist and are linked correctly
□ Every admin page redirects to login if no session
□ RAWG API key placeholder in config.js is clearly marked
□ cachedFetch() is used for every RAWG call
□ All localStorage keys use the gv_ prefix
□ Game cards are consistent across all pages (same HTML structure)
□ Wishlist state is consistent (heart button reflects saved state on every page)
□ Admin article editor auto-saves every 30 seconds
□ Media library shows storage usage bar
□ GOTY page checks gv_user_votes before allowing a vote
□ All images have fallback to placeholder.jpg on error
□ Site name reads from gv_settings.site_name not hardcoded
□ Activity log is written for every admin create/edit/delete/publish action
□ Mobile navigation drawer works on all public pages
□ Footer includes "Powered by RAWG API" attribution link
□ Light mode works correctly on all pages
□ README.md created with setup instructions and RAWG API key setup guide
```

---

*End of GameVault Complete Documentation*
*Total: 9 public pages · 11 admin pages · 14 RAWG endpoints · 47 form fields · 10 localStorage keys*
