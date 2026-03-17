"use client"

import type { DetailBlock } from "./rich-details-editor"

interface RichDetailsDisplayProps {
  details: string | null
}

export function RichDetailsDisplay({ details }: RichDetailsDisplayProps) {
  if (!details) return null

  // Try to parse as JSON blocks
  let blocks: DetailBlock[] = []
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      blocks = parsed
    }
  } catch {
    // Not JSON, render as plain text
    return (
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
        {details}
      </div>
    )
  }

  if (blocks.length === 0) return null

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === "text" ? (
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
              {block.content}
            </div>
          ) : (
            <div className="space-y-2">
              {block.content && (
                <img
                  src={block.content}
                  alt={block.caption || "教程图片"}
                  className="max-w-full h-auto rounded-xl border border-border shadow-sm"
                  loading="lazy"
                />
              )}
              {block.caption && (
                <p className="text-xs text-muted-foreground text-center italic">
                  {block.caption}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
