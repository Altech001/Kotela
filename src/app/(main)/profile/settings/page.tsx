
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const phoneVerificationSchema = z.object({
  accountId: z.string().min(1, { message: "Please select an account." }),
  otp: z.string().length(6, { message: "OTP must be 6 digits." }),
});
type PhoneVerificationFormValues = z.infer<typeof phoneVerificationSchema>;


const mobileMoneySchema = z.object({
    provider: z.string().min(2, { message: "Provider name is required."}),
    number: z.string().min(10, { message: "Please enter a valid phone number."}),
    name: z.string().min(2, { message: "Account name is required."}),
});
type MobileMoneyFormValues = z.infer<typeof mobileMoneySchema>;

export default function SettingsPage() {
  const { user, updateUser, sendVerificationOtp, verifyPhoneNumber } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneVerifyOpen, setIsPhoneVerifyOpen] = useState(false);
  const [mobileAccounts, setMobileAccounts] = useState<MobileMoneyAccount[]>([]);
  const [dailyWithdrawals, setDailyWithdrawals] = useState<Transaction[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const phoneVerificationForm = useForm<PhoneVerificationFormValues>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
        accountId: '',
        otp: '',
    }
  });
  
  const mobileMoneyForm = useForm<MobileMoneyFormValues>({
    resolver: zodResolver(mobileMoneySchema),
    defaultValues: {
        provider: '',
        number: '',
        name: ''
    }
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
      fetchMobileMoneyData(user.id);
    }
  }, [user, profileForm]);
  
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
  
  const handleSendCode = async () => {
    const accountId = phoneVerificationForm.getValues("accountId");
    if (!accountId) {
        toast({ variant: 'destructive', title: 'Selection required', description: 'Please select a mobile money account first.' });
        return;
    }
    const selectedAccount = mobileAccounts.find(acc => acc.id === accountId);
    if (!selectedAccount) return;

    setIsSubmitting(true);
    try {
        const simulatedOtp = await sendVerificationOtp(selectedAccount.number, selectedAccount.name);
        toast({ title: 'Code Sent', description: `A verification code has been sent. For this simulation, the code is ${simulatedOtp}.`});
        setIsCodeSent(true);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to Send Code', description: error.message });
    }
    setIsSubmitting(false);
  }

  const onPhoneVerifySubmit = async (data: PhoneVerificationFormValues) => {
      setIsSubmitting(true);
      try {
          await verifyPhoneNumber(data.otp);
          toast({ title: 'Phone Verified', description: 'Your phone number has been successfully verified.'});
          setIsPhoneVerifyOpen(false);
          phoneVerificationForm.reset();
          setIsCodeSent(false);
          if (user) {
            fetchMobileMoneyData(user.id);
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
      }
      setIsSubmitting(false);
  }
  
  const onAddMobileMoneySubmit = async (data: MobileMoneyFormValues) => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          await addMobileMoneyAccount({ ...data, userId: user.id });
          toast({ title: 'Account Added', description: 'The mobile money account has been successfully added.' });
          fetchMobileMoneyData(user.id);
          setIsAddAccountOpen(false);
          mobileMoneyForm.reset();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to Add Account', description: error.message });
      }
      setIsSubmitting(false);
  }
  
  const handleDeleteMobileMoney = async (accountId: string) => {
      try {
          await deleteMobileMoneyAccount(accountId);
          toast({ title: 'Account Removed', description: 'The mobile money account has been removed.'});
          if(user) fetchMobileMoneyData(user.id);
      } catch(error: any) {
          toast({ variant: 'destructive', title: 'Failed to Remove', description: error.message });
      }
  }

  const watchedAccountId = phoneVerificationForm.watch("accountId");
  const selectedAccountForVerification = mobileAccounts.find(acc => acc.id === watchedAccountId);

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
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={profileForm.control}
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
                control={profileForm.control}
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
          <CardTitle>Identity &amp; Verification</CardTitle>
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
                                <p className="text-sm text-muted-foreground">{user.isPhoneVerified ? `Verified: ${user.phoneNumber}` : 'Secure your account by verifying your phone number.'}</p>
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
                        <DialogDescription>Select one of your mobile money accounts to verify.</DialogDescription>
                    </DialogHeader>
                    <Form {...phoneVerificationForm}>
                        <form onSubmit={phoneVerificationForm.handleSubmit(onPhoneVerifySubmit)} className="space-y-4 py-4">
                             <FormField
                                control={phoneVerificationForm.control}
                                name="accountId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile Money Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an account" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mobileAccounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.provider} - {acc.number}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {selectedAccountForVerification && (
                                <Card className="bg-muted p-4">
                                    <p className="text-sm font-semibold">{selectedAccountForVerification.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedAccountForVerification.number}</p>
                                </Card>
                            )}

                             {isCodeSent && <FormField
                                control={phoneVerificationForm.control}
                                name="otp"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>One-Time Password (OTP)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="tel"
                                            maxLength={6}
                                            placeholder="_ _ _ _ _ _"
                                            className="text-center text-2xl tracking-[1.5em]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />}

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsPhoneVerifyOpen(false)}>Cancel</Button>
                                {!isCodeSent ? (
                                     <Button type="button" onClick={handleSendCode} disabled={isSubmitting || !watchedAccountId}>
                                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                        Send Code
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                        Verify Phone
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </Form>
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
            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="mr-2"/> Add Account</Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Add Mobile Money Account</DialogTitle>
                    <DialogDescription>Enter the details for your new mobile money account.</DialogDescription>
                 </DialogHeader>
                 <Form {...mobileMoneyForm}>
                    <form onSubmit={mobileMoneyForm.handleSubmit(onAddMobileMoneySubmit)} className="space-y-4 py-4">
                      <FormField
                          control={mobileMoneyForm.control}
                          name="provider"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Provider</FormLabel>
                              <FormControl><Input placeholder="e.g. MTN, Airtel" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={mobileMoneyForm.control}
                          name="number"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl><Input type="tel" placeholder="07..." {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                       <FormField
                          control={mobileMoneyForm.control}
                          name="name"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <Button type="button" variant="ghost" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
                          <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                              Save Account
                          </Button>
                      </DialogFooter>
                    </form>
                 </Form>
              </DialogContent>
            </Dialog>
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMobileMoney(acc.id)}>
                            <Trash2 className="text-destructive"/>
                        </Button>
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
