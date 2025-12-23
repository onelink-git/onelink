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