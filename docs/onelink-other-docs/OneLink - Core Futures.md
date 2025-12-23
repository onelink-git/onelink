# FUTURE 1: Social Links & Contact Details
* **(expanded, simplified, production-ready)**

OneLink: Super powerful link management, privacy and simplicity front-and-center. 
Design and implementation plan:
product goals, feature breakdown (MVP → enhancements), technical design (DB, APIs, encryption), UX flows, privacy/security, metrics, rollout plan, tests and examples. Everything is written to be implementable by your Next.js + Supabase stack.

---

## Product goals (what success looks like)

1. **Flexible link types** — Support many link/contact types (URL, social profiles, phone, email, file, note, CTA, product, payment, calendar) with minimal friction.
    
2. **Granular visibility** — Per-item visibility: `public`, `friends`, `private`, plus `token-gated` and `time-limited`.
    
3. **Easy organization** — Sections, pinned items, drag-and-drop, bulk actions, search/filter.
    
4. **Privacy-first encryption** — Private/friends-only content encrypted client-side; server never sees plaintext keys.
    
5. **Simple workflows** — 90-second onboarding to set up 5 links + theme; easy inline edit on mobile.
    
6. **Extensible & audit-ready** — Versioning, audit trail, import/export, programmatic access (SDK/API).
    
7. **Measurable & respectful analytics** — Opt-in lightweight stats that don’t compromise privacy.
    

---

## Prioritized roadmap

### MVP 1

- Data model for link blocks with `type`, `visibility`, metadata fields and `encrypted_blob`.
    
- Add/Edit/Delete UI with drag-and-drop ordering and basic validation.
    
- Visibility policies: `public`, `friends`, `private`.
    
- Client-side encryption (AES-GCM) for `private` items; public items stored plaintext.
    
- Basic friends key-exchange flow for `friends` visibility (encrypt AES key with friend’s public key).
    
- Bulk import (CSV) for links and contacts.
    
- Server actions for CRUD and a route to increment clicks.
    

### MVP 2

- Link sections/groups and pinned items.
    
- Time-limited visibility (schedule publish/unpublish + expiry).
    
- Token-gated access (single-use tokens + QR issuance).
    
- Contact card type with vCard export and "copy to clipboard" actions.
    
- Lightweight, privacy-preserving analytics per link (clicks, uniq visits — no fingerprinting).
    
- Export/import encrypted backup (client-side encrypted zip).
    

### MVP 3

- Smart suggestions (AI to suggest titles, icons, re-ordering).
    
- Rich embeds for social (YouTube, Spotify, Twitter) and file previews.
    
- Link-level A/B testing.
    
- Admin audit log and version history (undo link changes).
    
- Integrations for calendar/contact syncing (Google/Apple Oauth* — opt-in only).
    

### MVP 4 - Long-term

- Multi-device key recovery (Shamir’s Secret Sharing / encrypted backup to user’s trusted devices).
    
- NFT-token gating and Web3 wallet gating.
    
- Team-shared link collections with role-based permissions.
    
- Marketplace for widgets (paid/premium ctas).
    

* OAuth integrations must be clearly opt-in and not used to collect or persist private data without user consent.

---

## Feature breakdown & UX details

### Link types (recommended minimal set)

- `url` — standard link
    
- `profile` — social account (Instagram/Twitter/etc.), auto-icon
    
- `contact` — phone/email/address (can render “call”, “email”, or vCard)
    
- `file` — uploaded asset (pdf, mp3), protected by Vercel Blob
    
- `note` — text-only (private journal / bio snippet)
    
- `cta` — payment/tip/shop action (Stripe link)
    
- `calendar` — meeting link (Calendly/Google Meeting)
    
- `custom` — JSON blob for extensions
    

Each link has:

- `id, user_id, type, title, subtitle, url, icon, visibility, position, section_id, is_pinned, schedule_from, schedule_to, encrypted_blob, metadata_json, created_at, updated_at`
    

### Visibility policies (semantics)

- **public** — visible to anyone; stored plaintext; indexed for SEO.
    
- **friends** — visible only to accepted connections; content encrypted in DB; AES key encrypted with each friend public key.
    
- **private** — visible only to owner; AES key stored locally or encrypted with owner's public key; never delivered to server in plaintext.
    
- **token-gated** (advanced) — access via one-time or time-limited tokens (QR code). Tokens are HMAC-signed and expire.
    
- **scheduled** — uses `schedule_from` and `schedule_to` to govern visibility windows. Enforcement server-side + UI hints.
    

### Organization

- **Sections**: user-defined sections (e.g., “Shop”, “Work”, “Media”). Each section ordered and has own visibility rules (e.g., entire section friends-only).
    
- **Pinned items**: Always at top. Per-profile limit (e.g., up to 2 pinned on free, 5 on Pro).
    
- **Drag-and-drop**: Real-time re-order (optimistic UI with server reconciliation).
    
- **Search & Filter**: By type, visibility, title. Mobile-first search bar.
    

### Mobile UX principles

