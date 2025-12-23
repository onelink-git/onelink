# 📘 OneLink: Master Design & Technical Documentation

## 1. Executive Summary
**OneLink** is a privacy-first "Universal Profile Layer" designed to consolidate a user's digital identity into a single, secure, customizable hub. Unlike traditional link-in-bio tools, OneLink operates on a **no-tracking/no-ads** philosophy, leveraging **End-to-End Encryption (E2EE)** to ensure user data remains sovereign.

**Core Value Proposition:**
1.  **Unified Identity:** One link (`onelink.app/u/:nickname`) for all social, professional, and communication channels.
2.  **Granular Privacy:** "Friend-Gating" logic allowing specific links (e.g., Phone Number) to be visible only to accepted friends, while others (e.g., Twitter) remain public.
3.  **AI Personalization:** Dynamic, AI-generated themes and layouts (powered by Gemini) that adapt to user content.

---

## 2. Market Analysis & Business Model

### Target Audience
*   **Privacy-Conscious Professionals:** Consultants, lawyers, and journalists who need to share contact info securely.
*   **Content Creators:** Users needing a "Link-in-bio" that they actually own and control.
*   **Event Networking:** Attendees who want to share details temporarily via QR code without exposing permanent data.

### Monetization Strategy (Freemium + B2B)
*   **Free Tier:** Basic profile, public links, standard themes.
*   **Pro Subscription ($5-9/mo):** Unlimited link blocks, E2EE file sharing, advanced AI themes, removing branding.
*   **Enterprise/White-Label:** Private instances for organizations to issue "Verified Employee" digital cards.

---

## 3. Technical Architecture

### Current Stack (MVP Implementation)
The current production-ready frontend is built on **React**, currently using **mock data**, architected to swap easily to **Supabase**.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + Vite** | SPA architecture, high performance. |
| **Language** | **TypeScript** | Strict typing for reliability. |
| **Styling** | **Tailwind CSS** | Dark mode enabled (`darkMode: 'class'`), responsive design. |
| **State** | **Zustand** | Lightweight client-side state management. |
| **Backend** | **Supabase** (Ready) | PostgreSQL DB, Auth, Realtime subscriptions. |
| **Security** | **RLS / E2EE** | Row-Level Security policies + Client-side AES-GCM encryption. |

### Database Schema (PostgreSQL/Supabase)

**1. Users (`users`)**
*   `id` (UUID, PK): Matches Auth ID.
*   `nickname` (Text, Unique): The public handle.
*   `display_name`, `bio`, `avatar_url`.
*   `public_key` (Text): For E2EE.

**2. Links (`link_blocks`)**
*   `id` (UUID, PK).
*   `user_id` (FK): Owner.
*   `type`: (Social, Contact, Custom).
*   `url` / `value`: The content.
*   `visibility`: Enum (`'public'`, `'friends'`, `'private'`).
*   `encrypted_blob`: Stores data if visibility is private.

**3. Friendships (`connections`)**
*   `requester_id`, `receiver_id`.
*   `status`: (`'pending'`, `'accepted'`, `'blocked'`).
*   `shared_key`: Encrypted session key for friend-only data access.

---

## 4. Core Features & Implementation Status

### A. Identity & Profile (✅ Implemented - Frontend)
*   **Dynamic Routing:** Profiles accessible via `/u/:nickname`.
*   **Customization:** Users can edit bio, avatar, and toggle between Light/Dark/Neon themes.
*   **QR Code:** Built-in QR generator for instant sharing.

### B. Link Management (✅ Implemented - Frontend)
*   **Add/Edit/Delete:** Users can manage link blocks.
*   **Visibility Logic:** The UI successfully filters links based on the viewer's status (Friend vs. Public).
    *   *Public:* Visible to everyone.
    *   *Friends-Only:* Visible only if `connections.status = 'accepted'`.
    *   *Private:* Visible only to the owner.

### C. Social System (🚧 Partial / Mocked)
*   **Friend Requests:** UI exists for sending/accepting requests.
*   **Chat:** A real-time chat interface is built but currently runs on local mock state.
*   **Requirement:** Needs Supabase Realtime enabled to function across devices.

### D. AI Theme Generator (❌ Planned / Mocked)
*   **Concept:** Users type a prompt (e.g., "Cyberpunk sunset"), and Gemini AI generates a Tailwind color palette.
*   **Status:** The UI exists, but the API call to Gemini is currently mocked.

---

## 5. Security & Privacy Specifications

### End-to-End Encryption (E2EE)
OneLink employs a "Trust No One" architecture for private data.
1.  **Key Generation:** Client generates RSA-OAEP keys in the browser (Web Crypto API).
2.  **Encryption:** "Secret Notes" or "Private Links" are encrypted client-side before being sent to the database.
3.  **Storage:** The database stores only the `encrypted_blob`. The server **cannot** read this data.
4.  **Decryption:** Data is decrypted only on the client device using the private key stored in `localStorage` (MVP) or IndexedDB.

### Row Level Security (RLS)
Database policies must ensure:
*   `public` profiles are readable by `anon`.
*   `friends-only` data is readable only if a valid `connection` record exists.
*   `private` data is readable only by `auth.uid()`.

---

## 6. Future Roadmap & Strategic Expansion

### Phase 1: Backend Integration (Immediate Priority)
*   Swap `src/mocks` with `supabaseClient.ts`.
*   Connect Auth (Sign up/Login).
*   Implement RLS policies in PostgreSQL.

### Phase 2: AI & Media
*   Connect **Google Gemini API** to the Theme Generator.
*   Implement Image Uploads (Supabase Storage) for avatars/covers.

### Phase 3: "Social Identity Vault" (Long Term)
*   **Verifiable Credentials (VC):** Allow users to display cryptographically verified badges (e.g., "Verified Employee of X").
*   **Secure File Sharing:** Implement the P2P / Encrypted file drop feature mentioned in research docs.
*   **Geolocation:** Optional, ephemeral "Find Friends Near Me" feature for conferences (Opt-in only, data purged after 1 hour).

---

## 7. Immediate Next Steps (Developer Tasks)

1.  **Environment Setup:** Create `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2.  **Database Migration:** Run the SQL scripts provided in `DATABASE-SCHEMA.sql` to generate tables.
3.  **Auth Hook:** Replace `useAppStore` mock auth with Supabase `onAuthStateChange` listener.
4.  **Data Fetching:** Replace local state arrays with `supabase.from('links').select('*')`.