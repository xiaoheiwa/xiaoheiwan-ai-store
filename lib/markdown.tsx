// Simple Markdown parser for preview rendering
// Converts common markdown syntax to HTML

export function renderPreview(markdown: string): string {
  if (!markdown) return ""

  let html = markdown
    // Escape HTML to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Code blocks (must be before other transforms)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-secondary/50 rounded-lg p-3 my-3 overflow-x-auto"><code class="text-xs">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-xs">$1</code>')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-foreground mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-foreground mt-5 mb-2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-foreground mt-6 mb-3">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-accent/50 pl-3 my-2 italic text-muted-foreground/80">$1</blockquote>')

  // Horizontal rule
  html = html.replace(/^[-*_]{3,}$/gm, '<hr class="my-4 border-border" />')

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(/((?:<li class="ml-4 list-disc">.+<\/li>\n?)+)/g, '<ul class="my-2">$1</ul>')
  html = html.replace(/((?:<li class="ml-4 list-decimal">.+<\/li>\n?)+)/g, '<ol class="my-2">$1</ol>')

  // Paragraphs - wrap remaining lines that aren't already wrapped
  const lines = html.split('\n')
  const processed = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return line
    return `<p class="my-2">${line}</p>`
  })
  html = processed.join('\n')

  // Clean up empty paragraphs and extra whitespace
  html = html.replace(/<p class="my-2"><\/p>/g, '')
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}
