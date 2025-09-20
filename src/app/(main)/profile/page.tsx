
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Eye, Copy, ShieldCheck, Settings, ArrowRight, Upload, Download, Send, PlusCircle, Globe, Trash2, EyeOff, Users, ArrowRightLeft, ChevronLeft, ChevronRight, LogOut, Power, PowerOff, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User as UserType, Wallet } from '@/lib/types';
import { getReferredUsers } from '@/lib/actions';
import { useGame } from '@/hooks/use-game';


const networks = [
    { id: 'eth', name: 'Ethereum' },
    { id: 'sol', name: 'Solana' },
    { id: 'btc', name: 'Bitcoin' },
    { id: 'bnb', name: 'BNB Smart Chain' },
];

const ReferralDialogContent = ({ user }: { user: UserType | null }) => {
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(0);
    const [referredUsers, setReferredUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 5;

    const referralLink = user ? `https://kotela.com/join/${user.referralCode}` : "";

    useEffect(() => {
        if (user) {
            setLoading(true);
            getReferredUsers(user.id).then(users => {
                setReferredUsers(users);
                setLoading(false);
            });
        }
    }, [user]);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied!",
          description: `${type} copied to clipboard.`,
        });
    };

    const paginatedReferrals = referredUsers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const totalPages = Math.ceil(referredUsers.length / itemsPerPage);

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Referral Details</DialogTitle>
                <DialogDescription>
                    Invite friends and earn rewards when they sign up and start mining.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="referralLink">Your Referral Link</Label>
                    <div className="flex gap-2">
                        <Input id="referralLink" value={referralLink} readOnly />
                        <Button variant="outline" size="icon" onClick={() => handleCopy(referralLink, "Referral Link")}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-2 text-sm font-semibold text-muted-foreground">
                    <span>User</span>
                    <span className="text-right">Profit (KTC)</span>
                </div>
                <ScrollArea className="h-60 pr-4">
                    <div className="space-y-4">
                    {loading ? <p>Loading...</p> : paginatedReferrals.length > 0 ? (
                        paginatedReferrals.map((ref, index) => (
                            <div key={index} className="grid grid-cols-[1fr_auto] items-center gap-4 px-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={ref.avatarUrl} alt={ref.name} />
                                        <AvatarFallback>{ref.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">{ref.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-green-500 text-right">250.00</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">No referred users yet.</p>
                    )}
                    </div>
                </ScrollArea>
            </div>
            {totalPages > 1 && (
                <DialogFooter className='pt-4 sm:justify-between border-t'>
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className='flex gap-2'>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </DialogFooter>
            )}
        </DialogContent>
    )
}


export default function ProfilePage() {
  const { user, updateUser, addWalletAddress, deleteWalletAddress, toggleWalletStatus, logout } = useAuth();
  const { isBalanceVisible } = useGame();
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  const [isDeleteWalletOpen, setIsDeleteWalletOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const { toast } = useToast();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const handleCreateWallet = async () => {
      if (!selectedNetwork) {
          toast({ variant: 'destructive', title: 'Network required', description: 'Please select a network for your new wallet.' });
          return;
      }
      try {
        const networkName = networks.find(n => n.id === selectedNetwork)?.name || 'New';
        await addWalletAddress(networkName);
        setIsCreateWalletOpen(false);
        setSelectedNetwork('');
        toast({
            title: 'Wallet Created',
            description: `A new ${networkName} wallet has been added to your account.`,
        });
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Failed to create wallet', description: error.message });
      }
  }

  const openDeleteDialog = (address: string) => {
    setWalletToDelete(address);
    setIsDeleteWalletOpen(true);
  }

  const handleDeleteWallet = async () => {
      if (walletToDelete) {
          await deleteWalletAddress(walletToDelete);
          toast({
              title: 'Wallet Deleted',
              description: `Wallet has been removed.`,
          });
      }
      setIsDeleteWalletOpen(false);
      setWalletToDelete(null);
  }

  const handleToggleStatus = async (walletId: string) => {
      await toggleWalletStatus(walletId);
      toast({
          title: 'Wallet Status Updated',
          description: `The wallet status has been changed.`,
      });
  }
  
  if (!user) return null;

  const totalBalance = user.ktc;
  const hiddenBalance = "********";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className={cn("h-4 w-4", user.isKycVerified ? "text-green-500" : "text-yellow-500")} />
                <span className={cn("text-sm font-semibold", user.isKycVerified ? "text-green-500" : "text-yellow-500")}>
                  {user.isKycVerified ? 'KYC Verified' : 'KYC Unverified'}
                </span>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <CardTitle>My Wallets</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total Balance:</span>
                    <span className="text-lg font-bold">
                        {isBalanceVisible ? `${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} KTC` : hiddenBalance}
                    </span>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y">
                {(user.wallets || []).map(wallet => (
                    <div key={wallet.id} className="p-4 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Globe className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{wallet.network}</p>
                                <p className="text-xs text-muted-foreground font-mono">{`${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`}</p>
                            </div>
                        </div>
                        <div className={cn("flex items-center gap-1.5 text-xs", wallet.status === 'active' ? 'text-green-500' : 'text-yellow-500')}>
                            <div className={cn('w-2 h-2 rounded-full', wallet.status === 'active' ? 'bg-green-500' : 'bg-yellow-500')}></div>
                            {wallet.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                         <div className="text-center font-mono hidden md:block">
                           {wallet.network === 'Main' && isBalanceVisible ? `${user.ktc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} KTC` : hiddenBalance}
                        </div>
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(wallet.id)}>
                                {wallet.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            {wallet.network !== 'Main' && (
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(wallet.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(wallet.address, `${wallet.network} address`)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
         <CardFooter className="p-4 border-t">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Fiat and Spot</p>
                        <p className="font-semibold">{isBalanceVisible ? `${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} KTC` : hiddenBalance}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Trading Bots</p>
                        <p className="font-semibold">{isBalanceVisible ? `0.00 KTC` : hiddenBalance}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto sm:justify-self-end">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer
                </Button>
            </div>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
            <Link href="/profile/deposit">
              <Upload className="h-6 w-6" />
              <span>Deposit</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
            <Link href="/profile/withdraw">
              <Download className="h-6 w-6" />
              <span>Withdraw</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
            <Link href="/profile/send">
              <Send className="h-6 w-6" />
              <span>Send</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
            <Link href="/profile/p2p">
              <Users className="h-6 w-6" />
              <span>P2P</span>
            </Link>
          </Button>
          <Dialog open={isCreateWalletOpen} onOpenChange={setIsCreateWalletOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4" disabled={(user.wallets || []).length >= 5}>
                    <PlusCircle className="h-6 w-6" />
                    <span>Create Wallet</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Wallet</DialogTitle>
                    <DialogDescription>Select a network to create a new wallet address for deposits and withdrawals.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <Label htmlFor="network">Network</Label>
                    <Select onValueChange={setSelectedNetwork} value={selectedNetwork}>
                        <SelectTrigger id="network">
                            <SelectValue placeholder="Select a network" />
                        </SelectTrigger>
                        <SelectContent>
                            {networks.map(network => (
                                <SelectItem key={network.id} value={network.id} disabled={(user.wallets || []).some(w => w.network === network.name)}>
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <span>{network.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateWalletOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateWallet}>Create Wallet</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

       <Dialog open={isDeleteWalletOpen} onOpenChange={setIsDeleteWalletOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Wallet</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this wallet? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDeleteWalletOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteWallet}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Account</h3>
        <Card>
            <div className="divide-y">
                <Link href="/profile/verify" className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">KYC Verification</p>
                            <p className="text-xs text-muted-foreground">Required for full feature access.</p>
                        </div>
                    </div>
                    <div className={cn("flex items-center gap-2 text-sm", user.isKycVerified ? "text-green-600" : "text-yellow-600")}>
                        <span>{user.isKycVerified ? 'Verified' : 'Unverified'}</span>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </Link>
                 <Link href="/profile/bots" className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">My Bots</p>
                            <p className="text-xs text-muted-foreground">Manage your auto-mining bots.</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Referral</p>
                                    <p className="text-xs text-muted-foreground">Invite friends and earn rewards.</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </DialogTrigger>
                    <ReferralDialogContent user={user} />
                </Dialog>
                 <Link href="/profile/settings" className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                         <div>
                            <p className="font-medium">Settings</p>
                            <p className="text-xs text-muted-foreground">Manage your account settings.</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <div onClick={logout} className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">Logout</p>
                            <p className="text-xs text-muted-foreground">Sign out of your account.</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
