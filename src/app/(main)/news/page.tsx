
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Newspaper, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { blogPosts, type BlogPost } from '@/lib/blog-widget';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import type { Comment } from '@/lib/types';
import { getComments, addComment } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';

const StandaloneCommentSection = ({ post }: { post: BlogPost }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
      const fetchComments = async () => {
          setIsLoading(true);
          const fetchedComments = await getComments(post.id);
          setComments(fetchedComments);
          setIsLoading(false);
      };
      fetchComments();
    }, [post.id]);

    const handlePostComment = async () => {
        if (newComment.trim() === '' || !user) return;

        setIsPosting(true);
        const optimisticComment: Comment = {
            id: `optimistic-${Date.now()}`,
            postId: post.id,
            userId: user.id,
            author: user.name,
            authorImage: user.avatarUrl,
            date: new Date().toISOString(),
            content: newComment,
        };
        
        setComments([optimisticComment, ...comments]);
        setNewComment('');

        try {
            const savedComment = await addComment({
                postId: post.id,
                userId: user.id,
                author: user.name,
                authorImage: user.avatarUrl,
                content: newComment,
            });
            // Replace optimistic comment with the real one from the server
            setComments(currentComments => currentComments.map(c => c.id === optimisticComment.id ? savedComment : c));
        } catch (error) {
            console.error("Failed to post comment:", error);
            // Revert optimistic update on failure
            setComments(currentComments => currentComments.filter(c => c.id !== optimisticComment.id));
            setNewComment(optimisticComment.content);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <>
            <CardHeader className="p-4 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments.length})
                </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-15rem)] md:h-[calc(100vh-25rem)]">
                 {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar>
                                    <AvatarImage src={comment.authorImage} alt={comment.author} />
                                    <AvatarFallback>{comment.author.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold text-sm">{comment.author}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.date), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
             <CardFooter className="p-4 border-t flex-col items-stretch gap-2">
                 <div className="flex gap-3">
                    <Avatar>
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Textarea 
                        placeholder="Add your comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1"
                        rows={2}
                        disabled={!user || isPosting}
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handlePostComment} disabled={!newComment.trim() || !user || isPosting} size="sm">
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Comment
                    </Button>
                </div>
            </CardFooter>
        </>
    );
};


const ArticleContent = ({ post }: { post: BlogPost }) => (
    <div className="p-6">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
            <Image 
                src={post.image} 
                alt={post.title} 
                fill 
                className="object-cover"
                data-ai-hint={post.imageHint}
            />
        </div>
        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>{post.date}</span>
            <Badge variant="secondary">{post.category}</Badge>
        </div>
        
        <div className="flex items-center gap-3 my-6">
            <Avatar>
                <AvatarImage src={post.authorImage} alt={post.author} />
                <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">Posted by: {post.author}</p>
                <p className="text-xs text-muted-foreground">
                    Updated {post.updatedDate} · {post.readTime}
                </p>
            </div>
        </div>

        <div className="prose prose-base dark:prose-invert max-w-none text-foreground/90 font-serif">
            <p>{post.content}</p>
        </div>

        <Separator className="my-8" />
        
        <div className="text-xs text-muted-foreground">
            <p className="italic">
                Kotela aims to publish information that is factual and accurate as of the date of publication. For specific information about a cryptocurrency exchange or trading platform please visit that provider's website. This information is general in nature and is for education purposes only. Kotela does not provide financial advice nor does it take into account your personal financial situation. We encourage you to seek financial advice from an independent financial advisor where appropriate and make your own inquiries.
            </p>
        </div>
        
        {/* Comments for tablet view */}
        <div className="lg:hidden mt-8">
            <Card>
                <StandaloneCommentSection post={post} />
            </Card>
        </div>
    </div>
);


