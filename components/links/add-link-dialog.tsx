"use client"

import type React from "react"

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
import { auth, db, storage } from "@/lib/firebase/client"
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2, Shield, Upload } from "lucide-react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { LinkBlockType, VisibilityLevel } from "@/lib/types/database"
import { TemplateSelector } from "@/components/links/template-selector"
import { encryptForFriend, encryptFile, exportAESKey, arrayBufferToBase64 } from "@/lib/crypto"

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddLinkDialog({ open, onOpenChange }: AddLinkDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    type: "link" as LinkBlockType,
    title: "",
    url: "",
    visibility: "public" as VisibilityLevel,
    icon: "",
    template: "classic",
    size: "sm" as "sm" | "md" | "lg" | "xl",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")

      // 1. Get current max position (simplified to avoid composite index)
      const q = query(
        collection(db, "link_blocks"),
        where("user_id", "==", user.uid)
      )
      const snapshot = await getDocs(q)
      const maxPos = snapshot.docs.reduce((max, d) => Math.max(max, d.data().position || 0), -1)
      const newPosition = maxPos + 1

      let encryptedBlob = null
      let finalUrl = formData.url
      const blockId = crypto.randomUUID() // Pre-generate block ID

      // 2. Handle File Upload & Encryption
      if (formData.type === "file" && file) {
        const { encryptedBlob: fileBlob, iv, aesKey } = await encryptFile(file)
        const fileId = crypto.randomUUID()
        const fileRef = ref(storage, `assets/${user.uid}/${fileId}`)
        
        await uploadBytes(fileRef, fileBlob, {
          customMetadata: {
            blockId: blockId,
            ownerId: user.uid
          }
        })
        const downloadUrl = await getDownloadURL(fileRef)
        const exportedKey = await exportAESKey(aesKey)
        
        const profileDoc = await getDoc(doc(db, "users", user.uid))
        const profile = profileDoc.data()
        if (!profile?.public_key) throw new Error("Security keys required to secure assets.")
        
        const encryptedKeyData = await encryptForFriend(exportedKey, profile.public_key)
        encryptedBlob = JSON.stringify({
          ...encryptedKeyData,
          iv: arrayBufferToBase64(iv),
          file_url: downloadUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
        finalUrl = "" 
      } else if (formData.visibility === "private" || formData.visibility === "friends") {
        // 3. Handle Private/Friends Link Encryption
        const profileDoc = await getDoc(doc(db, "users", user.uid))
        const profile = profileDoc.data()

        if (!profile?.public_key) {
          throw new Error("Security keys required for private content.")
        }

        const encrypted = await encryptForFriend(formData.url, profile.public_key)
        encryptedBlob = JSON.stringify(encrypted)
        finalUrl = "" 
      }

      // 4. Save Block to Firestore
      await setDoc(doc(db, "link_blocks", blockId), {
        user_id: user.uid,
        type: formData.type,
        title: formData.title,
        url: finalUrl || null,
        visibility: formData.visibility,
        icon: formData.icon || null,
        template: formData.template,
        size: formData.size,
        position: newPosition,
        encrypted_blob: encryptedBlob,
        is_active: true,
        click_count: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setFormData({
        type: "link",
        title: "",
        url: "",
        visibility: "public",
        icon: "",
        template: "classic",
        size: "sm",
      })
      setFile(null)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error("Add link error:", err)
      setError(err instanceof Error ? err.message : "Failed to create link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>Create a new link block for your profile</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
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
                <Label htmlFor="size">Size (Bento)</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: any) => setFormData({ ...formData, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small (1x1)</SelectItem>
                    <SelectItem value="md">Medium (2x1)</SelectItem>
                    <SelectItem value="lg">Large (2x2)</SelectItem>
                    <SelectItem value="xl">Wide (Full)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="My awesome link"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {formData.type === "file" ? (
              <div className="space-y-2">
                <Label htmlFor="file">Secure Asset (Encrypted P2P)</Label>
                <div 
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{file ? file.name : "Click to select file"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Files are encrypted on your device before upload.
                  </p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
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
              <p className="text-xs text-muted-foreground">
                {formData.visibility === "public" && "Visible to everyone"}
                {formData.visibility === "friends" && "Only visible to your friends"}
                {formData.visibility === "private" && "Only visible to you"}
              </p>
            </div>

            <TemplateSelector
              selectedTemplate={formData.template}
              onSelectTemplate={(templateId) => setFormData({ ...formData, template: templateId })}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
