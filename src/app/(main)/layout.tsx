'use client';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { useBackgroundMining } from '@/hooks/use-background-mining';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useBackgroundMining();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
     return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
