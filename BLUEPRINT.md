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