- 1-tap actions: long-press for quick edit, swipe-left to delete/archive.
    
- Inline edit modal that doesn’t navigate away.
    
- Big tappable icons, one-handed reach for primary CTA.
    
- Quick-add templates for common link types (email, phone, PayPal, Discord).
    

### Microcopy & affordances

- For private items: show “🔒 Private — only you can view” with tooltip explaining recovery options.
    
- For friends items: “🔐 Friends — encrypted, sent to [N] friend(s)”
    
- For token-gated: “Shareable link — expires in 24h”
    

---

## Technical design

### DB schema (additions / changes)

Add columns to `link_blocks` (showing diffs):

```sql
ALTER TABLE link_blocks
ADD COLUMN section_id UUID NULL REFERENCES sections(id),
ADD COLUMN subtitle TEXT NULL,
ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB,
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN schedule_from TIMESTAMPTZ NULL,
ADD COLUMN schedule_to TIMESTAMPTZ NULL,
ADD COLUMN gate_token_prefix TEXT NULL, -- for token gating
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN archived BOOLEAN DEFAULT FALSE;
```

Create `sections` table:

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','friends','private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Encryption model (practical)

- **AES-GCM** symmetric key per `encrypted_blob`. Encrypt content + IV + auth tag as base64 JSON.
    
- **Key handling**:
    
    - `private` items: AES key derived/generated client-side, encrypted with owner's public key and stored inside `encrypted_blob` for completeness (but the private key never leaves the device). Alternatively, store just the AES-encrypted data and rely on local key derived from passphrase (if user chooses) — trade-offs documented in UX.
        
    - `friends` items: AES key encrypted multiple times — once per friend public key — or use a shared symmetric group key managed through an ephemeral key-exchange. Store a small map of `{friend_id: encrypted_aes_key}` in the blob.
        
- **Key rotation & revocation**:
    
    - When a user rotates keys, regenerate per-friend encrypted keys for existing `friends`-visible items.
        
    - When a friend is removed, revoke by re-encrypting AES content with a new key (costly: do lazily on first edit or background job).
        
- **LocalStorage caveat**: Don’t store private keys in `localStorage` unencrypted. Use IndexedDB and WebCrypto `CryptoKey` if possible; provide an encrypted export backup.
    

### API & server actions

Server-side uses Server Actions + Route Handlers:

- `createLink(data)` — server action
    
    - Validate fields, call Supabase insert. For encrypted content, store encrypted_blob exactly as given by client.
        
- `updateLink(id, data)` — server action
    
    - Verify author, update fields, bump `version`.
        
- `deleteLink(id)` — server action
    
    - Soft-delete (archived flag) and write audit log.
        
- `reorderLinks(positions: [{id, position}])` — server action
    
- `getPublicProfile(nickname)` — route handler (SSR/ISR)
    
    - Return only allowed public sections/links and metadata necessary to render profile. Cache aggressively.
        
- `linkClick(linkId, context)` — route handler
    
    - Increment click_count via DB function (security-definer). Return nearby recommendations if authorized.
        

Example TypeScript interface:

```ts
interface LinkBlock {
  id: string;
  user_id: string;
  type: 'url'|'profile'|'contact'|'file'|'note'|'cta'|'calendar'|'custom';
  title: string;
  subtitle?: string;
  url?: string;
  icon?: string;
  visibility: 'public'|'friends'|'private'|'token';
  section_id?: string;
  is_pinned?: boolean;
  schedule_from?: string|null;
  schedule_to?: string|null;
  encrypted_blob?: string|null;
  metadata?: Record<string, any>;
  position: number;
  archived?: boolean;
  version?: number;
}
```

### Client-side responsibilities

- Generate RSA keypair on signup (Web Crypto API) and store `CryptoKey` in IndexedDB (avoid insecure localStorage).
    
- For `private` content: generate AES key, encrypt content, send `encrypted_blob` to server; keep AES key locally or encrypt it with server-stored public key for backup if user wants.
    
- For `friends` content: fetch friends’ public keys and encrypt AES key for each friend, include those in `encrypted_blob`.
    
- Offer “Export backup” that bundles all encrypted_blobs + metadata (user downloads the file and stores it safely).
    

---

## Access control, RLS, and auditing

### RLS policies (summary)

- `SELECT` on `link_blocks`:
    
    - If `visibility='public'` → allow.
        
    - If `visibility='friends'` → JOIN connections table to ensure requester is accepted friend.
        
    - If `visibility='private'` → only allow if `auth.uid() = user_id`.
        
    - Enforce scheduled windows (`schedule_from <= now() AND (schedule_to IS NULL OR schedule_to >= now())`) server-side.
        
- `INSERT/UPDATE/DELETE`:
    
    - Only `user_id` may insert/update/delete their link_blocks (plus admin roles for enterprise).
        

### Auditing

- `link_block_changes` trigger to log changes into `link_block_audit` (user_id, action, old_value, new_value, performed_at, actor_id).
    
- Keep retention policy for audit logs (e.g., 1 year, configurable for enterprise).
    

