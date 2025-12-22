// Database type definitions for OneLink

export interface User {
  id: string
  email: string
  nickname: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_photo: string | null
  public_key: string | null
  theme_config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface LinkBlock {
  id: string
  user_id: string
  type: "link" | "social" | "contact" | "file" | "note"
  title: string
  url: string | null
  icon: string | null
  visibility: "public" | "friends" | "private"
  encrypted_blob: string | null
  position: number
  size: "sm" | "md" | "lg" | "xl" // Bento sizes
  style_config: Record<string, any> // Custom styles for individual blocks
  is_active: boolean
  click_count: number
  created_at: string
  updated_at: string
}

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: "pending" | "accepted" | "rejected" | "blocked"
  shared_key: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  connection_id: string
  sender_id: string
  receiver_id: string
  content: string
  encrypted: boolean
  read: boolean
  created_at: string
  updated_at: string
}

export type VisibilityLevel = "public" | "friends" | "private"
export type LinkBlockType = "link" | "social" | "contact" | "file" | "note"
export type ConnectionStatus = "pending" | "accepted" | "rejected" | "blocked"
