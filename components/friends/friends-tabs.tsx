"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FriendsList } from "@/components/friends/friends-list"
import { SearchUsers } from "@/components/friends/search-users"
import { ChatWindow } from "@/components/friends/chat-window"
import { CreateGroupDialog } from "@/components/friends/create-group-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserPlus } from "lucide-react"

interface FriendsTabsProps {
  connections: any[]
  currentUserId: string
}

export function FriendsTabs({ connections, currentUserId }: FriendsTabsProps) {
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, conversationId: string } | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)

  // Separate connections by status
  const accepted = connections.filter((c) => c.status === "accepted")
  const pending = connections.filter((c) => c.status === "pending" && c.receiver_id === currentUserId)
  const sent = connections.filter((c) => c.status === "pending" && c.requester_id === currentUserId)

  const handleOpenChat = (friendId: string, friendName: string, conversationId: string) => {
    setActiveChat({ id: friendId, name: friendName, conversationId })
  }

  const handleGroupSuccess = (conversationId: string) => {
    setActiveChat({ id: "", name: "Secure Group", conversationId })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs defaultValue="all" className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/50 border-2">
                <TabsTrigger value="all">
                  Friends
                  {accepted.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {accepted.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Requests
                  {pending.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pending.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="search">Find Users</TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-full hidden sm:flex"
                onClick={() => setGroupDialogOpen(true)}
              >
                <Users className="h-4 w-4" />
                New Group
              </Button>
            </div>

            <TabsContent value="all" className="space-y-4">
              <FriendsList 
                connections={accepted} 
                currentUserId={currentUserId} 
                type="accepted" 
                onChat={(id, name) => {
                  const conn = accepted.find(c => c.requester_id === id || c.receiver_id === id)
                  if (conn) handleOpenChat(id, name, conn.id)
                }} 
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <FriendsList connections={pending} currentUserId={currentUserId} type="pending" />
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              <FriendsList connections={sent} currentUserId={currentUserId} type="sent" />
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <SearchUsers currentUserId={currentUserId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:block">
        {activeChat ? (
          <ChatWindow 
            currentUserId={currentUserId} 
            conversationId={activeChat.conversationId}
            friendId={activeChat.id || undefined} 
            friendName={activeChat.name} 
            onClose={() => setActiveChat(null)} 
          />
        ) : (
          <div className="flex h-[600px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground bg-muted/10 backdrop-blur-sm">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8" />
            </div>
            <p className="font-bold">Sovereign Encryption</p>
            <p className="text-sm">Establish a peer-to-peer connection to start chatting with your friends or groups.</p>
          </div>
        )}
      </div>

      {/* Mobile Chat Overlay */}
      {activeChat && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden flex items-center justify-center p-4">
          <div className="w-full h-full max-w-md">
            <ChatWindow 
              currentUserId={currentUserId} 
              conversationId={activeChat.conversationId}
              friendId={activeChat.id || undefined} 
              friendName={activeChat.name} 
              onClose={() => setActiveChat(null)} 
            />
          </div>
        </div>
      )}

      <CreateGroupDialog 
        open={groupDialogOpen} 
        onOpenChange={setGroupDialogOpen}
        friends={accepted}
        currentUserId={currentUserId}
        onSuccess={handleGroupSuccess}
      />
    </div>
  )
}