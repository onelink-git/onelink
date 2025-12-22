"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Check } from "lucide-react"
import { db } from "@/lib/firebase/client"
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SearchUsersProps {
  currentUserId: string
}

export function SearchUsers({ currentUserId }: SearchUsersProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const usersRef = collection(db, "users")
      const q = query(
        usersRef,
        where("nickname", ">=", searchQuery),
        where("nickname", "<=", searchQuery + "\uf8ff"),
        limit(10)
      )
      
      const snapshot = await getDocs(q)
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.id !== currentUserId)

      const usersWithStatus = await Promise.all(
        data.map(async (user: any) => {
          const connRef = collection(db, "connections")
          const q1 = query(
            connRef,
            where("requester_id", "==", currentUserId),
            where("receiver_id", "==", user.id)
          )
          const q2 = query(
            connRef,
            where("requester_id", "==", user.id),
            where("receiver_id", "==", currentUserId)
          )
          
          const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])
          const connection = !s1.empty ? s1.docs[0].data() : (!s2.empty ? s2.docs[0].data() : null)

          return {
            ...user,
            connectionStatus: connection?.status || null,
          }
        }),
      )

      setResults(usersWithStatus)
    } catch (error) {
      console.error("Search error:", error)
    }
    setIsSearching(false)
  }

  const handleConnect = async (userId: string) => {
    setLoadingUserId(userId)
    try {
      await addDoc(collection(db, "connections"), {
        requester_id: currentUserId,
        receiver_id: userId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      setResults(results.map((user) => (user.id === userId ? { ...user, connectionStatus: "pending" } : user)))
      router.refresh()
    } catch (error) {
      console.error("Friend request error:", error)
    }
    setLoadingUserId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by nickname or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                  <AvatarFallback>{user.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{user.display_name}</h3>
                  <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                  {user.bio && <p className="text-sm text-muted-foreground truncate mt-1">{user.bio}</p>}
                </div>

                <div>
                  {user.connectionStatus === "accepted" && (
                    <Badge variant="secondary">
                      <Check className="mr-1 h-3 w-3" />
                      Friend
                    </Badge>
                  )}
                  {user.connectionStatus === "pending" && <Badge variant="outline">Request Sent</Badge>}
                  {!user.connectionStatus && (
                    <Button size="sm" onClick={() => handleConnect(user.id)} disabled={loadingUserId === user.id}>
                      <UserPlus className="mr-1 h-4 w-4" />
                      {loadingUserId === user.id ? "Adding..." : "Add Friend"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && searchQuery && !isSearching && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm text-muted-foreground">Try searching with a different nickname or name</p>
        </div>
      )}
    </div>
  )
}