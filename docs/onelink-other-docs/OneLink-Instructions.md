# OneLink - Instructional Context

This file provides the necessary context for Gemini to understand and assist with the OneLink Sovereign Vault codebase (v2.5).

## 1. Project Overview
OneLink is a **privacy-first, zero-knowledge peer-to-peer (P2P) sharing platform**. It allows creators to build a digital presence (link-in-bio) with end-to-end encryption (E2EE) and selective content sharing.

### Core Architectural Principles
- **Trust No One (TNO):** All encryption/decryption happens client-side. The backend (Firebase) never sees plaintext data.
- **Serverless Static-First:** Built as a Next.js Static Export (`output: 'export'`) deployed on Firebase Hosting.
- **Client-Side Encryption:** Uses Web Crypto API (RSA-OAEP 2048 for keys, AES-GCM 256 for content).
- **Zero-Knowledge Backend:** Firebase serves as a storage/retrieval engine for encrypted blobs.

## 2. Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion (Glassmorphism & Bento transitions)
- **Security:** Web Crypto API
- **State Management:** React Hooks + Firebase `onSnapshot` for real-time data.

## 3. Directory Structure
- `/app`: Application routes.
    - `/auth`: Login, registration, and success pages.
    - `/dashboard`: Main authenticated area (Chat, Friends, Links, Profile).
    - `/u/profile`: Static catch-all for public profiles.
- `/components`: Atomic UI components.
    - `/dashboard`: Layout shell and navigation.
    - `/friends`: Chat, conversation list, and friend management.
    - `/links`: Bento grid link block management.
    - `/public`: Public profile rendering.
    - `/ui`: Reusable Shadcn/UI components.
- `/hooks`: Custom hooks.
    - `use-chat.ts`: Real-time E2EE chat listeners and operations.
    - `use-crypto.ts`: Core encryption primitives and lazy decryption.
    - `use-rsa-keycheck.ts`: Automated RSA key generation and sync.
- `/lib`: Utility libraries.
    - `crypto.ts`: Comprehensive E2EE library implementation.
    - `/firebase`: Client-side initialization.
- `/scripts`: SQL scripts (legacy/reference) and Firestore setup.

## 4. Key Workflows & Conventions
### P2P Key Handshake
1. Receiver requests access to an asset and provides their Public Key.
2. Owner re-encrypts the asset's AES key using the Receiver's Public Key.
3. Receiver decrypts the AES key using their Private Key to access the asset.

### Sovereign Chat v2.0
- **E2EE:** Messages are encrypted with a conversation-specific AES key.
- **Soft Delete (TTL):** Messages have an `expiresAt` field.
    - **Client:** `useChat` filters out messages where `expiresAt < now`.
    - **Server:** Firestore TTL policy handles physical deletion.
- **Typing Indicators:** Managed via a `presence` sub-collection with 5-second TTL.

### RSA Key Management
- Private keys are stored in `localStorage` (`onelink_private_key_{uid}`).
- Keys are backed up to Firestore (Vault) only if encrypted with a user passphrase (PBKDF2).
- `useRSAKeyCheck` ensures keys are generated or restored on dashboard load.

## 5. Building and Running
```bash
# Development server
npm run dev

# Production Build (Generates /out directory)
npm run build

# Deployment (Firebase)
firebase deploy --only hosting,firestore,storage
```

## 6. Critical Security Files
- `firestore.rules`: Enforces participant validation for chats and owner validation for profiles.
- `storage.rules`: Restricts downloads to owners or valid access grant holders.
- `cors.json`: Required for P2P file uploads to Firebase Storage.

## 7. Current Project Status
- **Renamed:** Connections -> Friends.
- **Renamed:** Sidebar includes Chat as a primary view.
- **Decommissioned:** All AI features and Stripe integration.
- **Pending:** Billing-disabled environment requires "Soft Delete" logic (implemented in hooks).

---

# OneLink Application Blueprint

## Executive Summary

OneLink is a 100% zero-knowledge, privacy-first peer-to-peer sharing platform. It enables creators and professionals to build their digital presence with end-to-end encryption and selective content sharing. OneLink prioritizes absolute data ownership, user privacy, and zero-tracking through a "Trust No One" (TNO) architecture where encryption happens exclusively on the client side.

