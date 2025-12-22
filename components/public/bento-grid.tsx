"use client"

import { motion } from "framer-motion"
import { BentoBlock } from "./bento-block"
import { LinkBlock } from "@/lib/types/database"

interface BentoGridProps {
  links: LinkBlock[]
  isOwner: boolean
}

export function BentoGrid({ links, isOwner }: BentoGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
    >
      {links.map((link) => (
        <BentoBlock key={link.id} link={link} isOwner={isOwner} />
      ))}
    </motion.div>
  )
}
