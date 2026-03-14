export const errorMappings = {
  revenueCat: {
    "OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to api.revenuecat.com:443":
      "网络连接不稳定，请等几秒钟重试，不要换卡密。如仍失败请联系客服",
    SSL_ERROR_SYSCALL: "网络连接异常，请检查网络后重试",
    "Connection timed out": "RevenueCat服务连接超时，请稍后重试",
    "There is already another active subscriber using the same receipt": "此收据已被其他用户使用，请重新获取收据",
    "Invalid receipt": "收据格式无效，请重新获取收据数据",
    "Internal Server Error": "RevenueCat服务内部错误，请稍后重试",
    "400": "RevenueCat请求参数错误，请重新尝试",
    "401": "RevenueCat认证失败，请稍后重试",
    "429": "RevenueCat请求过于频繁，请稍后重试",
    "500": "RevenueCat服务内部错误，请稍后重试",
  },
  openai: {
    重新登录: "Token已失效，请重新登录ChatGPT获取新Token重试，不要换卡密否则不提供售后。如仍失败请联系客服",
    "Request is not allowed. Please try again later":
      "该账户已绑定其他卡密，不能使用新卡密充值同一账户。可以重试原卡密，但换卡密充值不提供售后，如需帮助请联系客服",
    "No entitlements found for account": "该账户没有ChatGPT Plus订阅权限，请确认已购买订阅",
    "Invalid token": "Token已过期或无效，请重新获取Token",
    "Token expired": "Token已过期，请重新获取Token",
    "Authentication failed": "账户认证失败，请检查Token是否正确",
    "OpenSSL SSL_connect: SSL_ERROR_SYSCALL": "网络连接不稳定，请等几秒钟重试，不要换卡密。如仍失败请联系客服",
    "0": "提示可能已经充值成功了，请刷新GPT网页，如未成功请更新token，如多次不行有问题请找客服",
    "400": "OpenAI请求参数错误，请检查提交的数据",
    "401": "OpenAI认证失败，请重新获取Token",
    "403": "OpenAI访问被拒绝，请检查账户权限",
    "429": "OpenAI请求过于频繁，请稍后重试",
    "500": "OpenAI服务内部错误，请稍后重试",
  },
}

export function mapError(error: string): string {
  // 检查OpenAI错误
  for (const [key, value] of Object.entries(errorMappings.openai)) {
    if (error.includes(key)) {
      return value
    }
  }

  // 检查RevenueCat错误
  for (const [key, value] of Object.entries(errorMappings.revenueCat)) {
    if (error.includes(key)) {
      return value
    }
  }

  return error
}
