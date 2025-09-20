
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Download, Coins, Banknote, Wallet, ArrowRight, Hourglass, Smartphone, CheckCircle, Clock, XCircle, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';


const KTC_TO_USD_RATE = 1.25;
const USD_TO_UGX_RATE = 3800;
const KTC_TO_UGX_RATE = KTC_TO_USD_RATE * USD_TO_UGX_RATE;
const WITHDRAWAL_FEE_KTC = 5.0;
const WITHDRAWAL_TIMESTAMPS_KEY = 'kotela-withdrawal-timestamps';
const WITHDRAWAL_LIMIT = 2;
const WITHDRAWAL_WINDOW_MS = 60 * 1000; // 1 minute

const paymentOptions = [
    { id: 'bank-1', type: 'Bank Transfer', details: 'Add your bank account', icon: Banknote, category: 'bank' },
    { id: 'wallet-1', type: 'Crypto Wallet', details: 'Add your wallet address', icon: Wallet, category: 'crypto' },
    { id: 'airtel-1', type: 'Airtel Money', details: 'Mobile Money', icon: Smartphone, category: 'mobile-money' },
    { id: 'mtn-1', type: 'MTN Mobile Money', details: 'Mobile Money', icon: Smartphone, category: 'mobile-money' },
];

export default function WithdrawPage() {
    const { user, updateUser, addTransaction } = useAuth();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    
    // State for payment method details
    const [mobileNumber, setMobileNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [walletAddress, setWalletAddress] = useState('');

    const [isRateLimited, setIsRateLimited] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    
    const selectedPaymentOption = paymentOptions.find(p => p.id === paymentMethod);
    
    const withdrawals = useMemo(() => {
        if (!user) return [];
        return (user.transactions || [])
            .filter(tx => tx.type === 'withdrawal')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [user]);

    useEffect(() => {
        checkRateLimit();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        } else if (isRateLimited) {
            setIsRateLimited(false);
        }
        return () => clearInterval(timer);
    }, [cooldown, isRateLimited]);

    const checkRateLimit = () => {
        const timestamps: number[] = JSON.parse(localStorage.getItem(WITHDRAWAL_TIMESTAMPS_KEY) || '[]');
        const now = Date.now();
        const recentTimestamps = timestamps.filter(ts => now - ts < WITHDRAWAL_WINDOW_MS);
        
        if (recentTimestamps.length >= WITHDRAWAL_LIMIT) {
            setIsRateLimited(true);
            const lastAttempt = recentTimestamps[recentTimestamps.length - 1];
            const timePassed = now - lastAttempt;
            const timeLeft = Math.ceil((WITHDRAWAL_WINDOW_MS - timePassed) / 1000);
            setCooldown(timeLeft > 0 ? timeLeft : 60);
            return true;
        }
        localStorage.setItem(WITHDRAWAL_TIMESTAMPS_KEY, JSON.stringify(recentTimestamps));
        return false;
    };
    
    const handleMaxAmount = () => {
        if (!user) return;
        const max = Math.max(0, user.ktc - WITHDRAWAL_FEE_KTC);
        setAmount(max.toString());
    }

    const handleWithdraw = async () => {
        if (!user) return;
        if (checkRateLimit()) {
             toast({ variant: 'destructive', title: 'Rate limit exceeded', description: 'You have made too many withdrawal attempts. Please try again later.' });
            return;
        }

        const withdrawAmount = parseFloat(amount);
        if (!paymentMethod || !selectedPaymentOption) {
            toast({ variant: 'destructive', title: 'Payment method required', description: 'Please select a payment method.'});
            return;
        }

        let paymentDetails = {};
        let description = '';
        // Validation based on category
        if (selectedPaymentOption?.category === 'mobile-money') {
            if (!mobileNumber || !accountName) {
                toast({ variant: 'destructive', title: 'Mobile money details required', description: 'Please enter the phone number and account name.'});
                return;
            }
            paymentDetails = { type: selectedPaymentOption.type, mobileNumber, accountName };
            description = `Withdrawal to ${selectedPaymentOption.type} (${mobileNumber})`;
        }
        if (selectedPaymentOption?.category === 'bank') {
            if (!bankName || !accountNumber || !accountName) {
                toast({ variant: 'destructive', title: 'Bank details required', description: 'Please fill in all bank account details.'});
                return;
            }
            paymentDetails = { type: selectedPaymentOption.type, bankName, accountNumber, accountName };
            description = `Withdrawal to ${bankName}`;
        }
        if (selectedPaymentOption?.category === 'crypto') {
            if (!walletAddress) {
                toast({ variant: 'destructive', title: 'Wallet address required', description: 'Please enter a valid wallet address.'});
                return;
            }
            paymentDetails = { type: selectedPaymentOption.type, walletAddress };
            description = `Withdrawal to crypto wallet`;
        }


        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid amount to withdraw.'});
            return;
        }
        if (withdrawAmount + WITHDRAWAL_FEE_KTC > user.ktc) {
            toast({ variant: 'destructive', title: 'Insufficient funds', description: 'Your balance is not enough to cover the amount and network fee.'});
            return;
        }

        const totalSpent = withdrawAmount + WITHDRAWAL_FEE_KTC;
        
        await updateUser({ ktc: user.ktc - totalSpent });
        await addTransaction({
            type: 'withdrawal',
            amount: withdrawAmount,
            description,
        });

        setAmount('');
        
        const timestamps: number[] = JSON.parse(localStorage.getItem(WITHDRAWAL_TIMESTAMPS_KEY) || '[]');
        timestamps.push(Date.now());
        localStorage.setItem(WITHDRAWAL_TIMESTAMPS_KEY, JSON.stringify(timestamps));

        toast({
            title: 'Withdrawal Request Submitted',
            description: `Your request to withdraw ${withdrawAmount.toLocaleString()} KTC is being processed.`,
        });
    };
    
    const amountAsUSD = (parseFloat(amount) || 0) * KTC_TO_USD_RATE;
    const totalToReceiveKTC = (parseFloat(amount) || 0);
    const totalToReceiveUGX = totalToReceiveKTC * KTC_TO_UGX_RATE;

    const StatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' }) => {
        const variants = {
            pending: {
                icon: <Hourglass className="h-3 w-3" />,
                text: 'Pending',
                className: 'bg-yellow-500/10 text-yellow-600',
            },
            approved: {
                icon: <CheckCircle className="h-3 w-3" />,
                text: 'Approved',
                className: 'bg-green-500/10 text-green-600',
            },
            rejected: {
                icon: <XCircle className="h-3 w-3" />,
                text: 'Rejected',
                className: 'bg-red-500/10 text-red-600',
            },
        };
        const { icon, text, className } = variants[status as keyof typeof variants] || variants.pending;
        return <Badge variant="outline" className={cn('gap-1 font-normal', className)}>{icon}{text}</Badge>;
    };

    const paginatedWithdrawals = useMemo(() => {
        const startIndex = currentPage * itemsPerPage;
        return withdrawals.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, withdrawals]);
    
    const totalPages = Math.ceil(withdrawals.length / itemsPerPage);
    
    if (!user) return null;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/profile">Profile</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Withdraw</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Download />
                        Withdraw KTC
                    </CardTitle>
                    <CardDescription>Transfer coins from your Kotela wallet to an external account.</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x flex-grow">
                    <CardContent className="space-y-6 pt-0">
                        {isRateLimited && (
                            <Alert variant="destructive">
                                <Hourglass className="h-4 w-4" />
                                <AlertTitle>Too many requests</AlertTitle>
                                <AlertDescription>
                                    You can attempt another withdrawal in {cooldown} seconds.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">To</Label>
                            <Select onValueChange={setPaymentMethod} value={paymentMethod} disabled={isRateLimited}>
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue placeholder="Select a payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentOptions.map(method => {
                                        const Icon = method.icon;
                                        return (
                                            <SelectItem key={method.id} value={method.id}>
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p>{method.type}</p>
                                                        <p className="text-xs text-muted-foreground">{method.details}</p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPaymentOption?.category === 'mobile-money' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="mobileNumber">Phone Number</Label>
                                    <Input 
                                        id="mobileNumber" 
                                        placeholder="e.g. 0771234567" 
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        disabled={isRateLimited}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName">Account Name</Label>
                                    <Input 
                                        id="accountName" 
                                        placeholder="e.g. John Doe"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        disabled={isRateLimited}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedPaymentOption?.category === 'bank' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" placeholder="e.g. Stanbic Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={isRateLimited} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName-bank">Account Name</Label>
                                    <Input id="accountName-bank" placeholder="e.g. John Doe" value={accountName} onChange={(e) => setAccountName(e.target.value)} disabled={isRateLimited} />
                                </div>
                                <div className="space-y-2 col-span-1 sm:col-span-2">
                                    <Label htmlFor="accountNumber">Account Number</Label>
                                    <Input id="accountNumber" placeholder="e.g. 9030001234567" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={isRateLimited} />
                                </div>
                            </div>
                        )}

                        {selectedPaymentOption?.category === 'crypto' && (
                            <div className="space-y-2 animate-in fade-in-50">
                                <Label htmlFor="walletAddress">Wallet Address</Label>
                                <Input id="walletAddress" placeholder="Enter wallet address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} disabled={isRateLimited} />
                            </div>
                        )}
                        

                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <Label htmlFor="amount">Amount</Label>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-yellow-500" />
                                    Balance: {user.ktc.toLocaleString()} KTC
                                </span>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-2xl h-14 pr-24"
                                    disabled={isRateLimited}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className='text-muted-foreground'>KTC</span>
                                    <Button variant="ghost" size="sm" onClick={handleMaxAmount} disabled={isRateLimited}>Max</Button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground text-right">≈ ${amountAsUSD.toFixed(2)}</p>
                        </div>

                        <Card className="bg-muted/50">
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Withdrawal Fee</span>
                                    <span>{WITHDRAWAL_FEE_KTC} KTC</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>You will receive</span>
                                    <span>{totalToReceiveKTC.toLocaleString()} KTC</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span></span>
                                    <span>≈ {totalToReceiveUGX.toLocaleString('en-US', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Button className="w-full" size="lg" onClick={handleWithdraw} disabled={isRateLimited}>
                            Submit Withdraw
                            <ArrowRight className="ml-2" />
                        </Button>
                    </CardContent>
                     <div className="md:pl-6 pt-6 md:pt-0 flex flex-col">
                        {withdrawals.length > 0 ? (
                            <div className='flex flex-col flex-grow'>
                                <h3 className="text-lg font-semibold px-6 md:px-0">Account Debit Notes</h3>
                                <p className="text-sm text-muted-foreground mb-4 px-6 md:px-0">Your recent withdrawal requests and their status.</p>
                                <div className="flex-grow">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Date</TableHead>
                                                <TableHead className="text-xs">Amount</TableHead>
                                                <TableHead className="text-xs">Method</TableHead>
                                                <TableHead className="text-right text-xs">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedWithdrawals.map((w) => (
                                                <TableRow key={w.id}>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(w.timestamp).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-sm">
                                                        {w.amount.toLocaleString()} KTC
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {w.description}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <StatusBadge status={'approved'} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                <h3 className="text-lg font-semibold">No Withdrawals Yet</h3>
                                <p className="text-sm text-muted-foreground">Your withdrawal history will appear here.</p>
                            </div>
                        )}
                         { totalPages > 1 && (
                            <div className="flex justify-between items-center p-2 border-t mt-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={currentPage === 0}
                                >
                                    <ChevronLeft className="mr-1" />
                                    Prev
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    Next
                                    <ChevronRight className="ml-1" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

        </div>
    );
}
