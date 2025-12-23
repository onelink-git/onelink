---

onelink_technical_architecture.md

---

Based on the comprehensive technical architecture and specialized privacy features of **OneLink**, the following analysis breaks down its current implementation and proposes a logical "Next-Gen" evolution of the platform.

## 1. Current Architecture Analysis
OneLink is a **privacy-focused link management and networking platform**. Its core value proposition is the unification of multiple digital identities into a single, high-fidelity landing page with built-in attribution and security.
### Core Technical Pillars
- **Dynamic Routing Engine:** Uses device and OS detection to instantly redirect users to the correct destination (App Store vs. Google Play vs. Web) through a single URL.
- **Privacy-Preserving Attribution:** Collects high-intent marketing data without invasive cross-site tracking, leveraging owned media to maintain data sovereignty.
- **Bento Grid UI:** Utilizes a modular "Bento" layout philosophy, which organizes diverse content types into digestible, scannable units while maintaining a high-focus aesthetic.
- **Sovereign Networking:** Features like a "Friends" system and integrated "Chat" suggest a shift toward decentralized digital identity rather than just link-hosting.
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
## 3. Structured Build Info (The "Better" Implementation)

| **Layer**    | **Component**         | **Technical Specification**                                                          |
| ------------ | --------------------- | ------------------------------------------------------------------------------------ |
| **Identity** | SSI Wallet            | **RSA 2048** for messaging; **zk-SNARKs** for attribute verification.                |
| **Compute**  | Serverless Edge       | Redirect logic handled at the **Edge** (e.g., Cloudflare Workers) for <50ms latency. |
| **Storage**  | OneLake Architecture  | Single-copy Parquet format storage to ensure high-performance analytics.             |
| **Frontend** | React + Framer Motion | Bento Grid with **Motion-enhanced** micro-interactions for polished UX.              |
| **Network**  | P2P Encrypted Chat    | End-to-end encryption where the platform acts as a relay, not a viewer.              |

## 4. Logical Functionality Workflow
1. **Onboarding:** User generates a local RSA key pair; public key is pinned to their global OneLink profile.
2. **Interaction:** A visitor clicks a link. The Edge router detects the OS and performs a **Deferred Deep Link** to the app or specific content.
3. **Verification:** To message the creator, the visitor must prove they are a "Friend" via a ZK-Proof challenge—proving they hold a specific access token without revealing their wallet address.
4. **Analytics:** Click data is piped to the OneLake dashboard in real-time, providing immediate ROI tracking without privacy-invasive cookies.

---

GEMINI.md

----

# OneLink Sovereign Vault - Instructional Context

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

*Generated by Gemini CLI Agent*

---

OSC-onelink.md

---

# Links
* Share your favorite links — blogs, products, videos, and more.

### Show images with links [ON] 
* Your links will show images

# Your Links (Example)
[Add link]

## 1. Instagram
* Edit your link and site description. Keep it short.
URL: https://instagram.com/bobsby23
Image preview:
Uploaded image [Upload image]
Title: Instagram
Description: My Instagram
[Update]

## 2. OneLink
* Edit your link and site description. Keep it short.
URL: https://studio-3873706295-c9cae.web.app/dashboard#features
Image preview [Upload image]
Title: OneLink
Description: Your links, your privacy, your control Build your digital presence with end-to-end encryption, selective sharing, and secure P2P asset distribution. The only link-in-bio platform that puts privacy first.
[Update]


# Card
* Your Gravatar card follows you across millions of sites, showing your photo, bio, and links — your digital business card. Update once, done everywhere.

Customize your card:

### Show header image
Bring your custom header everywhere.
### Show contact button
Let others easily send you a message.
### Show send money button
Accept payments or donations.
* COPY CARD HTML

---

# AI profile builder
* Make a custom AI prompt that tells any chatbot exactly who you are. Just copy, paste, go. Learn more

## Communication Preferences
Tone: Casual / Default / Professional
Detail level: Concise / Default / In-Depth
Humor: Dry / Default / Playful
[Copy your profile]

# AI Context for Borislav Manov

## Communication Preferences
* Use a casual tone when responding. Give in-depth responses. Use a playful sense of humor where appropriate.

## Profile
- Name: Borislav Manov
- Location: Bulgaria
- Languages: Bulgarian (Primary)
- Timezone: Europe/Sofia
- Company: One Beat Party Ltd
- Job Title: Software developer, product founder, and creative
- About Me: Founder and builder of privacy-focused digital products and creative platforms. I work at the intersection of music, technology, and design, with a strong preference for minimalism, reproducibility, and self-hosted infrastructure. When I’m not shipping code, I’m producing minimal and techno music projects.

## Online Presence
\[Gravatar Profile\]: [gravatar.com/onelinksocial](https://gravatar.com/onelinksocial)
\[GitHub\]: [github.com/bmanov](https://github.com/bmanov)
\[Facebook\]: [support.gravatar.com/profiles/verified-accounts/#facebook](https://support.gravatar.com/profiles/verified-accounts/#facebook)
\[YouTube\]: [youtube.com/channel/UCNH_0SkZyxZrpO-LspUXqLw](https://www.youtube.com/channel/UCNH_0SkZyxZrpO-LspUXqLw)

## How to use

### ChatGPT:
* Copy your profile and paste it into ChatGPT's Settings → Personalization → Custom instructions.
### Claude:
* Copy your profile and paste it into Claude's Settings → Profile → Personal preferences.
### Gemini:
* Copy your profile and paste it into Gemini's Settings → Saved info.
### Perplexity:
* Copy your profile and paste it into Perplexity's Settings → Personalize.

---

# Verified accounts
* Let people know where else they can find you online.

### Connected accounts
* GitHub
* Facebook
* YouTube

### More services
Bluesky
WordPress
Threads
LinkedIn
X
TikTok
Flickr
Tumblr
Mastodon
Twitch
Fediverse
Stack Overflow
Calendly
Vimeo
TripIt
Foursquare
Goodreads
Patreon
Pinterest
Reddit
eBay
Dribbble
GitLab
Spotify
Strava
Telegram

---