---

## Privacy-respecting analytics

Goal: give creators useful metrics while respecting user privacy.

- Store click counts as integer counters; do not capture IP or user-agent unless user opts in.
    
- Provide aggregated metrics: daily clicks, device breakdown (mobile/desktop only if user consents), referrer domain (first-party only, hashed).
    
- For premium users, offer opt-in heatmaps using client-side hashed identifiers (no cookies, TTL-limited).
    
- Offer CSV export with aggregations (no raw visitor logs by default).
    

---

## Developer ergonomics & API consumption

- Provide a small JS SDK:
    
    - `initOneLink({ supabaseUrl, anonKey, onPrivateKeyNeeded })`
        
    - `createLink(block)`, `updateLink(block)`, `encryptAndUpload(block)`
        
    - Helpers to `generateKeyPair()`, `exportEncryptedBackup()`, `importEncryptedBackup()`
        
- Provide CLI tool for bulk import and migrations (useful for agencies migrating many clients).
    

---

## Migration & rollout plan

1. **DB migration**: add new columns + sections table (backwards-compatible). Use soft flags; don’t rename existing fields.
    
2. **Feature flag**: behind `LINK_V2` flag — deploy frontend changes progressively.
    
3. **Data migration job**: For existing private-like fields, move to `encrypted_blob` canonical format.
    
4. **User communication**: educate users about key handling and backup options; show a one-time onboarding modal for private link creators.
    
5. **Monitoring**: watch for errors in encryption workflows, failed decrypts; track number of users who exported backups.
    

---

## Acceptance criteria / Tests

- Unit tests for encryption helpers (encrypt/decrypt roundtrip).
    
- E2E tests (Playwright) for:
    
    - Creating/editing public/friends/private link.
        
    - Friends access flow: request, accept, verify visibility.
        
    - Scheduling: link shows/hides at scheduled times.
        
- Load test for link click increment path (throttle protection).
    
- Security tests: RLS policy fuzzing, pen-test critical flows.
    

---

## Example flows (practical)

### Create a friends-only note (client-side pseudo)

1. User types note. Client generates `aesKey`.
    
2. Client encrypts note → `encryptedContent`.
    
3. Client fetches friends’ public keys.
    
4. For each friend: encrypt `aesKey` with friend public key → `encryptedKeyMap`.
    
5. Build `encrypted_blob = { content: base64, iv: base64, keys: { friendId: base64Enc } }`.
    
6. POST to `createLink({ type: 'note', visibility: 'friends', encrypted_blob })`.
    

### Friend reads it

1. Friend fetches link metadata (server only supplies `encrypted_blob`).
    
2. Client finds `encryptedKeyMap[myFriendId]`, uses private RSA key to decrypt AES key.
    
3. Decrypt content with AES-GCM and display.
    

---

## Metrics to monitor (KPIs)

- Activation: % of new users who add ≥3 links in first 7 days.
    
- Retention: 7/30/90 day active users.
    
- Privacy adoption: % of users using `friends` or `private` visibility.
    
- Recovery: % of users who exported encrypted backup (measure of security awareness).
    
- Performance: profile page TTFB, LCP < 2.5s.
    
- Errors: failed decrypts / encryption exceptions per 1k operations.
    

---

## Edge cases & trade-offs (short)

- **Friend removal**: removing a friend doesn’t guarantee they’ve lost copies of content already decrypted. To fully revoke, re-encrypt content with a new AES key and distribute to remaining friends. This is costly — document it and offer a “Revoke & Re-encrypt” action.
    
- **Device loss**: if private keys are lost, user loses access to `private` items unless they've backed up. Offer clear export & warning flows.
    
- **Scale of per-friend key encryption**: with large friend lists, encrypting the AES key per friend is O(N). Use group keys or ephemeral shared keys for larger networks.
    
- **Server-side scheduling**: scheduled content must be enforced server-side to avoid exposing private content by mistake.
    

---

## Deliverables for the engineering team (concrete)

1. DB migrations scripts for added columns and sections table.
    
2. Server-side RLS policy updates and triggers for audit logging.
    
3. Server Actions and Route Handlers scaffolding for link CRUD and click increment.
    
4. Frontend components:
    
    - Link editor modal (supporting encrypted inputs)
        
    - Drag/drop list and sections UI
        
    - Schedule & visibility controls UI
        
5. Client crypto utilities (WebCrypto helpers).
    
6. Automated tests: unit + E2E + load.
    
7. Docs: UX copy, security FAQ, backup/recovery guide, developer SDK.
    

---

## Final note — UX-first, privacy-aligned decisions

Keep the product promise clear in UI. When designers add complexity (encryption, schedules, gating), hide it behind simple language and clear defaults:

- Default to `public` for new links, but prompt power users about `friends/private` options.
    
- Provide visual indicators for each visibility state.
    
- Make backups and key management a highlighted part of onboarding.
    

---



---

# FUTURE 2: Profile Sharing with Audience-Based Visibility
* ***Core idea (simplified)**

