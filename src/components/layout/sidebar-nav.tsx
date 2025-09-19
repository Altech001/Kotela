'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Flame,
  LayoutGrid,
  Store,
  ShieldCheck,
  Trophy,
  Newspaper,
  Wallet,
  Settings,
  CircleHelp,
} from 'lucide-react';
import { KotelaIcon } from '@/components/icons';
import { Button } from '../ui/button';
import { UserNav } from './user-nav';

const menuItems = [
  { href: '/game', label: 'Game', icon: Flame },
  { href: '/store', label: 'Store', icon: Store },
  { href: '/profile', label: 'Wallet', icon: Wallet },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/kyc', label: 'Verification', icon: ShieldCheck },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/game">
              <KotelaIcon className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold">Kotela</span>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === href}
              tooltip={{ children: label, side: 'right' }}
            >
              <Link href={href}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-2 border-t mt-auto">
        <div className='md:hidden'>
         <UserNav />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip={{ children: 'Help', side: 'right' }}>
                <Link href="#">
                    <CircleHelp />
                    <span>Help</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip={{ children: 'Settings', side: 'right' }}>
                <Link href="#">
                    <Settings />
                    <span>Settings</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
