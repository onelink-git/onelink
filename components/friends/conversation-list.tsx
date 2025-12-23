"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MessageSquare, Users } from "lucide-react"

interface Conversation {
  id: string
  type?: "direct" | "group"
  name?: string
  participantIds: string[]
  lastMessage: string
  updatedAt: any
  friendData?: {
    id: string
    displayName: string
    nickname: string
    avatarUrl: string
  }
}

interface ConversationListProps {
  currentUserId: string
  onSelectChat: (chat: Conversation) => void
  selectedChatId?: string
}

export function ConversationList({ currentUserId, onSelectChat, selectedChatId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUserId) return

    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", currentUserId)
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convsData = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data() as Conversation
        
        if (data.type === "group") {
          return { id: d.id, ...data }
        }

        const friendId = data.participantIds.find(id => id !== currentUserId)
        let friendData = null
        if (friendId) {
          const friendDoc = await getDoc(doc(db, "users", friendId))
          if (friendDoc.exists()) {
            const fd = friendDoc.data()
            friendData = {
              id: friendId,
              displayName: fd.displayName,
              nickname: fd.nickname,
              avatarUrl: fd.avatarUrl
            }
          }
        }

        return {
          id: d.id,
          ...data,
          friendData: friendData || undefined
        }
      }))
      
      const sortedConvs = convsData.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0
        const timeB = b.updatedAt?.toMillis?.() || 0
        return timeB - timeA
      })

      setConversations(sortedConvs)
      setLoading(false)
    }, (error) => {
      console.error("Conversations listener error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUserId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageSquare className="h-6 w-6" />
        </div>
        <p className="font-medium">No active chats</p>
        <p className="text-sm">Start a conversation from your Friends list</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isGroup = conv.type === "group"
        const displayName = isGroup ? conv.name : (conv.friendData?.displayName || 'Unknown User')
        const avatarUrl = isGroup ? undefined : conv.friendData?.avatarUrl

        return (
          <Card 
            key={conv.id} 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedChatId === conv.id ? 'bg-muted border-primary/50' : 'border-transparent'}`}
            onClick={() => onSelectChat(conv)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-12 w-12 border">
                {isGroup ? (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{displayName}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage || 'No messages yet'}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}