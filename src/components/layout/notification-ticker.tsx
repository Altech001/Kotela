
"use client";

import { useState, useEffect } from 'react';
import { Megaphone, Pause, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getAnnouncements } from '@/lib/actions';
import type { Announcement } from '@/lib/types';

export function NotificationTicker() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const items = await getAnnouncements();
            setAnnouncements(items);
        };
        fetchAnnouncements();
    }, []);

    if (!isVisible || announcements.length === 0) {
        return null;
    }

    return (
        <div className="bg-secondary/50 border-b">
            <div className="container mx-auto flex items-center gap-4 h-10 px-4">
                <Megaphone className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <div
                        className={cn(
                            'flex gap-8 animate-marquee whitespace-nowrap',
                            isPaused ? '[animation-play-state:paused]' : '[animation-play-state:running]'
                        )}
                    >
                        {announcements.map((item, index) => (
                            <Link href={item.href || '#'} key={index} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {item.text} <span className="ml-1">({item.date})</span>
                            </Link>
                        ))}
                         {/* Duplicate for seamless loop */}
                        {announcements.map((item, index) => (
                            <Link href={item.href || '#'} key={`duplicate-${index}`} aria-hidden="true" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {item.text} <span className="ml-1">({item.date})</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPaused(!isPaused)} className="text-muted-foreground hover:text-primary">
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        <span className="sr-only">{isPaused ? 'Play' : 'Pause'}</span>
                    </button>
                    <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-primary">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
