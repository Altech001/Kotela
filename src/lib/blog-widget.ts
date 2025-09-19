import type { Comment } from '@/lib/types';
export type BlogPost = {
  id: string;
  title: string;
  category: string;
  date: string;
  updatedDate: string;
  readTime: string;
  excerpt: string;
  content: string;
  author: string;
  authorImage: string;
  image: string;
  imageHint: string;
  comments: Comment[];
};

export const blogPosts: BlogPost[] = [
  {
    id: "welcome-kotela-news",
    title: "Welcome to the New Kotela News Hub!",
    category: "Community",
    date: "July 31, 2024",
    updatedDate: "July 31, 2024",
    readTime: "3 min read",
    excerpt:
      "Welcome to the brand new, feature-rich Kotela news hub! We've redesigned this section to bring you a more immersive and interactive experience. Here's what's new...",
    content:
      "Welcome to the brand new, feature-rich Kotela news hub! We've redesigned this section to bring you a more immersive and interactive experience. You can now browse articles, read them in a clean and focused view, and engage with the community by leaving comments. For our mobile users, we've created a seamless experience that allows you to read full articles in a dialog without leaving the main news feed. We're excited to bring you more updates, developer insights, and community highlights right here. Stay tuned for more!",
    author: "The Kotela Team",
    authorImage: "https://api.dicebear.com/9.x/bottts/svg?seed=kotela-team",
    image: "https://picsum.photos/seed/news1/600/400",
    imageHint: "celebration confetti",
    comments: [],
  },
  {
    id: "tiered-referrals",
    title: "The Power of Tiered Referrals",
    category: "Game Updates",
    date: "July 30, 2024",
    updatedDate: "July 30, 2024",
    readTime: "5 min read",
    excerpt:
      "Our referral system just got a major upgrade! Introducing tiered referrals, a new way to earn even more KTC by building your network. Learn how it works.",
    content:
      "We're thrilled to announce the launch of our new tiered referral system. Now, not only do you earn a bonus for directly referring a new player, but you also get a bonus when that player refers someone else! This 'Tier 2' bonus rewards you for bringing influential players into the Kotela ecosystem. It's a win-win-win: you earn more, your friends earn more, and the community grows stronger. Check your profile for your referral code and start sharing today to maximize your earnings.",
    author: "Dev Team",
    authorImage: "https://api.dicebear.com/9.x/bottts/svg?seed=dev-team",
    image: "https://picsum.photos/seed/news4/600/400",
    imageHint: "network connections",
    comments: [],
  },
   {
    id: "mining-bots",
    title: 'New Mining Bots in Store',
    category: "Store",
    date: 'July 28, 2024',
     updatedDate: "July 28, 2024",
    readTime: "2 min read",
    excerpt: 'Boost your offline earnings with our new Mining Bots! Head to the store now to check them out and start earning KTC while you sleep.',
    content: 'Boost your offline earnings with our new Mining Bots! Head to the store now to check them out and start earning KTC while you sleep. These bots work 24/7, ensuring that your KTC balance keeps ticking up even when you\'re not actively playing. It\'s the perfect way to supplement your tapping income and climb the leaderboards faster.',
    author: 'Dev Team',
    authorImage: 'https://api.dicebear.com/9.x/bottts/svg?seed=dev-team-alt',
    image: 'https://picsum.photos/seed/news2/600/400',
    imageHint: 'robot technology',
    comments: [],
  },
];
