"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ConversationList } from "@/components/friends/conversation-list"
import { ChatWindow } from "@/components/friends/chat-window"
import { Loader2, MessageSquare, Shield } from "lucide-react"
import type { User } from "@/lib/types/database"

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/auth/login")
        return
      }

      setUser(firebaseUser)

      try {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (!profileDoc.exists()) {
          router.push("/auth/login")
          return
        }

        setProfile({ id: profileDoc.id, ...profileDoc.data() } as User)
      } catch (error) {
        console.error("Error fetching chat data:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getActiveChatName = () => {
    if (!selectedChat) return ""
    if (selectedChat.type === "group") return selectedChat.name || "Group Chat"
    return selectedChat.friendData?.displayName || "Direct Chat"
  }

  return (
    <DashboardShell user={profile}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sovereign Chat</h1>
            <p className="text-muted-foreground">End-to-end encrypted real-time messaging</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Vault Mode Active</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px,1fr]">
          <div className="space-y-4">
            <ConversationList 
              currentUserId={user.uid} 
              onSelectChat={(chat) => setSelectedChat(chat)} 
              selectedChatId={selectedChat?.id}
            />
          </div>

          <div className="hidden lg:block">
            {selectedChat ? (
              <ChatWindow 
                currentUserId={user.uid} 
                conversationId={selectedChat.id}
                friendId={selectedChat.type === "group" ? undefined : selectedChat.friendData?.id} 
                friendName={getActiveChatName()} 
                onClose={() => setSelectedChat(null)} 
              />
            ) : (
              <div className="flex h-[600px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground bg-muted/5 backdrop-blur-sm">
                <div className="rounded-full bg-muted p-6 mb-4 shadow-inner">
                  <MessageSquare className="h-10 w-10 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-foreground/80">Zero-Knowledge History</h3>
                <p className="text-sm max-w-xs mx-auto mt-2 leading-relaxed">
                  Select a conversation to decrypt your message history locally on this device.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Chat Overlay */}
          {selectedChat && (
            <div className="fixed inset-0 z-50 bg-background lg:hidden flex flex-col p-4">
              <ChatWindow 
                currentUserId={user.uid} 
                conversationId={selectedChat.id}
                friendId={selectedChat.type === "group" ? undefined : selectedChat.friendData?.id} 
                friendName={getActiveChatName()} 
                onClose={() => setSelectedChat(null)} 
              />
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
