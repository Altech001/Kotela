'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';
import { KotelaIcon } from '@/components/icons';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');
  const { login, user, loading } = useAuth(); // Using login as a mock for signup
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/game');
    }
  }, [user, router]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Signing up with referral code:', referral);
    login(email);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <KotelaIcon className="mx-auto h-10 w-10 mb-2" />
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Join Kotela and start mining today.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="player@kotela.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">Referral Code (Optional)</Label>
            <Input
              id="referral"
              placeholder="KOTELA-..."
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
