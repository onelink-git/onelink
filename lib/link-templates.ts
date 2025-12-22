export interface LinkTemplate {
  id: string
  name: string
  description: string
  preview: string
  style: {
    backgroundColor: string
    textColor: string
    borderRadius: string
    border: string
    shadow: string
    padding: string
    iconPosition: "left" | "right" | "top" | "none"
    fontWeight: string
    hoverEffect: string
  }
}

export const linkTemplates: LinkTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Simple and clean design",
    preview: "bg-white border text-black",
    style: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      shadow: "0 1px 3px rgba(0,0,0,0.1)",
      padding: "16px",
      iconPosition: "left",
      fontWeight: "500",
      hoverEffect: "hover:shadow-md",
    },
  },
  {
    id: "gradient-blue",
    name: "Ocean Wave",
    description: "Smooth blue gradient",
    preview: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
    style: {
      backgroundColor: "linear-gradient(to right, #3b82f6, #06b6d4)",
      textColor: "#ffffff",
      borderRadius: "12px",
      border: "none",
      shadow: "0 4px 6px rgba(59,130,246,0.3)",
      padding: "18px",
      iconPosition: "right",
      fontWeight: "600",
      hoverEffect: "hover:scale-105",
    },
  },
  {
    id: "gradient-purple",
    name: "Purple Dream",
    description: "Vibrant purple gradient",
    preview: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    style: {
      backgroundColor: "linear-gradient(to right, #a855f7, #ec4899)",
      textColor: "#ffffff",
      borderRadius: "16px",
      border: "none",
      shadow: "0 8px 16px rgba(168,85,247,0.3)",
      padding: "20px",
      iconPosition: "left",
      fontWeight: "700",
      hoverEffect: "hover:shadow-xl",
    },
  },
  {
    id: "dark-minimal",
    name: "Dark Minimal",
    description: "Elegant dark theme",
    preview: "bg-gray-900 text-white",
    style: {
      backgroundColor: "#111827",
      textColor: "#ffffff",
      borderRadius: "8px",
      border: "1px solid #374151",
      shadow: "none",
      padding: "16px",
      iconPosition: "left",
      fontWeight: "500",
      hoverEffect: "hover:bg-gray-800",
    },
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Bold neon outline",
    preview: "bg-black border-2 border-cyan-400 text-cyan-400",
    style: {
      backgroundColor: "#000000",
      textColor: "#22d3ee",
      borderRadius: "12px",
      border: "2px solid #22d3ee",
      shadow: "0 0 20px rgba(34,211,238,0.5)",
      padding: "18px",
      iconPosition: "right",
      fontWeight: "600",
      hoverEffect: "hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
    },
  },
  {
    id: "soft-pastel",
    name: "Soft Pastel",
    description: "Gentle pastel colors",
    preview: "bg-pink-50 text-pink-900",
    style: {
      backgroundColor: "#fdf2f8",
      textColor: "#831843",
      borderRadius: "20px",
      border: "1px solid #fbcfe8",
      shadow: "0 2px 8px rgba(251,207,232,0.3)",
      padding: "18px",
      iconPosition: "top",
      fontWeight: "600",
      hoverEffect: "hover:bg-pink-100",
    },
  },
  {
    id: "glassmorphism",
    name: "Glass Effect",
    description: "Modern frosted glass",
    preview: "bg-white/20 backdrop-blur text-black",
    style: {
      backgroundColor: "rgba(255,255,255,0.2)",
      textColor: "#000000",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 8px 32px rgba(0,0,0,0.1)",
      padding: "20px",
      iconPosition: "left",
      fontWeight: "600",
      hoverEffect: "hover:bg-white/30",
    },
  },
  {
    id: "bold-orange",
    name: "Bold Orange",
    description: "Energetic orange theme",
    preview: "bg-orange-500 text-white",
    style: {
      backgroundColor: "#f97316",
      textColor: "#ffffff",
      borderRadius: "12px",
      border: "none",
      shadow: "0 4px 12px rgba(249,115,22,0.4)",
      padding: "18px",
      iconPosition: "left",
      fontWeight: "700",
      hoverEffect: "hover:bg-orange-600",
    },
  },
]
