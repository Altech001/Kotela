import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { newsData } from '@/lib/data';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function NewsPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">News & Updates</h1>
        <p className="text-muted-foreground">
          The latest from the Kotela team.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsData.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <div className="aspect-video relative mb-4">
                 <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="rounded-lg object-cover"
                    data-ai-hint={item.imageHint}
                />
              </div>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{item.content}</p>
            </CardContent>
            <CardFooter className='text-xs text-muted-foreground'>
                <span>By {item.author} &middot; {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
