
# **OneLink** Digital Passport Integration Guide  
* evolving from "Standard Social Links" to **"Verified Social Links"** (acting as a Digital Passport) fundamentally changes the platform from a directory of URLs to a **trust-based identity layer**.
* Here is a breakdown of the differences and the technical logic behind this shift.
---
### 1. The Core Conceptual Shift

| **Feature**     | **Standard Social Links**             | **Verified Social Links (Digital Passport)**    |
| --------------- | ------------------------------------- | ----------------------------------------------- |
| **User Intent** | "Visit me here."                      | "I am the owner of this account."               |
| **Validation**  | None. Anyone can paste any URL.       | **Proof of Ownership** (via OAuth or rel="me"). |
| **Trust Level** | Low. Prone to impersonation/scams.    | High. Eliminates "Identity Fragmentation."      |
| **Analogy**     | A business card you printed yourself. | A government-issued passport with stamps.       |

---
### 2. Functional Differences & Technical Logic
#### A. Cryptographic Proof of Ownership
Standard links are just strings of text. Verified links utilize the **`rel="me"`** attribute or **OAuth 2.0 handshakes** (similar to Gravatar or Mastodon).
- **How it works:** When you link your GitHub to OneLink, you sign in via GitHub. OneLink receives a token confirming your `user_id`.
- **The Difference:** If someone tries to impersonate you on OneLink, they cannot "verify" the link because they don't have your GitHub credentials. This creates a **Canonical Source of Truth**.
#### B. The "Cross-Platform" Reputation (The Passport Effect)
Like a passport allows you to move between countries with one identity, a Verified Social Link allows your reputation to follow you.
- **The Logic:** If your OneLink profile has 5 "Verified" badges (X, LinkedIn, GitHub, Spotify, Telegram), a visitor knows they are interacting with the **real Borislav Manov**.
- **Portability:** These verifications can be exported as **Verifiable Credentials (VCs)**. You could potentially use your OneLink "Digital Passport" to sign into other apps without creating a new password.
#### C. Metadata Enrichment & Discovery
Verified links aren't just buttons; they are **Data Connectors**.
- **Standard:** A button that opens `instagram.com/user`.
- **Verified:** An API bridge that can pull in your latest post, your follower count (as a trust signal), or your "Verified" status from that platform. It turns a static link into a widget.
---
### 3. Impact on OneLink’s Value Proposition
For a software developer and product founder like you, this upgrade transforms OneLink into a **B2B Trust Tool**:
1. **Anti-Phishing for Musicians/Creators:** In the techno scene, fake profiles are common. A "Verified" OneLink becomes the only place fans go to find legitimate ticket links or music downloads.
2. **Sovereign Identity:** By using Gravatar-like verification, you don't "own" the user's data; you simply **attest** to it. This aligns perfectly with your "privacy-focused" philosophy. You aren't storing their passwords; you are storing a cryptographic proof that they own the account.
3. **Frictionless Networking:** Instead of sharing 5 links, you share one "Passport." If a collaborator sees your GitHub is verified, they trust your code commits immediately.
---
### 4. Implementation Logic: How to Build It
If we were to implement this "Better One," the logic flow would be:
1. **Verification Hub:** A dashboard section where users "Connect" accounts rather than "Paste" links.
2. **Visual Signifiers:** Use a distinct "Verified" checkmark (perhaps a custom OneLink violet badge) only for API-confirmed links.
3. **Audit Trail:** A timestamp of when the link was last verified (e.g., _"Verified via LinkedIn on Dec 2025"_).

---

# OneLink Chat Integration Guide

Follow these steps to wire the Sovereign Chat system into your Next.js + Firebase environment.

## 1. Firebase Setup

### Firestore Indexes
Ensure the following composite indexes are created in the Firebase Console:
- Collection: `conversations`, Fields: `participantIds` (Array), `updatedAt` (Descending).
- Collection: `messages` (Collection Group), Fields: `expiresAt` (Ascending), `createdAt` (Ascending).

### TTL Policy
1. Navigate to **Firestore -> Settings**.
2. Enable TTL.
3. Add a TTL policy for the `messages` collection group on the `expiresAt` field.

## 2. Encryption Primitives (`lib/crypto.ts`)

Ensure your crypto library implements the following:
- `generateChatKey()`: Returns a random 256-bit AES-GCM key.
- `encryptKeyForParticipants(aesKey, publicKeys)`: Encrypts the AES key using each participant's RSA public key.
- `decryptMessage(encryptedContent, iv, aesKey)`: Decrypts message content using the shared AES key.

## 3. Implementing the Hook (`hooks/use-chat.ts`)

Your `useChat` hook should handle real-time synchronization:

```typescript
export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState([]);
  const { decrypt } = useCrypto();

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
      const newMessages = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        // Client-side TTL filtering for billing-disabled envs
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) return null;
        
        const decryptedContent = await decrypt(data.content, data.iv);
        return { id: doc.id, ...data, content: decryptedContent };
      }));
      setMessages(newMessages.filter(m => m !== null));
    });
  }, [conversationId]);

  return { messages };
};
```

