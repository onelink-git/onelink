"use client"

import { linkTemplates } from "@/lib/link-templates"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Link Template</Label>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {linkTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
            className={`relative rounded-lg border-2 p-3 text-left transition-all ${
              selectedTemplate === template.id ? "border-primary shadow-md" : "border-border hover:border-primary/50"
            }`}
          >
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-3 w-3" />
              </div>
            )}

            <div
              className={`mb-2 h-12 rounded flex items-center justify-center text-sm font-medium ${template.preview}`}
            >
              {template.name}
            </div>

            <div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
