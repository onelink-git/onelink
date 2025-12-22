"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Link2, Eye, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase/client"
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore"

interface QuickStatsProps {
  userId: string
}

export function QuickStats({ userId }: QuickStatsProps) {
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalViews: 0,
    totalFriends: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total links count
        const linksQuery = query(
          collection(db, "link_blocks"),
          where("user_id", "==", userId)
        )
        const linksSnapshot = await getCountFromServer(linksQuery)
        
        // Get total clicks
        const clicksQuery = query(
          collection(db, "link_blocks"),
          where("user_id", "==", userId)
        )
        const clicksSnapshot = await getDocs(clicksQuery)
        const totalClicks = clicksSnapshot.docs.reduce((sum, doc) => sum + (doc.data().click_count || 0), 0)

        // Get total friends (requester)
        const connReqQuery = query(
          collection(db, "connections"),
          where("requester_id", "==", userId),
          where("status", "==", "accepted")
        )
        const connReqSnapshot = await getCountFromServer(connReqQuery)

        // Get total friends (receiver)
        const connRecQuery = query(
          collection(db, "connections"),
          where("receiver_id", "==", userId),
          where("status", "==", "accepted")
        )
        const connRecSnapshot = await getCountFromServer(connRecQuery)

        setStats({
          totalLinks: linksSnapshot.data().count,
          totalViews: totalClicks,
          totalFriends: connReqSnapshot.data().count + connRecSnapshot.data().count,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [userId])

  const statItems = [
    {
      label: "Active Links",
      value: stats.totalLinks,
      icon: Link2,
    },
    {
      label: "Total Clicks",
      value: stats.totalViews,
      icon: Eye,
    },
    {
      label: "Friends",
      value: stats.totalFriends,
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statItems.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