**Core Value Proposition:** A serverless, static-first link-in-bio platform where private content remains cryptographically secured from the service provider, utilizing peer-to-peer handshakes for access control.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Technical Architecture](#technical-architecture)
3. [Feature Specifications](#feature-specifications)
4. [Data Model](#data-model)
5. [Security & Encryption](#security--encryption)
6. [User Experience Flow](#user-experience-flow)
7. [Implementation Details](#implementation-details)
8. [Design System](#design-system)
9. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 1. Product Overview

### 1.1 Target Audience

- **Privacy-conscious creators:** Individuals who demand absolute control over their data.
- **Security Professionals:** Users requiring secure, E2EE channels for sharing sensitive assets.
- **Sovereign Individuals:** Those who value decentralized principles and "Trust No One" systems.

### 1.2 Key Differentiators

| Feature | OneLink | Traditional Platforms |
|---------|---------|-----------------------|
| **Encryption** | ✅ RSA-OAEP + AES-GCM (Client-side) | ❌ Server-side only / None |
| **Privacy Model** | Zero-Knowledge / TNO | ❌ Centralized Tracking |
| **Architecture** | Static Web + Firebase SDK | ❌ Server-dependent |
| **Asset Sharing** | P2P Handshake & Encrypted Vaults | ❌ Public Cloud Storage |
| **Chat** | Burn-after-reading / E2EE Group Chat | ❌ Monitored/Plaintext Chat |

### 1.3 Core Features

1. **Link Management (Bento Grid)**
   - Custom bento-style layouts.
   - Dynamic visibility: Public / Friends / Private.
   - Click tracking (Client-side privacy-first).

2. **Sovereign Chat v2.0**
   - Direct and Group messaging.
   - Real-time "Presence" (Typing indicators).
   - "Burn After Reading" (TTL auto-deletion).
   - Zero-Knowledge message history.

3. **P2P Asset Sharing**
   - Client-side file encryption before upload.
   - RSA public key handshakes for access grants.
   - Lazy decryption: Content only decrypted when viewed.

4. **Security Vault**
   - Local private key storage.
   - Passphrase-protected cloud backup (PBKDF2).

---

## 2. Technical Architecture

### 2.1 Technology Stack

#### Frontend & Core
- **Framework:** Next.js 16 (App Router)
- **Architecture:** Static Export (`output: 'export'`)
- **Animations:** Framer Motion (Glassmorphism & Bento transitions)
- **Styling:** Tailwind CSS 4
- **Security:** Web Crypto API

#### Backend (Serverless)
- **Authentication:** Firebase Auth
- **Database:** Firestore (Real-time NoSQL)
- **Storage:** Firebase Storage (Encrypted BLOBs)
- **Deployment:** Firebase Hosting

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Next.js    │  │  Web Crypto  │  │  Local Storage     │  │
│  │ Static App │  │  (RSA/AES)   │  │  (Private Keys)    │  │
│  └─────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
└────────┼────────────────┼───────────────────────┼───────────┘
         │                │                       │
         │ Firebase SDK   │ Client-side E2EE      │ Zero-Knowledge
         │ (JS)           │                       │
┌────────▼────────────────▼───────────────────────▼───────────┐
│                      Firebase Platform                       │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Firestore    │  │ Firebase     │  │   Firebase    │  │
│  │   (NoSQL)      │  │ Auth         │  │   Storage     │  │
│  └────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Specifications

### 3.1 Authentication
- Client-side session management via Firebase SDK.
- User profiles identified by `uid` and unique `nickname`.
- Mandatory setup of RSA Key Pair for E2EE features.

### 3.2 Bento Link Blocks
- **Public:** Metadata stored in Firestore, visible to all.
- **Friends:** AES keys shared via RSA handshake.
- **Private:** Only decrypted by owner's local private key.

### 3.3 Sovereign Chat
- **Direct Chat:** P2P E2EE using connection-specific AES keys.
- **Group Chat:** Multi-participant key distribution via admin generation.
- **TTL Support:** `expiresAt` field mapped to Firestore TTL policy for physical deletion.

---

## 4. Data Model (Firestore)

- **`users`**: Profiles, Public Keys, Theme configs.
- **`link_blocks`**: Bento content, Encrypted blobs, Visibility settings.
- **`connections`**: Friend relationships (Accepted/Pending).
- **`conversations`**: Chat metadata, Participant IDs, Encrypted keys.
- **`conversations/{id}/messages`**: Encrypted message history.
- **`conversations/{id}/presence`**: Transient typing status.
- **`access_requests/grants`**: Handshake tracking for encrypted assets.

---

## 5. Security & Encryption

### 5.1 The Handshake
1. User A requests access to User B's file.
2. User B (Owner) decrypts the file's AES key using their private key.
3. User B re-encrypts that AES key with User A's Public Key.
4. User A receives the grant and decrypts the AES key to view the file.

### 5.2 Burn After Reading
- Messages can be sent with a 30-second TTL.
- Client hides expired messages via `onSnapshot` filtering.
- Server deletes documents automatically via Firestore TTL policy.

---

## 6. Deployment & Infrastructure

- **Hosting:** Static deployment on Firebase Hosting.
- **Routing:** `/u/[nickname]` handled by client-side parsing of `usePathname` via global rewrites.
- **CORS:** Bucket-level policy required for P2P file uploads.

---

## Change Log

**Version 2.0 (Current)** - December 2025
- Migrated to Firebase (Removed Supabase/Vercel dependencies).
- Implemented Static Export architecture.
- Added Sovereign Chat v2.0 (Groups, TTL, Typing).
- Rebranded "Connections" to "Friends".
- Decommissioned Stripe and AI legacy features.

---

# OneLink - Technical Documentation

## 1. Project Overview

OneLink is a serverless, zero-knowledge peer-to-peer sharing platform. It utilizes a **Serverless Static Architecture** deployed on Firebase, ensuring absolute privacy through client-side encryption (Web Crypto API) and a P2P key handshake mechanism.

### Core Architecture
- **Type:** Next.js Static Export.
- **Security:** Trust No One (TNO). Private keys never leave the browser.
- **Backend:** Firebase (Auth, Firestore, Storage).

---

## 2. Tech Stack

- **Framework:** Next.js 16 (App Router, Static Export).
- **Styling:** Tailwind CSS 4.
- **Animations:** Framer Motion.
- **Database/Real-time:** Firestore + `onSnapshot`.
- **Encryption:** Web Crypto API (RSA-OAEP 2048, AES-GCM 256).
- **Storage:** Firebase Storage (Bucket-level CORS enabled).

---

## 3. Directory Structure

```text
/onelink/
├── app/
│   ├── auth/             # Login & Registration
│   ├── dashboard/        # Authenticated UI
│   │   ├── chat/         # Sovereign Messaging
│   │   ├── friends/      # P2P Network management
│   │   ├── links/        # Bento Grid management
│   │   └── profile/      # E2EE Keys & Settings
│   └── u/profile/        # Static Profile Catch-all
├── components/           # Atomic UI Components
│   ├── friends/          # Chat & Friend logic
│   ├── dashboard/        # Shell & Layout
│   └── public/           # Profile Rendering
├── hooks/
│   ├── use-chat.ts       # Real-time Encrypted Listeners
│   └── use-crypto.ts     # P2P Encryption Primitives
├── lib/
│   ├── crypto.ts         # Encryption Implementation
│   └── firebase/         # Client-side Initialization
├── firestore.rules       # Security Lockdown
└── storage.rules         # Asset Security
```

---

## 4. Encryption Implementation

### 4.1 Key Management
- **Local Storage:** Raw private keys are stored exclusively in the browser's `localStorage`.
- **Vault:** Private keys are backed up to Firestore only after being encrypted with a user-defined passphrase using **PBKDF2** derivation.

### 4.2 Chat Encryption (Sovereign Chat v2.0)
- **Direct Chats:** When a chat is initiated, a unique AES-GCM key is generated. This key is re-encrypted with each participant's RSA public key and stored in the conversation metadata.
- **Messages:** Message content is encrypted with the conversation's AES key before transmission to Firestore.

---

## 5. Security Rules

### 5.1 Firestore Rules
- **Users**: Publicly readable; writable only by owner.
- **Friends/Connections**: Readable only by participants.
- **Conversations/Messages**: Strict participant validation using `request.auth.uid in resource.data.participantIds`.
- **Presence**: Transient typing status restricted to chat participants.

### 5.2 Storage Rules
- **Assets**: Downloads permitted ONLY if the requester is the owner OR a valid `access_grants` document exists in Firestore for that specific user and file.

---

## 6. Key Features Implementation

### 6.1 Dynamic Static Routing
Since the app is a static export, the `/u/[nickname]` route is handled via:
1.  **Firebase Rewrite:** All `/u/**` paths are rewritten to `/u/profile.html`.
2.  **Client-side Parsing:** The `ProfilePage` component extracts the nickname from the URL using `usePathname` and fetches the profile data accordingly.

### 6.2 Burn After Reading (TTL)
- **Field:** `expiresAt` (Timestamp).
- **Client Logic:** `useChat` hook filters out messages where `expiresAt < now`.
- **Server Logic:** Firestore TTL Policy (must be enabled in Console) physically deletes documents once they expire.

### 6.3 Real-time Typing Indicators
- Implemented via a `presence` sub-collection inside each conversation.
- Components use `setDoc` on `pointerdown/change` and `onSnapshot` to display who is active.

---

## 7. Maintenance & Operations

### Build & Deploy
```bash
# Generate static files
npm run build

# Push to production
firebase deploy --only hosting,firestore,storage
```

### Required Configuration
- **Authorized Domains**: Add your production domain to Firebase Auth.
- **CORS**: Deploy `cors.json` to the storage bucket using `gsutil`.
- **TTL**: Enable TTL policy on the `messages` collection group for the `expiresAt` field.

---