## 4. Wiring the UI

1. **Dashboard Shell**: Use `ChatShell` to wrap your chat view.
2. **State Management**: Track the `activeConversationId` in your dashboard state.
3. **Optimistic Updates**: When sending a message, add it to the local UI state immediately before the `addDoc` call to ensure zero-latency perception.

## 5. Security Checklist
- [ ] Deploy `firestore.rules` to lock down access.
- [ ] Verify that private keys NEVER leave the browser (check your network tab).
- [ ] Ensure `Recovery Phrase` onboarding is mandatory before allowing chat access.

---



---
## 1. Current Architecture Analysis
OneLink is a **privacy-focused link management and networking platform**. Its core value proposition is the unification of multiple digital identities into a single, high-fidelity landing page with built-in attribution and security.
### Core Technical Pillars
- **Dynamic Routing Engine:** Uses device and OS detection to instantly redirect users to the correct destination (App Store vs. Google Play vs. Web) through a single URL.
- **Privacy-Preserving Attribution:** Collects high-intent marketing data without invasive cross-site tracking, leveraging owned media to maintain data sovereignty.
- **Bento Grid UI:** Utilizes a modular "Bento" layout philosophy, which organizes diverse content types into digestible, scannable units while maintaining a high-focus aesthetic.
- **Sovereign Networking:** Features like a "Friends" system and integrated "Chat" suggest a shift toward decentralized digital identity rather than just link-hosting.
---
## 2. Logical "Next-Gen" Evolution
To create a "Better One," we can evolve the existing features into a more robust, **Zero-Knowledge Identity Hub**.
### A. Advanced Security: RSA & ZK-Proofs
Instead of standard server-side encryption, the improved version would implement **Self-Sovereign Identity (SSI)**.
- **RSA Key Integration:** Users generate a **2048-bit RSA key pair** locally. The public key is used for secure inbound message encryption, while the private key remains on the user's device, ensuring that not even the OneLink platform can read personal communications.
- **Zero-Knowledge Proofs (ZKP):** Implement ZK-Proofs for social verification. A user can prove they are "Over 18" or "Verified Professional" without ever sharing their actual date of birth or ID documents with the platform or other users.
### B. Modular Data Strategy: "OneLake" Integration
For creators and organizations, data should not be siloed.
- **Unified Data Lake:** Transition from a simple database to a **OneLake-style logical data lake**. This allows all profile analytics (clicks, conversions, social growth) to be stored in a single copy that can be accessed by different analytical engines without duplicating data.
- **Shortcuts & Cross-Domain Access:** Use "Shortcuts" to link external data sources (like Shopify or YouTube) directly into the dashboard without moving the data, maintaining speed and security.
### C. UX Refinement: Intelligent Bento Grids
The interface should evolve from static cards to **Dynamic Widgets**.
- **Intentional Constraints:** Limit the primary view to **5–9 core "chunks"** of information, adhering to cognitive psychology principles to prevent user overload.
- **Live Context Widgets:** Cards that change based on user state (e.g., a "Current Meeting" card that only appears when a user is in a live session).
---
## 3. Structured Build Info (The "Better" Implementation)

| **Layer**    | **Component**         | **Technical Specification**                                                          |
| ------------ | --------------------- | ------------------------------------------------------------------------------------ |
| **Identity** | SSI Wallet            | **RSA 2048** for messaging; **zk-SNARKs** for attribute verification.                |
| **Compute**  | Serverless Edge       | Redirect logic handled at the **Edge** (e.g., Cloudflare Workers) for <50ms latency. |
| **Storage**  | OneLake Architecture  | Single-copy Parquet format storage to ensure high-performance analytics.             |
| **Frontend** | React + Framer Motion | Bento Grid with **Motion-enhanced** micro-interactions for polished UX.              |
| **Network**  | P2P Encrypted Chat    | End-to-end encryption where the platform acts as a relay, not a viewer.              |

---
## 4. Logical Functionality Workflow
1. **Onboarding:** User generates a local RSA key pair; public key is pinned to their global OneLink profile.
2. **Interaction:** A visitor clicks a link. The Edge router detects the OS and performs a **Deferred Deep Link** to the app or specific content.
3. **Verification:** To message the creator, the visitor must prove they are a "Friend" via a ZK-Proof challenge—proving they hold a specific access token without revealing their wallet address.
4. **Analytics:** Click data is piped to the OneLake dashboard in real-time, providing immediate ROI tracking without privacy-invasive cookies.

---

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
*Generated by Gemini CLI Agent*

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
- **CORS:** Bucket-level policy required for P2P file uploads.---
## Change Log
**Version 2.0 (Current)** - December 2025
- Migrated to Firebase (Removed Supabase/Vercel dependencies).
- Implemented Static Export architecture.
- Added Sovereign Chat v2.0 (Groups, TTL, Typing).
- Rebranded "Connections" to "Friends".
- Decommissioned Stripe and AI legacy features.

---
  
  
  