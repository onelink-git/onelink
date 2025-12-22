"use client"

import type { User } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Copy, Check, QrCode } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { QRCodeDialog } from "@/components/dashboard/qr-code-dialog"

interface ProfileCardProps {
  profile: User
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.nickname}`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="overflow-hidden">
        {profile.cover_photo && (
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500">
            <img src={profile.cover_photo || "/placeholder.svg"} alt="Cover" className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="text-2xl">{profile.display_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold">{profile.display_name}</h3>
                <p className="text-sm text-muted-foreground">@{profile.nickname}</p>
              </div>

              {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/profile">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeDialog open={qrOpen} onOpenChange={setQrOpen} profileUrl={profileUrl} displayName={profile.display_name} />
    </>
  )
}
