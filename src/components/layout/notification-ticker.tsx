
"use client";

import { useState } from 'react';
import { Megaphone, Pause, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const notifications = [
    { text: 'Earn Wednesday: New Limited-Time Offers Available Now!', date: '04-12', href: '/news' },
    { text: 'Notice Regarding the Withdrawals of Frax Share (FXS) via BNB', date: '04-12', href: '/news' },
    { text: 'Binance Completes Integration of Tether (USDT) on NEAR Protocol', date: '04-12', href: '/news' },
    { text: 'Kotela Coin (KTC) Hits All-Time High Amidst Market Surge', date: '04-11', href: '/news' },
    { text: 'New, More Efficient Mining Algorithm Deployed on the Kotela Network', date: '04-10', href: '/news' },
];

export function NotificationTicker() {
    const [isPaused, setIsPaused] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
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
                        {notifications.map((item, index) => (
                            <Link href={item.href} key={index} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {item.text} <span className="ml-1">({item.date})</span>
                            </Link>
                        ))}
                         {/* Duplicate for seamless loop */}
                        {notifications.map((item, index) => (
                            <Link href={item.href} key={`duplicate-${index}`} aria-hidden="true" className="text-xs text-muted-foreground hover:text-primary transition-colors">
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
