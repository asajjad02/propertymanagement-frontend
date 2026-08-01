'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';

import { MoreSheet } from './more-sheet';
import { mobileNavForRole, type NavItemDef } from './nav-config';
import { usePageChrome } from './page-chrome';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The mobile primary navigation: a fixed bottom tab bar sized to the thumb,
 * padded past the home indicator, with the destinations that don't fit tucked
 * into a More sheet. Replaces the off-canvas drawer below `md`; the desktop
 * sidebar is untouched.
 */
export function BottomNav() {
  const { role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const { bar, overflow } = mobileNavForRole(role);
  // A screen with a back target is a pushed screen, not a top-level
  // destination. Native apps hide the tab bar there: the tabs aren't reachable
  // from inside a record anyway, and the 57px is better spent on the record.
  const { backHref } = usePageChrome();

  // Tapping a destination inside the sheet should leave it behind.
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);
  if (pathname !== navigatedFrom) {
    setNavigatedFrom(pathname);
    setMoreOpen(false);
  }

  if (bar.length === 0 || backHref) return null;

  // "More" lights up when the user is somewhere that lives behind it, so the
  // bar never reads as "nowhere selected".
  const moreActive = overflow.some((item) => isActive(pathname, item.href));

  /**
   * Tapping the tab you're already on. Native convention, and free navigation:
   * first tap returns you to the top of a long list, and a second tap (already
   * at the top) drops the query string — clearing filters, search and page
   * without hunting for the Clear control.
   */
  function reEnter(href: string) {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.scrollY > 4) {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    } else if (window.location.search) {
      router.replace(href, { scroll: false });
    }
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur',
          'px-safe pb-safe lg:hidden',
        )}
      >
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${bar.length + 1}, minmax(0, 1fr))` }}
        >
          {bar.map((item) => (
            <li key={item.href}>
              <NavTab item={item} active={isActive(pathname, item.href)} onReEnter={reEnter} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              className={tabClass}
            >
              <span className={cn(pillClass, moreActive ? activePill : idlePill)}>
                <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
              </span>
              <span className={cn(labelClass, moreActive ? activeLabel : idleLabel)}>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} overflow={overflow} />
    </>
  );
}

/*
 * Vertical rhythm, in a ~57px bar:
 *   6px · pill 28 (20px icon) · 4px · label 13 · 6px
 *
 * The gap inside the icon+label pair used to be 4px against 11px of space above
 * and below it, so the pair read as one clump adrift in an empty tab. Outer and
 * inner are now close (6 vs 4): still grouped, no longer marooned.
 */
const tabClass =
  'flex w-full flex-col items-center justify-center gap-1 px-1 py-1.5 touch-manipulation';

/*
 * The pill is the selection signal. Colour alone was doing that job, which is
 * thin in sunlight and invisible to some colour-blind users — shape carries it
 * now, with colour reinforcing. It doubles as the press target's feedback.
 */
const pillClass =
  'flex h-7 w-12 items-center justify-center rounded-pill transition-[background-color,transform] ' +
  'duration-150 active:scale-90';
const activePill = 'bg-primary-soft text-primary-text';
const idlePill = 'text-muted';

const labelClass = 'max-w-full truncate text-[0.6875rem] leading-[0.8125rem] transition-colors';
const activeLabel = 'font-semibold text-primary-text';
const idleLabel = 'font-medium text-muted';

function NavTab({
  item,
  active,
  onReEnter,
}: {
  item: NavItemDef;
  active: boolean;
  onReEnter: (href: string) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={(e) => {
        if (!active) return;
        // Already here — don't re-navigate, act on the current screen instead.
        e.preventDefault();
        onReEnter(item.href);
      }}
      className={tabClass}
    >
      <span className={cn(pillClass, active ? activePill : idlePill)}>
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
      </span>
      <span className={cn(labelClass, active ? activeLabel : idleLabel)}>
        {item.shortLabel ?? item.label}
      </span>
    </Link>
  );
}