> A **single OneLink account** can generate **multiple profile views** from the same data — each tailored to a specific audience — **without duplicating content** and **without breaking privacy**.
> Think of OneLink as **one identity → many controlled windows**.

---

## 1. Why this matters (problem → solution)

### Problem today

- Users need **different links for different audiences**:
    
    - Public followers
        
    - Friends
        
    - Clients
        
    - Recruiters
        
    - Private use
        
- Current platforms force users to:
    
    - Duplicate profiles
        
    - Manually toggle links
        
    - Share multiple URLs
        
- This is error-prone and breaks privacy.
    

### OneLink solution

Introduce **Audience-Scoped Profiles**:

- One base profile
    
- Multiple **profile views** with different visibility rules
    
- Same `/u/{nickname}` base, different _access contexts_
    

---

## 2. Profile sharing model (mental model)

### Terminology (important for simplicity)

- **Identity** → the user account
    
- **Profile** → the public-facing page
    
- **Audience View** → a filtered version of the profile
    

```
User (identity)
 └── Profile (/u/nickname)
      ├── Public View
      ├── Friends View
      ├── Client View
      ├── Recruiter View
      └── Private View
```

Each view:

- Uses the same profile URL
    
- But renders **different content**
    
- Based on **who is accessing it**
    

---

## 3. Visibility levels (expanded & unified)

### Level 1 — Public

- URL: `/u/{nickname}`
    
- Anyone can access
    
- SEO indexed
    
- Contains:
    
    - Public links
        
    - Public sections
        
    - Public bio/theme
        
- No encryption required
    

---

### Level 2 — Friends

- Same URL: `/u/{nickname}`
    
- Viewer is authenticated and connected
    
- Shows:
    
    - Public + Friends links
        
    - Friends-only sections
        
    - Friends-only bio snippets
        
- Encrypted content decrypted client-side
    

---

### Level 3 — Audience Links (Share Tokens)

**This is the big upgrade**

#### Example URLs

```
/u/johndoe?audience=client
/u/johndoe?audience=recruiter
/u/johndoe?t=AbC123Xy
```

#### What they are

- **Audience-specific profile links**
    
- Generated by the profile owner
    
- Each has:
    
    - Visibility rules
        
    - Expiration
        
    - Optional password
        
    - Optional watermarking
        

#### Use cases

- Send to recruiter → shows CV, LinkedIn, portfolio
    
- Send to client → shows calendar, invoice link, contract files
    
- Send to press → shows media kit only
    

---

### Level 4 — Private (Owner Only)

- Same URL
    
- Only accessible if:
    
    - User is logged in
        
    - `auth.uid() === profile.user_id`
        
- Shows:
    
    - All content
        
    - Draft links
        
    - Internal notes
        
    - Analytics overlays
        

---

## 4. Audience Profiles (key feature)

### What is an Audience Profile?

A **named filter** applied to the profile.

```ts
interface AudienceProfile {
  id: string
  user_id: string
  name: "Client" | "Recruiter" | "Press"
  allowed_sections: string[]
  allowed_links: string[]
  visibility_rules: {
    require_login?: boolean
    require_token?: boolean
    expires_at?: string
    password_hash?: string
  }
}
```

### UX: how users create one

1. Go to **Profile → Sharing**
    
2. Click **“Create audience”**
    
3. Name it (Client, Recruiter, etc.)
    
4. Select:
    
    - Sections
        
    - Individual links
        
    - Visibility rules
        
5. Generate share link
    
6. Copy & send
    

No duplication. No confusion.

---

## 5. URL & routing strategy (clean and safe)

### Base route

```
/u/{nickname}
```

### Audience variants

```
/u/{nickname}?audience=client
/u/{nickname}?t={secure_token}
```

### Resolution logic (server-side)

```ts
if (viewer === owner) return FULL_PROFILE
if (token_valid) return AUDIENCE_PROFILE
if (viewer_is_friend) return FRIENDS_PROFILE
return PUBLIC_PROFILE
```

### Security guarantees

- Tokens are:
    
    - Signed (HMAC or JWT)
        
    - Time-limited
        
    - Revocable
        
- Server enforces filtering
    
- Client only decrypts what it’s allowed to see
    

---

## 6. Encryption & privacy model (critical)

### Public view

- No encrypted content delivered
    

### Friends view

- Encrypted blobs delivered
    
- AES key decrypted client-side via RSA
    

### Audience tokens

- Two modes:
    
    1. **Plain visibility** (no encryption, just filtering)
        
    2. **Encrypted audience**:
        
        - AES key encrypted using token-derived key
            
        - Token acts as access capability
            

This enables:

- Secure document sharing
    
- NDA-safe links
    
- Client-only resources
    

---

## 7. Profile theming per audience (pro feature)

Each audience can have:

- Custom theme
    
- Custom avatar / cover
    
- Custom headline
    

Example:

- Public: casual branding
    
- Recruiter: minimal, professional
    
- Client: brand-colored, logo-first
    

Implementation:

```ts
audience.theme_override?: ThemeConfig
```

