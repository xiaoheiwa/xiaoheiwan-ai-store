import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-accent mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            页面未找到
          </h2>
          <p className="text-muted-foreground">
            抱歉，您访问的页面不存在或已被移除。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <Link href="/purchase">
            <Button variant="outline" className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              浏览产品
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            您可能在找：
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/purchase" className="text-sm text-accent hover:underline">
              购买激活码
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/activate/gpt" className="text-sm text-accent hover:underline">
              ChatGPT 激活
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/activate/claude" className="text-sm text-accent hover:underline">
              Claude 激活
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/guide" className="text-sm text-accent hover:underline">
              使用指南
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
