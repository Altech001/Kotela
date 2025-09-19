
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Newspaper } from 'lucide-react';
import { blogPosts, type BlogPost } from '@/lib/blog-widget';

interface BlogWidgetProps {
  limit?: number;
  showViewAll?: boolean;
}

export function BlogWidget({ limit = 3, showViewAll = false }: BlogWidgetProps) {
  const postsToShow = blogPosts.slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Newspaper />
            Latest News
        </CardTitle>
        {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
                <Link href="/news">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {postsToShow.map((post) => (
          <Link href={`/news#${post.id}`} key={post.id} className="block group">
            <div className="p-3 rounded-md group-hover:bg-muted transition-colors">
                <p className="text-xs text-muted-foreground">{post.date}</p>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
