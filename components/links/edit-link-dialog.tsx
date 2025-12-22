"use client"

import type React from "react"

import type { LinkBlock, LinkBlockType, VisibilityLevel } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth, db } from "@/lib/firebase/client"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { Loader2, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { encryptForFriend, decryptFromFriend, getPrivateKey } from "@/lib/crypto"

interface EditLinkDialogProps {
  link: LinkBlock
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (link: LinkBlock) => void
}

export function EditLinkDialog({ link, open, onOpenChange, onUpdate }: EditLinkDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: link.type,
    title: link.title,
    url: link.url || "",
    visibility: link.visibility,
    icon: link.icon || "",
  })

  useEffect(() => {
    async function prepareData() {
      let initialUrl = link.url || ""
      
      if (link.encrypted_blob && !link.url && open) {
        setIsDecrypting(true)
        try {
          const user = auth.currentUser
          if (user) {
            const privateKey = getPrivateKey(user.uid)
            if (privateKey) {
              const encryptedData = JSON.parse(link.encrypted_blob)
              initialUrl = await decryptFromFriend(encryptedData, privateKey)
            }
          }
        } catch (err) {
          console.error("Failed to decrypt for edit:", err)
        } finally {
          setIsDecrypting(false)
        }
      }

      setFormData({
        type: link.type,
        title: link.title,
        url: initialUrl,
        visibility: link.visibility,
        icon: link.icon || "",
      })
    }

    prepareData()
  }, [link, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")

      let encryptedBlob = null
      let finalUrl = formData.url

      if (formData.visibility === "private" || formData.visibility === "friends") {
        const profileDoc = await getDoc(doc(db, "users", user.uid))
        const profile = profileDoc.data()

        if (!profile?.public_key) {
          throw new Error("Security keys required for private links.")
        }

        const encrypted = await encryptForFriend(formData.url, profile.public_key)
        encryptedBlob = JSON.stringify(encrypted)
        finalUrl = ""
      }

      const linkRef = doc(db, "link_blocks", link.id)
      const updateData = {
        type: formData.type,
        title: formData.title,
        url: finalUrl || null,
        visibility: formData.visibility,
        icon: formData.icon || null,
        encrypted_blob: encryptedBlob,
        updated_at: new Date().toISOString()
      }
      
      await updateDoc(linkRef, updateData)

      onUpdate({ ...link, ...updateData })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update your link block details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: LinkBlockType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: VisibilityLevel) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
