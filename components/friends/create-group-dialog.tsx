"use client"

import { useState } from "react"
import { db } from "@/lib/firebase/client"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Users } from "lucide-react"
import { generateAESKey, exportAESKey, encryptKeyWithPublicKey } from "@/lib/crypto"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: any[]
  currentUserId: string
  onSuccess: (conversationId: string) => void
}

export function CreateGroupDialog({ open, onOpenChange, friends, currentUserId, onSuccess }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedFriends, setSelectedSelectedFriends] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleToggleFriend = (friendId: string) => {
    setSelectedSelectedFriends(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length < 1) return

    setIsCreating(true)
    try {
      const participantIds = [currentUserId, ...selectedFriends]
      
      // 1. Generate Group AES Key
      const aesKey = await generateAESKey()
      const exportedAES = await exportAESKey(aesKey)
      
      // 2. Fetch all participants' public keys
      const keys: { [userId: string]: string } = {}
      
      await Promise.all(participantIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, "users", uid))
        const pubKey = userDoc.data()?.public_key
        if (pubKey) {
          const encryptedKey = await encryptKeyWithPublicKey(aesKey, pubKey)
          keys[uid] = JSON.stringify(encryptedKey)
        }
      }))

      // 3. Create Conversation
      const newGroupRef = await addDoc(collection(db, "conversations"), {
        type: "group",
        name: groupName,
        participantIds,
        adminIds: [currentUserId],
        keys,
        lastMessage: "Group created",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      setGroupName("")
      setSelectedSelectedFriends([])
      onSuccess(newGroupRef.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group. Ensure all members have security keys set up.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>Start a secure end-to-end encrypted group conversation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input 
              id="group-name" 
              placeholder="Project X Team" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Select Friends ({selectedFriends.length})</Label>
            <div className="space-y-2">
              {friends.map((friend) => {
                const data = friend.requester_id === currentUserId ? friend.receiver : friend.requester
                return (
                  <div key={friend.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      id={`friend-${data.id}`}
                      checked={selectedFriends.includes(data.id)}
                      onCheckedChange={() => handleToggleFriend(data.id)}
                    />
                    <Label htmlFor={`friend-${data.id}`} className="flex flex-1 items-center gap-3 cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={data.avatar_url} />
                        <AvatarFallback>{data.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{data.display_name}</span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating || !groupName.trim() || selectedFriends.length < 1}
          >
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