---

## 8. Analytics per audience (privacy-respecting)

### What users see

- Views per audience
    
- Top links per audience
    
- Conversion actions (calendar clicks, downloads)
    

### What OneLink never does

- No fingerprinting
    
- No cross-profile tracking
    
- No selling analytics data
    

### Storage model

```ts
profile_views {
  audience_id,
  date,
  views,
  link_clicks
}
```

---

## 9. Database additions

### `audience_profiles`

```sql
CREATE TABLE audience_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  config JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `profile_share_tokens`

```sql
CREATE TABLE profile_share_tokens (
  id UUID PRIMARY KEY,
  audience_id UUID REFERENCES audience_profiles(id),
  token_hash TEXT,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE
);
```

---

## 10. UX principles (very important)

- **Zero duplication** — same links reused everywhere
    
- **Explicit context** — badge like “Viewing: Client Profile”
    
- **Fail-safe defaults** — if unsure → hide content
    
- **One-click revoke** — kill shared links instantly
    
- **Preview before sharing** — “View as recruiter”
    

---

## 11. Monetization alignment

### Free

- Public + Friends profiles
    
- 1 audience profile
    
- Basic analytics
    

### Pro

- Unlimited audience profiles
    
- Encrypted audience links
    
- Theme overrides
    
- Expiring & password-protected links
    

### Business / Enterprise

- Team-managed profiles
    
- Audit logs
    
- White-label profile URLs
    
- Access policies
    

---

## 12. Why this is powerful (strategically)

- Replaces:
    
    - Linktree
        
    - About.me
        
    - Google Drive sharing
        
    - CV links
        
- Encourages **repeat usage** (not “set once and forget”)
    
- Aligns perfectly with **privacy-first positioning**
    
- Creates a **clear upgrade path** to paid tiers
    
- Hard to copy without deep architectural changes
    

---

## 13. Simple summary

> OneLink becomes **not just a link-in-bio**, but a **controlled identity surface**.

One profile.  
Multiple audiences.  
Zero duplication.  
Strong privacy.

---

* ****
# FUTURE 3: Friend System for Privacy-Controlled Access
* **Core idea (one sentence) 
  *Friends are a cryptographically verified trust layer** that unlocks encrypted, friends-only links and profiles — without turning OneLink into a social network.

---

## 1. Why a Friend System exists (scope clarity)

### What it **is**

- A **permission system** for private content
    
- A **key-exchange mechanism** for encryption
    
- A **relationship gate** for friends-only links and profiles
    

### What it **is NOT**

- ❌ No public follower counts
    
- ❌ No feed, likes, comments
    
- ❌ No algorithmic discovery
    

> This clarity is important: OneLink is **privacy infrastructure**, not social media.

---

## 2. Mental model (simple & consistent)

Think of a friend connection as:

> **“We trust each other enough to exchange keys.”**

Once keys are exchanged:

- Friends-only links become visible
    
- Friends-only profile sections unlock
    
- Secure messaging is enabled
    
- Encrypted content can be decrypted locally
    

---

## 3. Friendship lifecycle (state machine)

```
none
  │
  ├── request_sent
  │        │
  │        ├── accepted → active_friend
  │        │
  │        └── rejected → none
  │
  └── blocked
```

### States explained

- **none** — no relationship
    
- **request_sent** — awaiting response
    
- **active_friend** — mutual trust + shared keys
    
- **blocked** — hard stop, no visibility or messaging
    

All state transitions are explicit and auditable.

---

## 4. Friend connection flow (step-by-step)

### A → B: Send request

1. User A searches by nickname or scans QR
    
2. Clicks **“Add Friend”**
    
3. Request is sent (no data shared yet)
    

### B: Accept

1. B receives notification
    
2. Accepts request
    
3. Key exchange happens **client-side**
    
4. Friendship becomes active
    

### Key moment

🔐 **Keys are exchanged only after acceptance**

No trust before consent.

---

## 5. Encryption & key exchange (core of the system)

### Keys involved

- Each user has:
    
    - RSA public key (stored on server)
        
    - RSA private key (stored locally)
        
- For friends-only content:
    
    - One AES key per link or section
        

---

### Friend acceptance key flow (simplified)

```text
A public key ──┐
               ├─► Shared AES key encrypted for both users
