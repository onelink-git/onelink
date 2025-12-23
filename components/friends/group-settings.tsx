"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, UserMinus, Shield } from "lucide-react"

interface GroupSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  currentUserId: string
}

export function GroupSettings({ open, onOpenChange, conversationId, currentUserId }: GroupSettingsProps) {
  const [participants, setParticipants] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetchDetails() {
      setIsLoading(true)
      try {
        const convDoc = await getDoc(doc(db, "conversations", conversationId))
        const data = convDoc.data()
        if (!data) return

        setIsAdmin(data.adminIds?.includes(currentUserId))

        const userDetails = await Promise.all(data.participantIds.map(async (uid: string) => {
          const userDoc = await getDoc(doc(db, "users", uid))
          return { id: uid, ...userDoc.data() }
        }))

        setParticipants(userDetails)
      } catch (error) {
        console.error("Error fetching group details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [open, conversationId, currentUserId])

  const handleRemoveMember = async (userId: string) => {
    if (!isAdmin || userId === currentUserId) return

    setIsRemoving(userId)
    try {
      const convRef = doc(db, "conversations", conversationId)
      await updateDoc(convRef, {
        participantIds: arrayRemove(userId),
        // Remove their key too
        [`keys.${userId}`]: null
      })
      setParticipants(prev => prev.filter(p => p.id !== userId))
    } catch (error) {
      console.error("Error removing member:", error)
    } finally {
      setIsRemoving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>Manage participants and security for this group.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider">Participants ({participants.length})</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              participants.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-transparent hover:border-muted-foreground/10 transition-all">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold">{user.displayName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">@{user.nickname}</p>
                    </div>
                  </div>
                  
                  {isAdmin && user.id !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => handleRemoveMember(user.id)}
                      disabled={!!isRemoving}
                    >
                      {isRemoving === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  {user.id === currentUserId && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">You</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
