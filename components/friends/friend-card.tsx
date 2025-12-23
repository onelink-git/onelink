"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, Trash2, ExternalLink, MessageCircle } from "lucide-react"
import { db } from "@/lib/firebase/client"
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

interface FriendCardProps {
  connection: any
  currentUserId: string
  type: "accepted" | "pending" | "sent"
  onChat?: (friendId: string, friendName: string) => void
}

export function FriendCard({ connection, currentUserId, type, onChat }: FriendCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Determine which user to display
  const otherUser = connection.requester_id === currentUserId ? connection.receiver : connection.requester

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const connRef = doc(db, "connections", connection.id)
      await updateDoc(connRef, { 
        status: "accepted",
        updatedAt: serverTimestamp()
      })
      router.refresh()
    } catch (error) {
      console.error("Accept error:", error)
    }
    setIsLoading(false)
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const connRef = doc(db, "connections", connection.id)
      await updateDoc(connRef, { 
        status: "rejected",
        updatedAt: serverTimestamp()
      })
      router.refresh()
    } catch (error) {
      console.error("Reject error:", error)
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const connRef = doc(db, "connections", connection.id)
      await deleteDoc(connRef)
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser.avatarUrl || undefined} alt={otherUser.displayName} />
          <AvatarFallback>{otherUser.displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{otherUser.displayName}</h3>
            {type === "accepted" && (
              <Badge variant="secondary" className="text-xs">
                Friend
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{otherUser.nickname}</p>
        </div>

        <div className="flex items-center gap-2">
          {type === "pending" && (
            <>
              <Button size="sm" onClick={handleAccept} disabled={isLoading}>
                <Check className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={isLoading}>
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </>
          )}

          {type === "sent" && (
            <Button size="sm" variant="outline" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          )}

          {type === "accepted" && (
            <>
              {onChat && (
                <Button size="sm" variant="secondary" onClick={() => onChat(otherUser.id, otherUser.displayName)}>
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Chat
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href={`/u/${otherUser.nickname}`}>
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}