B public key ──┘
```

### Storage

```json
encrypted_blob: {
  content: "...",
  iv: "...",
  keys: {
    "friend_user_id": "encrypted_aes_key"
  }
}
```

- Server stores encrypted blobs
    
- Only friends can decrypt their own copy
    
- Server never sees plaintext
    

---

## 6. Link access rules (strict & deterministic)

### Access logic (server-side)

```ts
if (viewer === owner) allow
if (link.visibility === "public") allow
if (link.visibility === "friends" && isFriend(viewer, owner)) allow
else deny
```

### Client-side

- Only decrypt blobs if:
    
    - Server allowed access
        
    - Valid encrypted AES key exists
        
    - Private key is present
        

Fail-safe default: **hide content**.

---

## 7. Friend-only profile behavior

When a friend visits `/u/{nickname}`:

### They see

- Public content
    
- Friends-only links
    
- Friends-only sections
    
- Friends-only bio fields
    
- Optional “Friend Badge”
    

### They do NOT see

- Private content
    
- Draft links
    
- Analytics
    
- Other friends list
    

---

## 8. Friend permissions (future-proof)

Friend relationships can have **scopes**:

```ts
interface FriendPermissions {
  view_links: boolean
  view_profile_sections: boolean
  message: boolean
  download_files: boolean
}
```

Examples:

- Close friends → full access
    
- Work contacts → links only
    
- Family → links + files
    

This enables **tiers of trust** without complexity.

---

## 9. UX design principles (critical)

### Add friend UX

- Button appears on profile if:
    
    - Viewer is logged in
        
    - Not already friend
        
- Clear text:
    
    > “Friends can see your encrypted links.”
    

### Accept / reject UX

- Simple choices
    
- No pressure
    
- No public indication
    

### Viewing as friend

- Small label:
    
    > “Viewing as Friend”
    
- No visible friend list (privacy)
    

---

## 10. Notifications (minimal, respectful)

### Events that trigger notifications

- Friend request received
    
- Friend request accepted
    
- Friend removed (optional)
    
- Encrypted content shared
    

### Delivery

- In-app notification
    
- Optional email
    
- No push spam
    

---

## 11. Database model (clean & secure)

### `connections` table (core)

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY,
  requester_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending','accepted','rejected','blocked')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(requester_id, receiver_id)
);
```

### RLS policies

- Only requester & receiver can see row
    
- Only receiver can update `pending → accepted`
    
- Both can delete (unfriend)
    
- Block overrides everything
    

---

## 12. Revocation & safety (important edge cases)

### Removing a friend

- Relationship deleted
    
- Future access denied
    
- Optional:
    
    - Re-encrypt content to fully revoke
        
    - Lazy re-encryption on next edit
        

### Blocking

- Hard revoke
    
- Removes access
    
- Prevents future requests
    
- Hides profile entirely
    

---

## 13. Scaling the friend system safely

### Performance

- Cache friend lists per user
    
- Limit max friends per tier:
    
    - Free: 50
        
    - Pro: 500
        
    - Enterprise: unlimited
        

### Security

- Rate limit friend requests
    
- Prevent enumeration (nickname search throttling)
    
- Invisible blocking (blocked user sees “not found”)
    

---

## 14. Monetization alignment

### Free

- Friends system enabled
    
- Limited friends count
    
- Friends-only links
    

### Pro

- Unlimited friends
    
- Permission scopes
    
- Encrypted file sharing
    
- Friend analytics (aggregate)
    

### Business

- Team-based trust groups
    
- Directory-based connections
    
- Audit logs
    

---

## 15. Why this system is strategically strong

- Enables **true private sharing** (not fake privacy)
    
- Deeply integrated with encryption model
    
- Impossible to clone cheaply by competitors
    
- Naturally drives premium upgrades
    
- Scales from individual → enterprise
    

---

## 16. Simple summary

> OneLink friends are **keys, not followers**.

No feeds.  
No popularity.  
Just controlled trust.

---

# FUTURE 4: Real-Time Chat & Secure Friend Network
* **Core idea (simple & strong)
  *Chat is an extension of trust**, not a separate product.  
If two users are friends, they can exchange messages — encrypted by default — using the same cryptographic foundation that protects their links.

---

## 1. Scope & philosophy (important)

### What chat is for

- Private communication between trusted users
    
- Secure sharing of links, files, and short messages
    
- Lightweight coordination (clients, collaborators, communities)
    

### What chat is NOT

- ❌ A social feed
    
- ❌ A broadcast channel
    
- ❌ A replacement for WhatsApp/Telegram
    

> OneLink chat exists to **support private sharing**, not to compete with mass messengers.

---

## 2. Architecture overview

```
Browser (Client)
 ├─ Web Crypto API
 │   ├─ ECDH key exchange
 │   ├─ AES-GCM message encryption
 │   └─ Local key storage (IndexedDB)
 │
 ├─ Next.js App
 │   ├─ Chat UI
 │   ├─ Message composer
 │   └─ Realtime subscription
 │
 └─ Supabase Realtime (WebSocket)
     ├─ Message inserts
     ├─ Read receipts
     └─ Typing indicators (optional)

Supabase DB
 ├─ connections
 ├─ conversations
 ├─ messages (encrypted blobs)
 └─ group_members
```

---

## 3. Friend Network Handshake (ECDH)

### Why ECDH (instead of RSA)

- Faster
    
- Forward secrecy
    
- Perfect for session-based communication
    
- Industry standard (Signal, WhatsApp)
    

---

### Handshake flow (1-on-1)

1. **Friend acceptance**
    
    - Both users generate ECDH key pairs (Curve25519)
        
2. **Public key exchange**
    
    - Public keys stored in `connections.handshake_keys`
        
3. **Shared secret derivation**
    
    - Each side derives same shared secret
        
