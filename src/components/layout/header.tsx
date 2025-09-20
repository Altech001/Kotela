import { UserNav } from './user-nav';
import { DesktopNav } from './desktop-nav';
import Link from 'next/link';
import { KotelaIcon } from '../icons';
import { NotificationBell } from './notification-bell';

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
       <Link href="/" className="flex items-center gap-2 font-semibold">
          <KotelaIcon className="h-6 w-6" />
          <span className="">Kotela</span>
        </Link>
      <div className="flex-1 flex justify-center">
        <DesktopNav />
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
}
