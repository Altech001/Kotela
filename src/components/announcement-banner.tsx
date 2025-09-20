
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { Announcement } from '@/lib/types';
import { getAnnouncements } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Megaphone, ArrowRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const LAST_SEEN_ANNOUNCEMENT_KEY = 'kotela-lastSeenAnnouncement';

export function AnnouncementBanner() {
  const { user, updateUser } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndShowBanner = async () => {
      if (!user || !(user.settings?.showAnnouncements ?? true)) {
        setIsLoading(false);
        return;
      }

      const announcements = await getAnnouncements();
      if (announcements.length === 0) {
        setIsLoading(false);
        return;
      }

      const latestAnnouncement = announcements[0];
      const lastSeenId = localStorage.getItem(LAST_SEEN_ANNOUNCEMENT_KEY);

      if (latestAnnouncement.id !== lastSeenId) {
        setAnnouncement(latestAnnouncement);
        setIsOpen(true);
      }
      setIsLoading(false);
    };

    fetchAndShowBanner();
  }, [user]);

  const handleDismiss = (permanent: boolean) => {
    setIsOpen(false);
    if (announcement) {
      localStorage.setItem(LAST_SEEN_ANNOUNCEMENT_KEY, announcement.id);
    }
    if (permanent) {
      updateUser({ settings: { ...user?.settings, showAnnouncements: false } });
    }
  };

  if (isLoading || !isOpen || !announcement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{announcement.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base py-4">
            {announcement.description}
          </DialogDescription>
           <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(announcement.date), { addSuffix: true })}
            </p>
        </DialogHeader>
        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => handleDismiss(true)}
            className="text-muted-foreground"
          >
            Don't show again
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleDismiss(false)}>
              Dismiss
            </Button>
            {announcement.href && (
              <Button asChild onClick={() => handleDismiss(false)}>
                <Link href={announcement.href}>
                  Check it out <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