4. **Session key derivation**
    
    - HKDF(shared_secret → AES session key)
        

🔐 **Server never sees the shared secret**

---

### Result

- A **persistent secure channel**
    
- Can rotate keys per session or per conversation
    
- Used for:
    
    - Encrypted DMs
        
    - Friend-only content
        
    - Secure group messaging
        

---

## 4. Conversation model

### Conversation types

```ts
type ConversationType =
  | "direct"    // 1-on-1
  | "group"     // multiple friends
```

### Conversation entity

```ts
interface Conversation {
  id: string
  type: "direct" | "group"
  created_by: string
  is_encrypted: boolean
  created_at: string
}
```

---

## 5. Message model (encryption-aware)

```ts
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  ciphertext: string      // encrypted payload
  iv: string
  message_type: "text" | "link" | "file"
  read_by: string[]
  created_at: string
}
```

- Plaintext messages allowed **only if user disables encryption**
    
- Encrypted by default for friends
    

---

## 6. Message encryption flow (direct chat)

### Sending

```ts
1. Get conversation session key
2. Encrypt message with AES-GCM
3. Store ciphertext + iv
4. Insert into Supabase
```

### Receiving

```ts
1. Supabase Realtime delivers message
2. Client decrypts locally
3. UI renders plaintext
```

Server sees only:

- ciphertext
    
- metadata (timestamps, sender id)
    

---

## 7. Real-time delivery (Supabase Realtime)

### Subscriptions

```ts
supabase
  .channel(`chat:${conversationId}`)
  .on("postgres_changes", {
    event: "INSERT",
    table: "messages",
    filter: `conversation_id=eq.${conversationId}`
  })
  .subscribe()
```

### Real-time events

- New message
    
- Read receipt update
    
- Typing indicator (optional)
    

Latency target: **<150ms**

---

## 8. Unread messages & indicators

### Storage

- `last_read_at` per user per conversation
    
- Unread count = messages after last_read_at
    

### UI

- Badge on conversation list
    
- Bold last message preview
    
- “Seen” indicator (optional)
    

Privacy-respecting:

- No online status unless opted-in
    

---

## 9. Group messaging (community building)

### Group creation

- Only friends can be added
    
- Creator becomes admin
    
- Permissions:
    
    - Add/remove members
        
    - Enable/disable encryption
        
    - Set group expiry
        

### Group key management

- Group AES key
    
- Encrypted per member using ECDH shared secrets
    
- Key rotation when:
    
    - Member leaves
        
    - Admin forces rotation
        

---

### Group schema

```ts
group_members {
  group_id
  user_id
  role: "admin" | "member"
}
```

---

## 10. Community use cases (lightweight)

- Private creator communities
    
- Client collaboration rooms
    
- Study groups
    
- Temporary project chats
    

No discovery.  
No public groups.  
Invite-only.

---

## 11. File & link sharing in chat

### Link messages

- Can reference OneLink link blocks
    
- Visibility auto-checked before rendering
    

### File messages

- Stored encrypted in Vercel Blob
    
- Blob key encrypted per recipient
    
- Auto-expire option
    

---

## 12. Optional features (opt-in)

### Ephemeral messages

- Auto-delete after:
    
    - 5 min
        
    - 1 hour
        
    - 24 hours
        
- Metadata still logged for abuse prevention
    

### Message reactions

- Emoji reactions (stored separately)
    
- Not end-to-end encrypted (low sensitivity)
    

---

## 13. Database schema (core tables)

### conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  type TEXT,
  created_by UUID,
  is_encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
);
```

### messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  ciphertext TEXT,
  iv TEXT,
  message_type TEXT,
  created_at TIMESTAMPTZ
);
```

---

## 14. RLS & security rules

- Only conversation members can:
    
    - Read messages
        
    - Insert messages
        
- Enforced at DB level
    
- Encryption enforced at client level
    

Fail closed, not open.

---

## 15. Monetization alignment

### Free

- 1-on-1 encrypted chats
    
- Message history (limited)
    
- Basic groups (≤5 members)
    

### Pro

- Unlimited history
    
- Larger groups
    
- File sharing
    
- Ephemeral messages
    

### Business

- Team channels
    
- Audit logs
    
- Retention policies
    
- Compliance exports
    

---

## 16. Why this design wins

- Encryption-first (not bolt-on)
    
- Built on existing trust (friends)
    
- Scales naturally to communities
    
- No social noise
    
- Hard to replicate cheaply
    

---

## 17. Simple summary

> OneLink Chat is **private by default, real-time by design, and grounded in trust**.

Messages are keys.  
Friends are access.  
Communities are intentional.

---

# FUTURE 5: Group Profiles, Community Messaging & Events
* **Core idea (one sentence)**
> OneLink becomes a **coordination layer** for people, teams, and communities.
*  *A Group Profile is a shared identity with controlled access**, combining links, messaging, and events — without public feeds, algorithms, or noise.

---

## 1. What a Group Profile is (clear definition)

A **Group Profile** is:

