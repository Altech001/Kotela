

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getAdvertiserProfile, getAdvertiserListings, updateAdvertiserListing, updateAdvertiserStatus } from '@/lib/actions';
import type { AdvertiserProfile, P2PListing } from '@/lib/types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ChevronRight, Loader2, User, Power, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const listingSchema = z.object({
  price: z.coerce.number().positive(),
  availableAmount: z.coerce.number().min(0),
  minLimit: z.coerce.number().min(0),
  maxLimit: z.coerce.number().min(0),
}).refine(data => data.maxLimit >= data.minLimit, {
  message: "Max limit cannot be less than min limit.",
  path: ["maxLimit"],
});
type ListingFormValues = z.infer<typeof listingSchema>;

export default function AdvertiserDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [profile, setProfile] = useState<AdvertiserProfile | null>(null);
    const [listings, setListings] = useState<P2PListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingListing, setEditingListing] = useState<P2PListing | null>(null);

    const form = useForm<ListingFormValues>();

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        Promise.all([
            getAdvertiserProfile(user.id),
            getAdvertiserListings(user.id),
        ]).then(([prof, lists]) => {
            if (!prof) {
                toast({ title: "Not an advertiser", description: "You have not applied to be an advertiser.", variant: "destructive" });
                router.replace('/profile/p2p/apply');
                return;
            }
            setProfile(prof);
            setListings(lists.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setLoading(false);
        });
    }, [user, router, toast]);

    const handleStatusToggle = async (isOnline: boolean) => {
        if (!user) return;
        setProfile(p => p ? { ...p, isOnline } : null);
        try {
            await updateAdvertiserStatus(user.id, isOnline);
            toast({ title: `You are now ${isOnline ? 'online' : 'offline'}` });
        } catch (error) {
            toast({ title: 'Error updating status', variant: 'destructive' });
            setProfile(p => p ? { ...p, isOnline: !isOnline } : null);
        }
    };
    
    const handleEditClick = (listing: P2PListing) => {
        setEditingListing(listing);
        form.reset({
            price: listing.price,
            availableAmount: listing.availableAmount,
            minLimit: listing.minLimit,
            maxLimit: listing.maxLimit,
        });
    }

    const onListingUpdate = async (data: ListingFormValues) => {
        if (!editingListing) return;
        
        await updateAdvertiserListing(editingListing.id, { ...data });
        
        setListings(listings.map(l => l.id === editingListing.id ? { ...l, ...data } : l));
        setEditingListing(null);
        toast({ title: "Listing updated successfully." });
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
    }
    
    if (!profile) return null; // Should be redirected, but just in case

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><Link href="/profile">Profile</Link></BreadcrumbItem>
                    <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
                    <BreadcrumbItem><Link href="/profile/p2p">P2P Trading</Link></BreadcrumbItem>
                     <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbPage>Advertiser Dashboard</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><User /> Advertiser Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your P2P ads and profile.</p>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <Switch
                        id="online-status"
                        checked={profile.isOnline}
                        onCheckedChange={handleStatusToggle}
                    />
                    <Label htmlFor="online-status" className="font-semibold">
                        {profile.isOnline ? 'Online' : 'Offline'}
                    </Label>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Listings</CardTitle>
                    <CardDescription>The ads you have posted on the P2P marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Asset</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead>Limits</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.length > 0 ? listings.map(l => (
                                <TableRow key={l.id}>
                                    <TableCell>
                                        <Badge variant={l.type === 'buy' ? 'default' : 'secondary'}>{l.type.toUpperCase()}</Badge>
                                    </TableCell>
                                    <TableCell>{l.asset}/{l.fiatCurrency}</TableCell>
                                    <TableCell>{l.price.toFixed(2)}</TableCell>
                                    <TableCell>{l.availableAmount.toLocaleString()}</TableCell>
                                    <TableCell>{l.minLimit} - {l.maxLimit}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(l)}>
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                            </DialogTrigger>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">You have no active listings.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Listing</DialogTitle>
                        <DialogDescription>
                            Update the details for your {editingListing?.asset}/{editingListing?.fiatCurrency} ad.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onListingUpdate)} className="space-y-4 py-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <div className="space-y-2">
                                <Label>Price</Label><Input type="number" step="0.01" {...field} />
                            </div>
                        )} />
                         <FormField control={form.control} name="availableAmount" render={({ field }) => (
                            <div className="space-y-2">
                                <Label>Available Amount</Label><Input type="number" {...field} />
                            </div>
                        )} />
                         <div className="grid grid-cols-2 gap-4">
                           <FormField control={form.control} name="minLimit" render={({ field }) => (
                                <div className="space-y-2">
                                    <Label>Min Limit</Label><Input type="number" {...field} />
                                </div>
                            )} />
                            <FormField control={form.control} name="maxLimit" render={({ field }) => (
                                <div className="space-y-2">
                                    <Label>Max Limit</Label><Input type="number" {...field} />
                                </div>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEditingListing(null)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
