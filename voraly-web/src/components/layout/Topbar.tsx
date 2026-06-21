'use client'

import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import SubscriptionBadge from './SubscriptionBadge'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import {
  fetchNotificationsAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
  type NotificationItem
} from '@/app/dashboard/settings/notifications-actions'

const pageTitleKeys: Record<string, string> = {
  '/dashboard':            'overview',
  '/dashboard/platforms':  'platforms',
  '/dashboard/roadmap':    'roadmap',
  '/dashboard/optimize':   'optimize',
  '/dashboard/settings':   'settings',
}

export default function Topbar({ isPremium = false }: { isPremium?: boolean }) {
  const pathname = usePathname()
  const t = useTranslations('dashboard.topbar')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR'
  const titleKey = pageTitleKeys[pathname]
  const title = titleKey ? t(titleKey) : t('fallback')

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  // Fetch notifications on mount and when popover opens
  const loadNotifications = async () => {
    try {
      const res = await fetchNotificationsAction()
      if (res.notifications) {
        setNotifications(res.notifications)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    // Defer initial load to prevent synchronous state update in effect body
    setTimeout(() => {
      setNow(new Date())
      loadNotifications()
    }, 0)
    
    // Poll every 30 seconds for live updates
    const interval = setInterval(() => {
      setNow(new Date())
      loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleTogglePopover = () => {
    setShowNotifications(prev => !prev)
    if (!showNotifications) {
      loadNotifications() // Reload when opening
    }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      const res = await markAllNotificationsReadAction()
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await deleteNotificationAction(id)
      if (res.success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const dateStr = now
    ? now.toLocaleDateString(dateLocale, {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
      })
    : ''
  const dateCapitalized = dateStr ? dateStr.charAt(0).toUpperCase() + dateStr.slice(1) : ''

  // Clean date formatter
  const formatDate = (dateString: string) => {
    if (!now) return ""
    const d = new Date(dateString)
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return t('justNow')
    if (diffMins < 60) return t('minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0,   filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 flex items-end justify-between relative"
    >
      {/* ── Titre de page ── */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.16em] mb-2">
          {dateCapitalized}
        </p>
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[28px] font-black text-white tracking-tight leading-none"
        >
          {title}
        </motion.h1>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2.5 relative z-50">
        <LanguageSwitcher />
        <SubscriptionBadge isPremium={isPremium} />

        {/* Bell Button */}
        <motion.button
          onClick={handleTogglePopover}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.07)' }}
          whileTap={{ scale: 0.88, transition: { duration: 0.08 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          aria-label={t('notifications')}
          className="relative p-2.5 rounded-xl text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 flex items-center justify-center text-[7px] text-white font-extrabold"
              style={{ boxShadow: '0 0 8px rgba(244,63,94,0.9)' }}
            />
          )}
        </motion.button>

        {/* Notifications Popover Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <>
              {/* Invisible fullscreen background to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-14 w-80 z-50 glass rounded-3xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                  <span className="text-xs font-bold text-zinc-200">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={loading}
                      className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t('markAllRead')}
                    </button>
                  )}
                </div>

                {/* List Body */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.04]">
                  {notifications.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                      <Bell size={24} className="text-zinc-600 animate-pulse" />
                      <div className="text-xs text-zinc-500 font-medium">{t('noNotifications')}</div>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-4 flex gap-3 transition-colors relative group hover:bg-white/[0.02] ${
                          !notif.read ? 'bg-indigo-500/[0.02]' : ''
                        }`}
                      >
                        {/* Dot indicator */}
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-4 left-2" />
                        )}

                        <div className="flex-1 min-w-0 pl-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11.5px] font-bold text-zinc-200 truncate leading-snug">
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-zinc-500 flex-shrink-0 pt-0.5">
                              {formatDate(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed break-words">
                            {notif.content}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