const MobileArticleContent = ({ post }: { post: BlogPost }) => (
    <ScrollArea className="h-full">
        <div className="p-6">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    data-ai-hint={post.imageHint}
                />
            </div>
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{post.date}</span>
                <Badge variant="secondary">{post.category}</Badge>
            </div>

            <div className="flex items-center gap-3 my-6">
                <Avatar>
                    <AvatarImage src={post.authorImage} alt={post.author} />
                    <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">Posted by: {post.author}</p>
                    <p className="text-xs text-muted-foreground">
                        Updated {post.updatedDate} · {post.readTime}
                    </p>
                </div>
            </div>

            <div className="prose prose-base dark:prose-invert max-w-none text-foreground/90 font-serif">
                <p>{post.content}</p>
            </div>

            <Separator className="my-8" />

            <div className="text-xs text-muted-foreground">
                <p className="italic">
                    Kotela aims to publish information that is factual and accurate as of the date of publication. For specific information about a cryptocurrency exchange or trading platform please visit that provider's website. This information is general in nature and is for education purposes only. Kotela does not provide financial advice nor does it take into account your personal financial situation. We encourage you to seek financial advice from an independent financial advisor where appropriate and make your own inquiries.
                </p>
            </div>

            <Separator className="my-8" />

             <Card>
                <StandaloneCommentSection post={post} />
             </Card>
        </div>
    </ScrollArea>
);


export default function NewsPage() {
    const [selectedPost, setSelectedPost] = useState(blogPosts[0]);
    const isMobile = useIsMobile();

    const handleSelectPost = (post: BlogPost) => {
        setSelectedPost(post);
    }

    if (isMobile) {
        return (
             <div className="w-full max-w-6xl mx-auto space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/">Home</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage>News</BreadcrumbPage>
                    </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                 <div className="flex items-center gap-2">
                    <Newspaper className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">News & Trends</h1>
                </div>

                <div className="space-y-4">
                    {blogPosts.map((post) => (
                        <Dialog key={post.id}>
                             <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <Badge variant="outline">{post.category}</Badge>
                                        <span>{post.date}</span>
                                    </div>
                                    <CardTitle className="text-base">{post.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                                </CardContent>
                                <CardFooter>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="w-full">
                                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                </CardFooter>
                            </Card>
                            <DialogContent className="w-[95vw] h-[90vh] max-w-2xl p-0">
                               <DialogHeader className="sr-only">
                                    <DialogTitle>{post.title}</DialogTitle>
                                </DialogHeader>
                               <MobileArticleContent post={post} />
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <ChevronRight />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                    <BreadcrumbPage>News</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center gap-2">
                <Newspaper className="h-6 w-6" />
                <h1 className="text-2xl font-bold">News & Trends</h1>
            </div>

            <Card className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 overflow-hidden h-[calc(100vh-15rem)]">
                <div className="md:col-span-1 border-r">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base">All Articles</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[calc(100vh-20rem)]">
                        <div className="flex flex-col">
                            {blogPosts.map((post) => (
                                <button
                                    key={post.id}
                                    onMouseEnter={() => handleSelectPost(post)}
                                    onClick={() => handleSelectPost(post)}
                                    className={cn(
                                        "text-left p-4 border-b hover:bg-muted/50 transition-colors",
                                        selectedPost.id === post.id && "bg-muted"
                                    )}
                                >
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <Badge variant="outline">{post.category}</Badge>
                                        <span>{post.date}</span>
                                    </div>
                                    <h3 className="font-semibold text-sm">{post.title}</h3>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <div className="md:col-span-2 lg:col-span-2 border-r">
                     {selectedPost ? (
                        <ScrollArea className='h-[calc(100vh-15rem)]'>
                            <ArticleContent post={selectedPost} />
                        </ScrollArea>
                     ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Select an article to read</p>
                        </div>
                     )}
                </div>
                 <div className="hidden lg:block lg:col-span-1">
                     {selectedPost ? (
                        <div className='h-[calc(100vh-15rem)] flex flex-col'>
                            <StandaloneCommentSection post={selectedPost} />
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                            <p>Select an article to view comments</p>
                        </div>
                     )}
                </div>
            </Card>
        </div>
    );
}
