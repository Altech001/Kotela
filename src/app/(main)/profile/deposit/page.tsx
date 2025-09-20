
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Upload, Copy, AlertTriangle, QrCode, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

const KTC_TO_USD_RATE = 1.25;


const QRCodeDisplay = ({ address }: { address: string }) => {
    const modules = Array.from({ length: 25 * 25 }).map((_, i) => {
      const charCode = address.charCodeAt(i % address.length) || 0;
      const randomFactor = (i * 13) % 7 > 3;
      return (charCode % 2 === 0) ? randomFactor : !randomFactor;
    });
  
    return (
        <div className="grid grid-cols-25 w-40 h-40 border-4 border-foreground bg-foreground p-1 rounded-sm">
            {modules.map((isDark, i) => (
                <div key={i} className={cn(isDark ? 'bg-foreground' : 'bg-background')}></div>
            ))}
        </div>
    );
};


export default function DepositPage() {
    const { user, updateUser, addTransaction } = useAuth();
    const [selectedNetwork, setSelectedNetwork] = useState('eth');
    const [amount, setAmount] = useState('');
    const { toast } = useToast();
    
    const walletAddress = user?.walletAddresses[0] || "loading...";

    const handleCopy = () => {
        if(!user) return;
        navigator.clipboard.writeText(user.walletAddresses[0]);
        toast({
            title: "Copied!",
            description: "Wallet address copied to clipboard.",
        });
    };
    
    const handleDeposit = async () => {
        if (!user) return;
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid amount to deposit.",
            });
            return;
        }

        await updateUser({ ktc: user.ktc + depositAmount });
        await addTransaction({
            type: 'deposit',
            amount: depositAmount,
            description: `Deposited from external wallet`
        });

        setAmount('');
        toast({
            title: "Deposit Successful!",
            description: `You have successfully deposited ${depositAmount.toLocaleString()} KTC. Your balance has been updated.`
        });
    }
    
    const amountAsUSD = (parseFloat(amount) || 0) * KTC_TO_USD_RATE;

    const networks = [
        { id: 'eth', name: `Kotela (KTC) - ${user?.walletAddresses[0]}` },
        { id: 'sol', name: 'Solana' },
        { id: 'btc', name: 'Bitcoin' },
        { id: 'bnb', name: 'BNB Smart Chain' },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/profile">Profile</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Deposit</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Upload />
                        Deposit KTC
                    </CardTitle>
                    <CardDescription>Select a network and send crypto to the address below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="network">Network</Label>
                                <Select onValueChange={setSelectedNetwork} value={selectedNetwork}>
                                    <SelectTrigger id="network">
                                        <SelectValue placeholder="Select a network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {networks.map(network => (
                                            <SelectItem key={network.id} value={network.id}>
                                                {network.name.length > 30 ? `${network.name.substring(0, 30)}...` : network.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="amount">Amount to Deposit</Label>
                                <div className="relative">
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pr-16"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">KTC</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-right">≈ ${amountAsUSD.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="text-center space-y-4 p-4 bg-muted rounded-lg flex flex-col items-center">
                            <div className="bg-background p-2 inline-block rounded-lg shadow-md">
                               <QRCodeDisplay address={walletAddress} />
                            </div>
                             <div>
                                <p className="text-xs text-muted-foreground mt-2">Your Wallet Address</p>
                                <p className="text-sm font-mono break-all my-2 p-2 bg-background rounded-md">{walletAddress}</p>
                                <Button variant="ghost" onClick={handleCopy} className="text-primary w-full">
                                    <Copy className="mr-2" />
                                    Copy Address
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Only send KTC to this address.</li>
                              <li>Ensure the network you choose to deposit from matches the network you've selected above.</li>
                              <li>Deposits will be credited after network confirmations.</li>
                          </ul>
                      </AlertDescription>
                    </Alert>

                </CardContent>
                <CardFooter>
                    <Button onClick={handleDeposit} className="w-full" size="lg">
                        Simulate Deposit
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
