// Database type definitions for OneLink

import { Timestamp } from "firebase/firestore"

export interface User {
  id: string
  email: string
  nickname: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  coverPhoto?: string
  public_key: string | null
  themeConfig?: Record<string, any>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Conversation {
  id: string
  participantIds: string[]
  encryptedKeys: Record<string, string> // uid -> encrypted AES key
  lastMessage?: string
  updatedAt: Timestamp
  created_at?: string // Legacy support
}

export interface Message {
  id: string
  senderId: string
  content: string // The ciphertext
  iv: string // Top-level IV for security rules
  type: "text" | "image" | "file"
  createdAt: Timestamp
  expiresAt?: Timestamp | null
}

export interface Presence {
  isTyping: boolean
  displayName: string
  lastUpdated: Timestamp
}

export type VisibilityLevel = "public" | "friends" | "private"
export type LinkBlockType = "link" | "social" | "contact" | "file" | "note"
export type ConnectionStatus = "pending" | "accepted" | "rejected" | "blocked"
