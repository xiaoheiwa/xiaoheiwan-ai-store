"use client"

import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useI18n, type Locale } from '@/lib/i18n-context'

const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return
    setLocale(newLocale)
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
