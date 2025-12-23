"use client"

import type React from "react"

import type { User } from "@/lib/types/database"
import { db, storage } from "@/lib/firebase/client"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X } from "lucide-react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  profile: User
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    bio: profile.bio || "",
    avatarUrl: profile.avatarUrl || "",
    coverPhoto: profile.coverPhoto || "",
  })

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: "avatar" | "cover") => {
    try {
      if (type === "avatar") {
        setIsUploadingAvatar(true)
      } else {
        setIsUploadingCover(true)
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large (max 5MB)")
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image")
      }

      const storageRef = ref(storage, `profiles/${profile.id}/${type}-${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      if (type === "avatar") {
        setFormData((prev) => ({ ...prev, avatarUrl: downloadURL }))
      } else {
        setFormData((prev) => ({ ...prev, coverPhoto: downloadURL }))
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      if (type === "avatar") {
        setIsUploadingAvatar(false)
      } else {
        setIsUploadingCover(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const userRef = doc(db, "users", profile.id)
      await updateDoc(userRef, {
        displayName: formData.displayName,
        bio: formData.bio || null,
        avatarUrl: formData.avatarUrl || null,
        coverPhoto: formData.coverPhoto || null,
        updatedAt: serverTimestamp()
      })

      router.refresh()
    } catch (err) {
      console.error("Profile update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cover Photo</Label>
            <div className="relative h-48 rounded-lg border bg-muted overflow-hidden">
              {formData.coverPhoto ? (
                <>
                  <img
                    src={formData.coverPhoto || "/placeholder.svg"}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, coverPhoto: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No cover photo</p>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, "cover")
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
            >
              {isUploadingCover ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Cover Photo
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatarUrl || undefined} alt={formData.displayName} />
              <AvatarFallback className="text-2xl">{formData.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <div className="flex gap-2">
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "avatar")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter a URL or upload an image</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={profile.nickname} disabled />
            <p className="text-xs text-muted-foreground">Your nickname cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length} / 500 characters</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
