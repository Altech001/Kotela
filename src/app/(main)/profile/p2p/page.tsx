

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Users, Coins, ThumbsUp, CheckCircle, RefreshCw, SlidersHorizontal, ChevronDown, Filter, Clock, Store, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getActiveP2PListings, getP2PPaymentMethods, getP2PRegions } from '@/lib/actions';
import type { EnrichedP2PListing, P2PPaymentMethod, P2PRegion } from '@/lib/types';

const cryptoCurrencies = ['USDT', 'BTC', 'FDUSD', 'BNB', 'ETH', 'DAI', 'KTC', 'SHIB', 'USDC'];
const fiatCurrencies = ['USDT', 'EUR', 'USD', 'UGX', 'KES', 'NGN'];
const conversionRates: { [key: string]: number } = {
    USDT: 1,
    USD: 1,
    EUR: 0.92,
    UGX: 3800,
    KES: 130,
    NGN: 1500,
};


const P2PTradeDialog = ({ listing, tradeMode, fiatCurrency, children }: { listing: EnrichedP2PListing, tradeMode: 'buy' | 'sell', fiatCurrency: string, children: React.ReactNode }) => {
    const [amount, setAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');

    const handleAmountChange = (value: string) => {
        setAmount(value);
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            setReceiveAmount((numericValue / listing.price).toFixed(6));
        } else {
            setReceiveAmount('');
        }
    };
    
    const handleReceiveAmountChange = (value: string) => {
        setReceiveAmount(value);
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            setAmount((numericValue * listing.price).toFixed(2));
        } else {
            setAmount('');
        }
    }

    const isBuyMode = tradeMode === 'buy';

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isBuyMode ? 'Buy' : 'Sell'} {listing.asset} from {listing.advertiser.displayName}</DialogTitle>
                    <DialogDescription>
                        Price: <span className="font-bold text-primary">{listing.price.toFixed(2)} {fiatCurrency}</span> per {listing.asset}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pay-amount">I want to {isBuyMode ? 'pay' : 'sell'}</Label>
                        <div className="relative">
                            <Input id="pay-amount" value={amount} onChange={(e) => handleAmountChange(e.target.value)} />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{isBuyMode ? fiatCurrency : listing.asset}</span>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="receive-amount">I will receive</Label>
                        <div className="relative">
                            <Input id="receive-amount" value={receiveAmount} onChange={(e) => handleReceiveAmountChange(e.target.value)} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{isBuyMode ? listing.asset : fiatCurrency}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button>{isBuyMode ? `Buy ${listing.asset}` : `Sell ${listing.asset}`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const AdvertiserCard = ({ listing, tradeMode, fiatCurrency }: { listing: EnrichedP2PListing, tradeMode: 'buy' | 'sell', fiatCurrency: string }) => {
    
    const getPaymentColor = (payment: string) => {
        if (payment.toLowerCase().includes('bank transfer')) return 'bg-yellow-500';
        if (payment.toLowerCase().includes('sepa')) return 'bg-blue-500';
        if (payment.toLowerCase().includes('jpesa') || payment.toLowerCase().includes('pesapal')) return 'bg-green-500';
        if (payment.toLowerCase().includes('transid')) return 'bg-purple-500';
        return 'bg-gray-400';
    }

    const priceDisplay = (price: number) => {
        if (price < 10) return price.toFixed(3);
        if (price < 1000) return price.toFixed(2);
        return Math.round(price).toLocaleString();
    }
    const limitDisplay = (limit: number) => {
         if (limit < 1000) return limit.toFixed(2);
         return Math.round(limit).toLocaleString();
    }

    const advertiser = listing.advertiser;

    return (
        <div className="border-b last:border-b-0">
            <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                {/* Advertiser Info */}
                <div className="md:col-span-1">
                    <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={advertiser.avatarUrl} alt={advertiser.displayName} />
                                <AvatarFallback>{advertiser.displayName.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {advertiser.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-base flex items-center gap-1">
                                {advertiser.displayName}
                                {advertiser.isVerified && <CheckCircle className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                                    <span>{advertiser.orders} orders</span>
                                    <span className="hidden sm:block">|</span>
                                    <span>{advertiser.completion.toFixed(2)}% completion</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Avg. Release: {advertiser.avgReleaseTime} min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price */}
                <div className="text-sm">
                    <p className="text-xs text-muted-foreground md:hidden">Price</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{priceDisplay(listing.price)}</span>
                        <span className="text-base text-muted-foreground font-serif">{fiatCurrency}</span>
                    </div>
                </div>
                
                {/* Available / Limit */}
                <div className="text-sm">
                    <p className="text-xs text-muted-foreground md:hidden">Available / Limit</p>
                    <p className="font-semibold">{listing.availableAmount.toLocaleString()} KTC</p>
                    <p className="text-muted-foreground">{limitDisplay(listing.minLimit)} ~ {limitDisplay(listing.maxLimit)} {fiatCurrency}</p>
                </div>

                {/* Payment */}
                <div className='md:col-span-1 text-xs space-y-1'>
                    <p className="text-xs text-muted-foreground md:hidden">Payment Methods</p>
                    {listing.paymentMethods.map(p => (
                        <div key={p} className="flex items-center gap-1.5">
                            <span className={cn("h-3 w-[2px] rounded-full", getPaymentColor(p))}></span>
                            <p>{p}</p>
                        </div>
                    ))}
                </div>

                {/* Trade */}
                <div className="md:col-span-1 flex flex-col items-start md:items-end">
                    <P2PTradeDialog listing={listing} tradeMode={tradeMode} fiatCurrency={fiatCurrency}>
                        <Button className={cn("w-full md:w-auto", listing.type === 'buy' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}>
                           {listing.type === 'buy' ? 'Sell' : 'Buy'} {listing.asset}
                        </Button>
                    </P2PTradeDialog>
                </div>
            </div>
        </div>
    )
}

export default function P2PTransferPage() {
    const { user } = useAuth();
    const [listings, setListings] = useState<EnrichedP2PListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrypto, setSelectedCrypto] = useState('KTC');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('All Payments');
    const [region, setRegion] = useState('All Regions');
    const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
    const [fiatCurrency, setFiatCurrency] = useState('USDT');
    const [allPaymentMethods, setAllPaymentMethods] = useState<P2PPaymentMethod[]>([]);
    const [allRegions, setAllRegions] = useState<P2PRegion[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getActiveP2PListings(),
            getP2PPaymentMethods(),
            getP2PRegions(),
        ]).then(([listingsData, paymentsData, regionsData]) => {
            setListings(listingsData);
            setAllPaymentMethods(paymentsData);
            setAllRegions(regionsData);
            setLoading(false);
        });
    }, []);

    const scaledListings = useMemo(() => {
        const rate = conversionRates[fiatCurrency] || 1;
        return listings.map(ad => ({
            ...ad,
            price: ad.price * rate,
            minLimit: ad.minLimit * rate,
            maxLimit: ad.maxLimit * rate,
        }));
    }, [fiatCurrency, listings]);

    const filteredListings = useMemo(() => {
        let result = scaledListings.filter(l => l.asset === selectedCrypto && l.type !== tradeMode);
        
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount) && numericAmount > 0) {
            result = result.filter(ad => numericAmount >= ad.minLimit && numericAmount <= ad.maxLimit);
        }

        if (paymentMethod !== 'All Payments') {
            const selectedPM = allPaymentMethods.find(pm => pm.id === paymentMethod);
            if (selectedPM) {
                 result = result.filter(ad => ad.paymentMethods.includes(selectedPM.name));
            }
        }
        
        // Region filter logic would go here if data was available

        return result;
    }, [amount, paymentMethod, scaledListings, tradeMode, selectedCrypto, allPaymentMethods]);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
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
                        <BreadcrumbPage>P2P Trading</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                       <div className="flex items-center gap-4">
                           <Tabs defaultValue="buy" onValueChange={(value) => setTradeMode(value as 'buy' | 'sell')} className="w-auto">
                                <TabsList className="p-1 border bg-muted rounded-lg h-auto">
                                    <TabsTrigger value="buy" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Buy</TabsTrigger>
                                    <TabsTrigger value="sell" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Sell</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            {user?.isP2PAdvertiser ? (
                                <Button variant="outline" asChild>
                                    <Link href="/profile/p2p/dashboard">Advertiser Dashboard</Link>
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href="/profile/p2p/apply">Become an Advertiser</Link>
                                </Button>
                            )}
                       </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-start sm:justify-end gap-4 overflow-x-auto pb-2 -mb-2">
                               {cryptoCurrencies.map(crypto => (
                                    <Button 
                                        key={crypto}
                                        variant="ghost" 
                                        size="sm" 
                                        className={cn(
                                            "text-muted-foreground h-auto p-1 flex-shrink-0",
                                            selectedCrypto === crypto && "text-primary font-bold border-b-2 border-primary rounded-none"
                                        )}
                                        onClick={() => setSelectedCrypto(crypto)}
                                    >
                                        {crypto}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
                        <div className="relative w-full md:w-auto md:flex-1">
                            <Input 
                                id="amount" 
                                placeholder="Enter amount" 
                                className="pr-24"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                <span className='h-full w-[1px] bg-border mx-2'></span>
                                <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                                    <SelectTrigger className="h-auto bg-transparent border-0 text-sm font-bold w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fiatCurrencies.map(currency => (
                                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="payment" className="w-full md:w-auto md:flex-1">
                                <SelectValue placeholder="All Payments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Payments">All Payments</SelectItem>
                                {allPaymentMethods.map(method => (
                                    <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger id="regions" className="w-full md:w-auto md:flex-1">
                                <SelectValue placeholder="All Regions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Regions">All Regions</SelectItem>
                                {allRegions.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="hidden md:flex">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden md:grid md:grid-cols-5 gap-4 items-center text-xs font-semibold text-muted-foreground px-4 pb-2 border-b">
                        <div>Advertisers</div>
                        <div>Price</div>
                        <div>Available / Limit</div>
                        <div>Payment</div>
                        <div className="text-right">Trade</div>
                    </div>
                    <div>
                        {loading ? (
                             <div className="flex items-center justify-center p-10">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredListings.length > 0 ? (
                            filteredListings.map(listing => (
                                <AdvertiserCard key={listing.id} listing={listing} tradeMode={tradeMode} fiatCurrency={fiatCurrency} />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground p-10">
                                <p>No advertisers match the current filters.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
