/**
 * Maps product keywords to their activation page URLs.
 * Used by success page, order detail page, and product detail page
 * to guide users to the correct activation flow after purchase.
 */

interface ActivationRoute {
  label: string
  href: string
  color: string
  description: string
}

const ACTIVATION_ROUTES: ActivationRoute[] = [
  {
    label: "Claude Pro 激活",
    href: "/activate/claude",
    color: "#D4A574",
    description: "前往 Claude Pro 激活页面，输入激活码完成会员开通",
  },
  {
    label: "Grok Premium 激活",
    href: "/activate/grok",
    color: "#1DA1F2",
    description: "前往 Grok Premium 激活页面，输入激活码完成会员开通",
  },
  {
    label: "X Premium 激活",
    href: "/activate/x",
    color: "#000000",
    description: "前往 X Premium 激活页面，输入激活码完成会员开通",
  },
  {
    label: "ChatGPT Plus 激活",
    href: "/activate/gpt",
    color: "#10A37F",
    description: "前往 ChatGPT Plus 激活页面，提交账户信息完成充值",
  },
  {
    label: "GPT Team 兑换",
    href: "/activate/team",
    color: "#3B82F6",
    description: "前往 GPT Team 页面，输入卡密和邮箱完成团队邀请",
  },
]

const KEYWORD_MAP: Record<string, number> = {
  claude: 0,
  grok: 1,
  supergrok: 1,
  "x premium": 2,
  "x-premium": 2,
  "chatgpt": 3,
  "gpt plus": 3,
  "gpt-plus": 3,
  "chatgpt plus": 3,
  "gpt team": 4,
  "gpt-team": 4,
  team: 4,
}

/**
 * Given a product name or subject string, returns the matching activation route.
 * Returns null if no match found.
 */
export function getActivationRoute(productNameOrSubject: string | null | undefined): ActivationRoute | null {
  if (!productNameOrSubject) return null
  const lower = productNameOrSubject.toLowerCase()
  for (const [keyword, index] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      return ACTIVATION_ROUTES[index]
    }
  }
  return null
}

/**
 * Returns all available activation routes for display.
 */
export function getAllActivationRoutes(): ActivationRoute[] {
  return ACTIVATION_ROUTES
}
