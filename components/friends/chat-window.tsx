"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useChat } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Send, X, Loader2, Flame, Shield, Info, Image as ImageIcon, File, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { auth, db } from "@/lib/firebase/client"
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, collection, getDocs } from "firebase/firestore"
import { generateAESKey, exportAESKey, encryptKeyWithPublicKey, getPrivateKey } from "@/lib/crypto"
import { GroupSettings } from "@/components/friends/group-settings"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChatWindowProps {
  currentUserId: string
  conversationId: string
  friendId?: string // Null for group chats
  friendName: string
  onClose: () => void
}

export function ChatWindow({ currentUserId, conversationId, friendId, friendName, onClose }: ChatWindowProps) {
  const [inputText, setInputText] = useState("")
  const [burnMode, setBurnMode] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { messages, isLoading, typingUsers, sendMessage, setTyping, hasKey, keyError } = useChat({ conversationId, currentUserId })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleDeleteChat = async () => {
    setIsDeleting(true)
    try {
      // 1. Delete all messages in the subcollection
      const messagesSnapshot = await getDocs(collection(db, "conversations", conversationId, "messages"))
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      
      // 2. Delete presence data
      const presenceSnapshot = await getDocs(collection(db, "conversations", conversationId, "presence"))
      const presencePromises = presenceSnapshot.docs.map(doc => deleteDoc(doc.ref))
      
      await Promise.all([...deletePromises, ...presencePromises])

      // 3. Delete the main conversation document
      await deleteDoc(doc(db, "conversations", conversationId))
      
      onClose()
    } catch (e: any) {
      console.error("Delete failed:", e)
      alert("Failed to delete chat: " + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const text = inputText
    setInputText("")
    
    // Burn after 30 seconds if enabled
    await sendMessage(text, "text", burnMode ? 30 : undefined)
    await setTyping(false, "")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (e.target.value.length > 0) {
      setTyping(true, auth.currentUser?.displayName || "Anonymous")
    } else {
      setTyping(false, "")
    }
  }

  // Handle Initial Handshake / Key Sharing if missing
  const handleInitializeKey = async () => {
    if (!friendId) return // Groups handled differently
    
    setIsInitializing(true)
    try {
      const aesKey = await generateAESKey()
      const exportedAES = await exportAESKey(aesKey)
      
      // Get both users' public keys
      const [myDoc, friendDoc] = await Promise.all([
        getDoc(doc(db, "users", currentUserId)),
        getDoc(doc(db, "users", friendId))
      ])
      
      const myPub = myDoc.data()?.public_key
      const friendPub = friendDoc.data()?.public_key
      
      if (!myPub || !friendPub) throw new Error("Both users must have security keys configured.")
      
      // Encrypt for both
      const myEncrypted = await encryptKeyWithPublicKey(aesKey, myPub)
      const friendEncrypted = await encryptKeyWithPublicKey(aesKey, friendPub)
      
      await setDoc(doc(db, "conversations", conversationId), {
        participantIds: [currentUserId, friendId],
        keys: {
          [currentUserId]: myEncrypted,
          [friendId]: friendEncrypted
        },
        updatedAt: serverTimestamp()
      }, { merge: true })
      
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] shadow-2xl border-2 bg-background/60 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback>{friendName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {typingUsers.length > 0 && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          <div>
            <CardTitle className="text-base font-bold">{friendName}</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">End-to-End Encrypted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all encrypted messages for both participants. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} className="rounded-full hover:bg-primary/10">
            <Info className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {!hasKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2 max-w-[250px]">
              <p className="font-bold">Secure Session Required</p>
              <p className="text-sm text-muted-foreground">
                {keyError || "Establish a peer-to-peer encryption tunnel to start chatting."}
              </p>
            </div>
            {keyError?.includes("recover") ? (
              <Button onClick={() => window.location.href = "/dashboard/profile"}>
                Go to Settings
              </Button>
            ) : (
              <Button onClick={handleInitializeKey} disabled={isInitializing || !!keyError}>
                {isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Secure Connection"}
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId
              const showAvatar = index === 0 || messages[index-1].senderId !== msg.senderId
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 mb-2`}
                >
                  {!isMe && showAvatar && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{friendName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-background/80 border-2 border-muted rounded-tl-none backdrop-blur-md"
                      }`}
                    >
                      {msg.decryptedContent}
                      {msg.expiresAt && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
                          <Flame className="h-3 w-3" />
                          <span>Expiring soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t bg-muted/20 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="burn-mode" 
                checked={burnMode} 
                onCheckedChange={setBurnMode} 
                className="data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="burn-mode" className="text-[10px] flex items-center gap-1 font-bold uppercase tracking-tighter">
                <Flame className={`h-3.5 w-3.5 ${burnMode ? 'text-orange-500' : 'text-muted-foreground'}`} />
                Burn After Reading
              </Label>
            </div>
          </div>
          {typingUsers.length > 0 && (
            <span className="text-[10px] text-primary font-bold italic animate-pulse">
              {typingUsers[0]} is typing...
            </span>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <Input
            placeholder={hasKey ? "Sovereign Message..." : "Connection locked"}
            value={inputText}
            onChange={handleInputChange}
            disabled={!hasKey}
            className="rounded-full bg-background/50 border-2 focus-visible:ring-primary h-10 px-4"
          />
          <Button type="submit" size="icon" disabled={!inputText.trim() || !hasKey} className="rounded-full h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <GroupSettings 
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
    </Card>
  )
}