- A **shared OneLink page**
    
- Managed by multiple admins
    
- With controlled visibility
    
- Linked directly to:
    
    - Group chat
        
    - Events calendar
        
    - Member roles
        

It works like a **digital headquarters**.

---

## 2. Use cases (real & practical)

### Organizations

- Startups
    
- NGOs
    
- DAOs
    
- Agencies
    
- Internal teams
    

### Communities

- Creator collectives
    
- Study groups
    
- Local clubs
    
- Private networks
    
- Event communities
    

### Temporary groups

- Hackathons
    
- Projects
    
- Conferences
    
- Courses
    

---

## 3. Group Profile URL model

### Public

```
/g/{group-name}
```

### Private / Invite-based

```
/g/{group-name}?t={invite_token}
```

Supports:

- SEO (if public)
    
- Encrypted content (if private)
    
- Audience-based visibility (advanced)
    

---

## 4. Group profile content structure

### Sections (modular)

- About
    
- Links
    
- Members (optional visibility)
    
- Events
    
- Resources
    
- Contact
    

Each section can be:

- Public
    
- Members-only
    
- Admin-only
    

---

## 5. Member roles & permissions (important)

```ts
type GroupRole =
  | "owner"
  | "admin"
  | "moderator"
  | "member"
  | "guest"
```

### Permission matrix (simplified)

|Action|Owner|Admin|Mod|Member|Guest|
|---|---|---|---|---|---|
|Edit profile|✓|✓|✗|✗|✗|
|Manage members|✓|✓|✗|✗|✗|
|Post links|✓|✓|✓|✗|✗|
|Create events|✓|✓|✓|✗|✗|
|Chat|✓|✓|✓|✓|✗|

Permissions are explicit and auditable.

---

## 6. Group messaging (integrated, not separate)

### Group chat features

- Encrypted by default
    
- Role-based posting
    
- Admin moderation tools
    
- Message history
    
- Pin important messages
    

### Admin controls

- Enable / disable encryption
    
- Mute members
    
- Lock chat
    
- Rotate group keys
    

Group chat uses the **same encryption foundation** as Friend DMs.

---

## 7. Group encryption model (clean & scalable)

### Key strategy

- One **Group AES key**
    
- Encrypted per member using ECDH
    
- Stored as encrypted blobs
    

### Membership changes

- New member → receives encrypted group key
    
- Member removed → group key rotated
    

No retroactive access.

---

## 8. Events Calendar integration (core feature)

### Why events matter

- Communities coordinate around time
    
- Links alone are static
    
- Events make OneLink _active_
    

---

## 9. Event object model

```ts
interface GroupEvent {
  id: string
  group_id: string
  title: string
  description: string
  start_at: string
  end_at: string
  location: "online" | "offline"
  visibility: "public" | "members" | "invite"
  meeting_link?: string
}
```

---

## 10. Event features

### Basic

- Event listing on group profile
    
- Timezone-aware display
    
- RSVP (Yes / Maybe / No)
    

### Advanced

- Private events
    
- Encrypted meeting links
    
- Limited capacity
    
- Calendar export (ICS)
    
- Event reminders
    

---

## 11. Event + chat synergy (very powerful)

Each event can have:

- Linked chat thread
    
- Pre-event discussion
    
- Live coordination
    
- Post-event follow-ups
    

Example:

```
Group → Event → Chat Thread
```

---

## 12. Invitations & onboarding

### Invite types

- Group invite
    
- Event-only invite
    
- Temporary guest access
    

### Invite controls

- Expiry date
    
- Max uses
    
- Role on join
    

UX goal: **one-click join**, no friction.

---

## 13. Group analytics (privacy-respecting)

Admins see:

- Member growth
    
- Link clicks
    
- Event RSVPs
    
- Chat activity (aggregate)
    

No individual behavior tracking.

---

## 14. Database schema (core)

### groups

```sql
groups (
  id UUID,
  name TEXT,
  slug TEXT UNIQUE,
  visibility TEXT,
  created_at TIMESTAMPTZ
)
```

### group_members

```sql
group_members (
  group_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ
)
```

### group_events

```sql
group_events (
  id UUID,
  group_id UUID,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  visibility TEXT
)
```

---

## 15. Monetization alignment

### Free

- 1 group
    
- Public group profile
    
- Basic chat
    
- 1 event/month
    

### Pro

- Multiple groups
    
- Private groups
    
- Encrypted resources
    
- Unlimited events
    
- Event reminders
    

### Business / Org

- Team SSO
    
- Admin audit logs
    
- Custom domains (`group.company.com`)
    
- Advanced permission rules
    

---

## 16. Strategic value

- Moves OneLink beyond individuals
    
- Creates **network effects without feeds**
    
- Anchors long-term engagement
    
- Differentiates from Linktree-style tools
    
- Natural upgrade path for teams & orgs
    

---

## 17. Simple summary

> Group Profiles turn OneLink into **shared identity + coordination infrastructure**.

Profiles = identity  
Chat = trust  
Events = action

---
