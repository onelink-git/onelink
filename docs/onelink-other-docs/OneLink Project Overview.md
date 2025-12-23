## Project Overview

The project is a **privacy-first social profile and communication platform** that allows users to create a public-facing profile using only a nickname, optionally link social/contact information, and communicate through a built-in chat system.
The platform is designed to be **secure, minimal, ad-free, and scalable**, with a strong emphasis on user data ownership and transparency.

The system is built as a **modern web application** using Next.js with Firebase as the backend infrastructure, supporting authentication, real-time data updates, and secure server-side operations.

---

## Core Features

### User Identity & Profiles

* Nickname-based user profiles (no mandatory email or phone)
* Public profile pages with configurable visibility
* Profile view tracking
* Profile data export (GDPR-style user data ownership)

### Authentication & Security

* Firebase Authentication integration
* Server-side token verification using Firebase Admin SDK
* Secure API routes with validated access control
* No plaintext sensitive data stored

### Social & Communication

* Real-time chat system powered by Firestore
* Message pagination and history loading
* User-to-user connections (friends/contacts)
* Secure, scalable messaging architecture

### Data Management

* Firestore-based document structure
* Structured collections for:

  * Users
  * Profiles
  * Messages
  * Connections
  * Profile views
* Designed migration path from Supabase to Firebase

### Privacy & Transparency

* Minimal required user data
* Explicit user data export functionality
* Clear separation between public and private data
* No ads, no tracking pixels, no hidden analytics

---

## Technology Stack

### Frontend

* **Next.js (App Router)**
* React (Server & Client Components)
* TypeScript
* Tailwind CSS (UI layer)

### Backend / Infrastructure

* **Firebase**

  * Firebase Authentication
  * Firestore (real-time NoSQL database)
  * Firebase Admin SDK (server-side security)
* API Routes (Next.js)

### Data & Migration

* Firestore as the primary database
* CSV-based migration pipeline
* Custom Node.js scripts for:

  * Exporting data
  * Importing and transforming records
  * Batch processing for scalability

### Hosting & Deployment

* Firebase Hosting (planned/active)
* Environment-based configuration (client vs server)

---

## Project Status & Future Direction

### Current Status

* Core architecture implemented
* Firebase fully integrated (client + admin)
* Authentication and authorization working
* Real-time chat functional
* Profile system operational
* Data migration strategy completed
* Export/import tooling ready
* Security-first server-side logic in place

### Next Planned Steps

* Final production data migration
* Firestore security rules hardening
* UI/UX refinement and polishing
* Load testing and scalability validation
* Public beta launch
* Optional mobile-friendly optimizations

---

## Building and Running the Project

### Local Development

* Node.js environment
* Firebase project configured
* Environment variables set for:

  * Firebase client
  * Firebase Admin credentials
* Development server via Next.js

### Data Migration

* Export legacy data to CSV
* Review and validate exported data
* Import into Firestore using batch scripts
* Verify integrity and relationships post-import

### Deployment

* Firebase Hosting for frontend
* Secure environment variables configured
* Admin SDK keys stored server-side only

---

## Safety and Verification

### Security Measures

* Server-side token verification (no trust in client)
* Firebase Admin SDK used for privileged operations
* Separation of client and server Firebase configs
* No exposure of service account credentials

### Data Integrity

* Batch writes to prevent partial imports
* Schema mapping defined before migration
* Validation during import process

### User Protection

* Minimal data collection by design
* User-initiated data export
* Clear boundaries between public/private data
* No third-party tracking or monetization hooks
