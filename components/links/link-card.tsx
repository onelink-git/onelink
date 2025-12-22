"use client"

import type { LinkBlock } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GripVertical, MoreVertical, Edit, Trash2, Eye, EyeOff, ExternalLink, Lock } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { auth, db } from "@/lib/firebase/client"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useState, useEffect } from "react"
import { EditLinkDialog } from "@/components/links/edit-link-dialog"
import { decryptFromFriend, getPrivateKey } from "@/lib/crypto"

interface LinkCardProps {
  link: LinkBlock
  onDelete: (linkId: string) => void
  onUpdate: (link: LinkBlock) => void
}

export function LinkCard({ link, onDelete, onUpdate }: LinkCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    async function decrypt() {
      if (link.encrypted_blob && !link.url) {
        setIsDecrypting(true)
        try {
          const user = auth.currentUser
          if (!user) return

          const privateKey = getPrivateKey(user.uid)
          if (!privateKey) return

          const encryptedData = JSON.parse(link.encrypted_blob)
          const decrypted = await decryptFromFriend(encryptedData, privateKey)
          setDecryptedUrl(decrypted)
        } catch (err) {
          console.error("Decryption failed:", err)
        } finally {
          setIsDecrypting(false)
        }
      }
    }
    decrypt()
  }, [link])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggleActive = async () => {
    const newIsActive = !link.is_active
    try {
      const linkRef = doc(db, "link_blocks", link.id)
      await updateDoc(linkRef, { is_active: newIsActive })
      onUpdate({ ...link, is_active: newIsActive })
    } catch (error) {
      console.error("Error toggling active:", error)
    }
  }

  const handleDelete = async () => {
    try {
      const linkRef = doc(db, "link_blocks", link.id)
      await deleteDoc(linkRef)
      onDelete(link.id)
    } catch (error) {
      console.error("Error deleting link:", error)
    }
  }

  const visibilityColors = {
    public: "default",
    friends: "secondary",
    private: "outline",
  } as const

  return (
    <>
      <Card ref={setNodeRef} style={style} className={link.is_active ? "" : "opacity-50"}>
        <CardContent className="flex items-center gap-4 p-4">
          <button className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{link.title}</h3>
              <Badge variant={visibilityColors[link.visibility]} className="text-xs">
                {link.visibility}
              </Badge>
              {link.encrypted_blob && <Lock className="h-3 w-3 text-primary" />}
              {!link.is_active && (
                <Badge variant="outline" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {(link.url || decryptedUrl) && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {decryptedUrl || link.url}
              </p>
            )}
            {isDecrypting && <p className="text-xs text-muted-foreground animate-pulse">Decrypting...</p>}
            <p className="text-xs text-muted-foreground mt-1">{link.click_count} clicks</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {link.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {link.is_active ? "Hide" : "Show"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <EditLinkDialog link={link} open={isEditOpen} onOpenChange={setIsEditOpen} onUpdate={onUpdate} />
    </>
  )
}
