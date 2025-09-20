'use client';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { useBackgroundMining } from '@/hooks/use-background-mining';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const noNavRoutes = ['/profile/verify'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useBackgroundMining();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
     return <div className="flex h-screen items-center justify-center">Loading...</div>
  }
  
  const showNav = !noNavRoutes.includes(pathname);

  return (
    <div className='flex flex-col min-h-screen'>
      {showNav && <Header />}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>
      {showNav && <MobileNav />}
    </div>
  );
}
