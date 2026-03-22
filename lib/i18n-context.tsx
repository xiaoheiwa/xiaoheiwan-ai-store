"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// 翻译文件
import zhMessages from '@/messages/zh.json'
import enMessages from '@/messages/en.json'

export type Locale = 'zh' | 'en'

const messages: Record<Locale, typeof zhMessages> = {
  zh: zhMessages,
  en: enMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path // 如果找不到，返回原始 key
    }
  }
  return typeof result === 'string' ? result : path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 从 cookie 读取语言设置
    const cookie = document.cookie.split('; ').find(row => row.startsWith('locale='))
    const savedLocale = cookie?.split('=')[1] as Locale
    if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
      setLocaleState(savedLocale)
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    setLocaleState(newLocale)
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(messages[locale], key)
    
    // 替换参数 {name} -> value
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }
    
    return text
  }, [locale])

  // 防止 SSR 闪烁
  if (!mounted) {
    return null
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function useLocale() {
  const { locale } = useI18n()
  return locale
}

export function useTranslations(namespace?: string) {
  const { t, locale } = useI18n()
  
  return useCallback((key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return t(fullKey, params)
  }, [t, namespace])
}
