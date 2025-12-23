"use client"

import type { User, LinkBlock } from "@/lib/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Lock, Users, Loader2 } from "lucide-react"
import { auth, db } from "@/lib/firebase/client"
import { doc, updateDoc, increment } from "firebase/firestore"
import { useState, useEffect } from "react"
import { BentoGrid } from "./bento-grid"


interface PublicProfileProps {
  profile: User
  links: LinkBlock[]
  isOwner: boolean
}

export function PublicProfile({ profile, links, isOwner }: PublicProfileProps) {
  const theme = profile.themeConfig || {}
  const hasTheme = Object.keys(theme).length > 0

  const containerStyle = hasTheme
    ? {
        backgroundColor: theme.background || undefined,
        color: theme.textColor || undefined,
      }
    : {}

  return (
    <div className="min-h-screen bg-background" style={containerStyle}>
      {profile.coverPhoto && (
        <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          <img src={profile.coverPhoto || "/placeholder.svg"} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
              <AvatarFallback className="text-4xl font-bold">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h1 className="text-balance text-5xl font-extrabold tracking-tight">{profile.displayName}</h1>
              <p className="text-lg text-muted-foreground font-medium">@{profile.nickname}</p>
              {profile.bio && <p className="mx-auto max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground/80">{profile.bio}</p>}
            </div>

            {isOwner && (
              <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
                <a href="/dashboard">Edit Profile</a>
              </Button>
            )}
          </div>

          <BentoGrid links={links} isOwner={isOwner} />

          {links.length === 0 && (
            <Card className="border-2 border-dashed rounded-3xl">
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="rounded-full bg-muted p-6">
                  <ExternalLink className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">No links yet</h3>
                <p className="mt-2 text-muted-foreground">
                  {isOwner ? "Add your first link to get started" : "This profile has no links to display"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
