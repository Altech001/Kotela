import { UserNav } from './user-nav';
import { DesktopNav } from './desktop-nav';
import Link from 'next/link';
import { KotelaIcon } from '../icons';
import { NotificationBell } from './notification-bell';
import { NotificationTicker } from './notification-ticker';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <KotelaIcon className="h-6 w-6" />
          <span className="">Kotela</span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <UserNav />
        </div>
      </div>
      <NotificationTicker />
    </header>
  );
}
