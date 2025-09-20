
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ChevronRight,
  User,
  ShieldCheck,
  Phone,
  Trash2,
  PlusCircle,
  Banknote,
  Loader2,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  addMobileMoneyAccount,
  getMobileMoneyAccounts,
  deleteMobileMoneyAccount,
  getDailyWithdrawals,
} from '@/lib/actions';
import type { MobileMoneyAccount, Transaction } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, updateUser, verifyPhoneNumber } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneVerifyOpen, setIsPhoneVerifyOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [mobileAccounts, setMobileAccounts] = useState<MobileMoneyAccount[]>([]);
  const [dailyWithdrawals, setDailyWithdrawals] = useState<Transaction[]>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
      });
      fetchMobileMoneyData(user.id);
    }
  }, [user, form]);
  
  const fetchMobileMoneyData = async (userId: string) => {
    const [accounts, withdrawals] = await Promise.all([
      getMobileMoneyAccounts(userId),
      getDailyWithdrawals(userId)
    ]);
    setMobileAccounts(accounts);
    setDailyWithdrawals(withdrawals);
  }

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUser(data);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
    setIsSubmitting(false);
  };
  
  const handleVerifyPhone = async () => {
      if (otp.length !== 6) {
          toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter a 6-digit OTP.'});
          return;
      }
      setIsSubmitting(true);
      try {
          await verifyPhoneNumber(otp);
          toast({ title: 'Phone Verified', description: 'Your phone number has been successfully verified.'});
          setIsPhoneVerifyOpen(false);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
      }
      setIsSubmitting(false);
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/profile">Profile</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your public profile information.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Identity & Verification</CardTitle>
          <CardDescription>Manage your verification status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-muted-foreground" />
                    <div>
                        <p className="font-semibold">KYC Verification</p>
                        <p className="text-sm text-muted-foreground">Required for withdrawals and P2P trading.</p>
                    </div>
                </div>
                <Button variant="secondary" asChild>
                    <Link href="/profile/verify">
                      {user.isKycVerified ? 'View Status' : 'Verify Now'} <ChevronRight className="ml-2" />
                    </Link>
                </Button>
            </div>
             <Dialog open={isPhoneVerifyOpen} onOpenChange={setIsPhoneVerifyOpen}>
                <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Phone className="text-muted-foreground" />
                            <div>
                                <p className="font-semibold">Phone Number Verification</p>
                                <p className="text-sm text-muted-foreground">{user.isPhoneVerified ? 'Your number is verified.' : 'Secure your account by verifying your phone number.'}</p>
                            </div>
                        </div>
                        <Button variant="secondary" disabled={user.isPhoneVerified}>
                          {user.isPhoneVerified ? 'Verified' : 'Verify'} <ChevronRight className="ml-2" />
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Your Phone Number</DialogTitle>
                        <DialogDescription>A 6-digit code has been sent to your registered phone number. Enter it below to verify.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            type="tel"
                            maxLength={6}
                            placeholder="_ _ _ _ _ _"
                            className="text-center text-2xl tracking-[1.5em]"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPhoneVerifyOpen(false)}>Cancel</Button>
                        <Button onClick={handleVerifyPhone} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                            Verify
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mobile Money</CardTitle>
              <CardDescription>Manage your mobile money accounts for withdrawals.</CardDescription>
            </div>
            <Button size="sm"><PlusCircle className="mr-2"/> Add Account</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                {mobileAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Banknote />
                            <div>
                                <p className="font-semibold">{acc.provider}</p>
                                <p className="text-sm text-muted-foreground">{acc.number}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon"><Trash2 className="text-destructive"/></Button>
                    </div>
                ))}
                {mobileAccounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No mobile money accounts added.</p>}
            </div>
            <Separator className="my-6" />
            <div>
              <h4 className="font-semibold mb-2">Today's Mobile Money Withdrawals</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyWithdrawals.length > 0 ? dailyWithdrawals.map(tx => (
                    <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.timestamp), 'HH:mm:ss')}</TableCell>
                        <TableCell className="font-mono">{tx.amount.toFixed(2)} KTC</TableCell>
                        <TableCell>{tx.description}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">No withdrawals today.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
