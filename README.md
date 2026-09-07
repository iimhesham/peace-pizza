# 🎭 GAME --- Play Night

> **Interactive mystery & party game platform for a single game
> night.**\
> Investigation stories, football guessing, secret roles, live status,
> and round-based voting --- all inside a single responsive HTML file.

[![Made with
HTML](https://img.shields.io/badge/Made%20with-HTML5-E34F26?logo=html5&logoColor=white)](#)
[![CSS](https://img.shields.io/badge/Styled%20with-CSS3-1572B6?logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/Powered%20by-JavaScript-F7DF1E?logo=javascript&logoColor=black)](#)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-0d6b50)](#)

------------------------------------------------------------------------

## ✨ Overview

**GAME** is a lightweight, browser-based party-game hub designed for a
group game night.

The experience starts with a central game hub where players can choose
between different experiences:

-   🕵️ **Investigation stories**
-   ⚽ **Football guessing game**
-   🎲 **Secret character assignment**
-   🗳️ **Round-based voting**
-   📱 **Mobile-friendly player screens**
-   🌐 **Optional live multiplayer status through Firebase Realtime
    Database**

The project is intentionally simple to deploy: the main experience lives
in a single `index.html` file.

------------------------------------------------------------------------

## 🎮 Available Games

### 01 --- قضية آل سووب

**Missouri • 1909**

A previous investigation case that is currently marked as **played /
closed** in the interface.

### 02 --- ملف قاتل وايت تشابل

**Whitechapel • 1888**

An investigation game built around:

-   5 characters
-   3 investigation rounds
-   Public information + private character secrets
-   Evidence revealed by the Game Master
-   Player discussion
-   Voting after each round
-   Final accusation in round 3

### ⚽ Password --- Football Edition

A fast party game using **10 hidden football-player cards**.

Players reveal a card, choose who will receive the player's name, then
describe the player without saying the name or nickname while the others
try to guess.

The game also includes a **"new shuffle"** option for a fresh set of
names.

------------------------------------------------------------------------

## 🕵️ Whitechapel Investigation

### Player flow

1.  The GM creates a **4-digit session code**.
2.  Players enter the code and their names.
3.  Each player chooses a character number from **1--5**.
4.  The same session code deterministically produces the same character
    order across devices.
5.  Each player receives:
    -   Public character information
    -   A private secret
    -   A strength
    -   A weakness
6.  Players take part in three investigation rounds.
7.  The GM reveals the evidence for the current round.
8.  Players discuss the clues.
9.  Players vote for the character they suspect.
10. The GM can silently remove the most-voted player from the next vote.
11. In the third round, everyone makes a final accusation.

> **Spoiler:** The scenario's fictional solution is George Chapman
> (Severin Klosowski). This is explicitly a game scenario and does
> **not** claim that the historical Jack the Ripper case was solved.

------------------------------------------------------------------------

## 🧩 Character System

The Whitechapel scenario currently contains five playable characters:

  \#   Character                      Role
  ---- ------------------------------ ---------------------------------------
  1    Aaron Kosminski                Suspect
  2    Montague John Druitt           Suspect
  3    John Pizer --- Leather Apron   Suspect
  4    George Lusk                    Suspect
  5    George Chapman                 Mafioso / killer in the game scenario

Character numbers are shuffled using a seeded algorithm based on the
session code, allowing every device using the same code to reach the
same assignment order.

------------------------------------------------------------------------

## 🔎 Investigation Rounds

### Round 1 --- بداية التحقيق

Introduces the case and opens the circle of suspicion.

**Evidence:** a torn leather apron and a witness report.

### Round 2 --- الخيط المفقود

Adds a new clue connecting a razor purchase with the investigation.

**Evidence:** a receipt for a newly purchased razor from a nearby shop.

### Round 3 --- الحقيقة المدفونة

Provides the final clue and allows players to reinterpret the earlier
evidence.

**Evidence:** a page from Chapman's barber-shop ledger containing a
suspicious payment matching the handwriting on the earlier razor
receipt.

------------------------------------------------------------------------

## 👑 Game Master Mode

The Whitechapel game includes a dedicated **GM-only dashboard**
protected by a password screen.

The GM dashboard provides:

-   Session-code generation
-   Verification code
-   Character assignment overview
-   Current-round controls
-   Vote tally
-   Silent elimination of the most-voted player
-   Full scenario solution
-   Round-by-round evidence
-   GM instructions
-   Optional live-status configuration

**Important:** The GM screen contains the solution and private
information. Do not show it to players.

------------------------------------------------------------------------

## 🌐 Optional Live Multiplayer

The project supports optional **Firebase Realtime Database** integration
for live session status.

When enabled, the app can synchronize:

-   Active game sessions
-   Player names
-   Player alive/eliminated status
-   Current investigation round
-   Votes

The implementation communicates with Firebase through its REST endpoint
using standard browser `fetch()` calls.

### Why is it optional?

The core interface and local player state can work without requiring a
live database. Firebase is used when the group wants multiple phones to
share live game-state information.

### Session cleanup

Inactive sessions are automatically considered for cleanup after **7
days**, with cleanup throttled locally to reduce unnecessary database
requests.

> **Production note:** If this project is distributed to multiple
> groups, each group should use its own Firebase project/database to
> avoid mixing sessions and consuming the same database quota.

------------------------------------------------------------------------

## 💾 Local Storage

The app uses browser `localStorage` for lightweight device-local state,
including:

-   Saved player/session information
-   Player notes
-   Current round
-   Firebase database URL configuration
-   GM session code

Player investigation notes are explicitly stored **on the player's
device**.

------------------------------------------------------------------------

## 🔊 Interaction & UX

The interface includes small details designed for a live game-night
experience:

-   Click sounds
-   Character reveal sound
-   Toast notifications
-   Page transitions
-   Responsive layouts
-   Mobile-safe spacing
-   Reduced-motion support
-   Arabic RTL layout
-   Distinct visual themes for investigation and football modes

------------------------------------------------------------------------

## 🎨 Design

The investigation side uses a dark, cinematic palette built around:

-   Deep green
-   Emerald
-   Antique gold
-   Warm off-white text

The football game switches to a separate blue-themed visual treatment.

Typography uses Google Fonts including:

-   **Tajawal**
-   **Amiri**
-   **Playfair Display**
-   **Teko**

------------------------------------------------------------------------

## 🛠️ Tech Stack

  Technology                   Purpose
  ---------------------------- ----------------------------------
  HTML5                        Application structure
  CSS3                         Responsive UI and visual design
  Vanilla JavaScript           Game logic and interaction
  Web Audio API                UI/reveal sounds
  `localStorage`               Local player/session persistence
  Fetch API                    Firebase REST communication
  Firebase Realtime Database   Optional shared live state
  GitHub Pages                 Static deployment

No frontend framework or build system is required.

------------------------------------------------------------------------

## 📁 Project Structure

``` text
peace-pizza/
├── index.html
├── .github/
│   └── workflows/
│       └── ...
└── README.md
```

The main game logic, styling, UI, data, and interaction code currently
live inside `index.html`.

------------------------------------------------------------------------

## 🚀 Run Locally

Because the project is a static web app, you can run it with almost any
static server.

### Option 1 --- Open directly

Open:

``` text
index.html
```

in a modern browser.

### Option 2 --- Use a local server

For example:

``` bash
python -m http.server 8000
```

Then open:

``` text
http://localhost:8000
```

------------------------------------------------------------------------

## 🌍 Deployment

The project is suitable for static hosting such as GitHub Pages.

Typical deployment flow:

``` text
Edit index.html
      ↓
Commit changes
      ↓
Push to GitHub
      ↓
GitHub Pages
      ↓
Open the game on phones
```

No server-side application is required for the basic experience.

------------------------------------------------------------------------

## 🔐 Privacy & Security Notes

This project is designed for a private game-night setting, but the
following should be understood:

-   The GM password is part of the client-side application, so it should
    **not** be treated as strong security.
-   Firebase data protection depends on the Firebase Realtime Database
    rules configured by the project owner.
-   Session codes are short 4-digit codes and should be treated as
    convenience identifiers, not authentication credentials.
-   Private character information is rendered in the player's browser.
-   Player notes are kept locally through browser storage.

For a public production system, proper authentication and server-side
authorization would be recommended.

------------------------------------------------------------------------

## 🧭 Project Status

### Current

-   ✅ Responsive single-page game hub
-   ✅ Arabic RTL interface
-   ✅ Whitechapel investigation game
-   ✅ GM dashboard
-   ✅ Deterministic character distribution
-   ✅ Three investigation rounds
-   ✅ Voting system
-   ✅ Optional Firebase live status
-   ✅ Football Password game
-   ✅ Local player notes
-   ✅ Mobile-first interaction

### Potential Future Improvements

-   [ ] Add more investigation cases
-   [ ] Add a proper game/session management backend
-   [ ] Replace client-side GM password with real authentication
-   [ ] Add configurable player counts
-   [ ] Add sound/music controls
-   [ ] Add persistent game history
-   [ ] Add multilingual UI
-   [ ] Add automated deployment/versioning

------------------------------------------------------------------------

## ⚠️ Historical Disclaimer

The Whitechapel game is a **fictionalized party-game scenario inspired
by historical figures and the Jack the Ripper case**.

The code itself states that the real historical case remains unresolved
and that the game's identification of George Chapman is **only the
scenario's fictional solution**.

------------------------------------------------------------------------

## 📜 License

No license is currently specified in the project.

If you plan to publish or distribute the code publicly, add an explicit
license such as MIT, Apache-2.0, or another license appropriate to your
project.

------------------------------------------------------------------------

## 🎭 GAME

**Mystery • Strategy • Football**

Built for a better game night.
