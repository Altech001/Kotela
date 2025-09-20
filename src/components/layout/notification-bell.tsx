
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { markNotificationsAsRead } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    const notifsRef = collection(db, 'users', user.id, 'notifications');
    const q = query(notifsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      let unread = false;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();
        const notif = { id: doc.id, ...data, timestamp } as Notification;
        notifs.push(notif);
        if (!notif.isRead) {
          unread = true;
        }
      });
      setNotifications(notifs);
      setHasUnread(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenChange = async (open: boolean) => {
    if (open || !hasUnread) return;
    
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0 && user) {
        await markNotificationsAsRead(user.id, unreadIds);
        // The onSnapshot listener will automatically update the state
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {hasUnread && (
            <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex-col items-start gap-1 whitespace-normal">
                        <div className="flex items-center w-full">
                            <p className="font-semibold text-sm flex-1">{notif.title}</p>
                            {!notif.isRead && <Circle className="h-2 w-2 fill-primary text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground w-full">{notif.description}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 w-full">
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </p>
                    </DropdownMenuItem>
                ))
            ) : (
                <DropdownMenuItem disabled>No notifications yet.</DropdownMenuItem>
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
