"use client"

import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

type Locale = 'zh' | 'en'

const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}

function getLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  const cookie = document.cookie.split('; ').find(row => row.startsWith('locale='))
  return (cookie?.split('=')[1] as Locale) || 'zh'
}

function setLocale(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`
}

export function LanguageSwitcher() {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>('zh')
  
  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return
    setLocale(newLocale)
    setLocaleState(newLocale)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {(['zh', 'en'] as Locale[]).map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={`cursor-pointer ${locale === loc ? 'bg-accent/10 text-accent' : ''}`}
          >
            <span className="mr-2">{loc === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
