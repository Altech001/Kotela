

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateAdvertiser, getP2PPaymentMethods, getP2PRegions } from '@/lib/actions';
import type { P2PPaymentMethod, P2PRegion } from '@/lib/types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const applicationSchema = z.object({
  paymentMethods: z.array(z.string()).min(1, "Select at least one payment method."),
  regions: z.array(z.string()).min(1, "Select at least one region."),
  asset: z.string().min(1, "Select an asset."),
  fiatCurrency: z.string().min(1, "Select a fiat currency."),
  price: z.coerce.number().positive("Price must be positive."),
  availableAmount: z.coerce.number().positive("Available amount must be positive."),
  minLimit: z.coerce.number().positive("Min limit must be positive."),
  maxLimit: z.coerce.number().positive("Max limit must be positive."),
}).refine(data => data.maxLimit >= data.minLimit, {
  message: "Max limit cannot be less than min limit.",
  path: ["maxLimit"],
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function P2PApplyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [paymentMethods, setPaymentMethods] = useState<P2PPaymentMethod[]>([]);
    const [regions, setRegions] = useState<P2PRegion[]>([]);
    const [loading, setLoading] = useState(true);

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            paymentMethods: [],
            regions: [],
            price: 1.00,
        }
    });

    useEffect(() => {
        if (user?.isP2PAdvertiser) {
            router.replace('/profile/p2p/dashboard');
        }
        if (!user?.isKycVerified) {
             toast({
                title: "KYC Required",
                description: "You must complete KYC verification before applying to be an advertiser.",
                variant: 'destructive',
            });
            router.push('/profile/verify');
        }

        async function fetchData() {
            const [pms, regs] = await Promise.all([getP2PPaymentMethods(), getP2PRegions()]);
            setPaymentMethods(pms);
            setRegions(regs);
            setLoading(false);
        }
        fetchData();
    }, [user, router, toast]);

    const onSubmit = async (data: ApplicationFormValues) => {
        if (!user) return;
        setLoading(true);

        try {
            await createOrUpdateAdvertiser(
                {
                    userId: user.id,
                    displayName: user.name,
                    avatarUrl: user.avatarUrl,
                    isVerified: user.isKycVerified,
                    isOnline: true,
                    supportedPaymentMethods: data.paymentMethods,
                    supportedRegions: data.regions,
                },
                {
                    type: 'buy', // Default to creating a 'buy' ad for KTC
                    asset: 'KTC',
                    fiatCurrency: 'USD',
                    price: data.price,
                    availableAmount: data.availableAmount,
                    minLimit: data.minLimit,
                    maxLimit: data.maxLimit,
                    paymentMethods: data.paymentMethods.map(id => paymentMethods.find(pm => pm.id === id)?.name || ''),
                }
            );
            toast({
                title: "Application Submitted!",
                description: "You are now a P2P advertiser. You are being redirected to your dashboard.",
            });
            setStep(3);
            setTimeout(() => router.push('/profile/p2p/dashboard'), 2000);

        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
            setLoading(false);
        }
    };
    
    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    if (!user || !user.isKycVerified) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><Link href="/profile">Profile</Link></BreadcrumbItem>
                    <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
                    <BreadcrumbItem><Link href="/profile/p2p">P2P Trading</Link></BreadcrumbItem>
                     <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbPage>Become an Advertiser</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader>
                    <CardTitle>Advertiser Application</CardTitle>
                    <CardDescription>Set up your advertiser profile to start creating P2P ads.</CardDescription>
                    <Progress value={(step / 3) * 100} className="mt-4" />
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {step === 1 && (
                        <>
                        <CardContent className="space-y-6">
                            <h3 className="font-semibold">Step 1: Preferences</h3>
                            <div className="space-y-2">
                                <Label>Select supported payment methods</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md">
                                    {paymentMethods.map(item => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="paymentMethods"
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={field.value?.includes(item.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                            ? field.onChange([...field.value, item.id])
                                                            : field.onChange(field.value?.filter(value => value !== item.id))
                                                        }}
                                                    />
                                                    <label htmlFor={item.id} className="text-sm font-medium leading-none">
                                                        {item.name}
                                                    </label>
                                                </div>
                                            )}
                                        />
                                    ))}
                                </div>
                                 {form.formState.errors.paymentMethods && <p className="text-sm font-medium text-destructive">{form.formState.errors.paymentMethods.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Select supported regions</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md">
                                    {regions.map(item => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="regions"
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={field.value?.includes(item.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                            ? field.onChange([...field.value, item.id])
                                                            : field.onChange(field.value?.filter(value => value !== item.id))
                                                        }}
                                                    />
                                                    <label htmlFor={item.id} className="text-sm font-medium leading-none">
                                                        {item.name}
                                                    </label>
                                                </div>
                                            )}
                                        />
                                    ))}
                                </div>
                                 {form.formState.errors.regions && <p className="text-sm font-medium text-destructive">{form.formState.errors.regions.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={nextStep} disabled={!form.watch('paymentMethods').length || !form.watch('regions').length}>Next <ArrowRight/></Button>
                        </CardFooter>
                        </>
                    )}
                    {step === 2 && (
                         <>
                         <CardContent className="space-y-4">
                            <h3 className="font-semibold">Step 2: Create Your First Ad (Buy KTC)</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Price per KTC (in USD)</Label>
                                        <Input type="number" step="0.01" {...field} />
                                         {form.formState.errors.price && <p className="text-sm font-medium text-destructive">{form.formState.errors.price.message}</p>}
                                    </div>
                                )} />
                                <FormField control={form.control} name="availableAmount" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Available to buy (in KTC)</Label>
                                        <Input type="number" {...field} />
                                        {form.formState.errors.availableAmount && <p className="text-sm font-medium text-destructive">{form.formState.errors.availableAmount.message}</p>}
                                    </div>
                                )} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="minLimit" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Minimum Limit (USD)</Label>
                                        <Input type="number" {...field} />
                                         {form.formState.errors.minLimit && <p className="text-sm font-medium text-destructive">{form.formState.errors.minLimit.message}</p>}
                                    </div>
                                )} />
                                <FormField control={form.control} name="maxLimit" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Maximum Limit (USD)</Label>
                                        <Input type="number" {...field} />
                                        {form.formState.errors.maxLimit && <p className="text-sm font-medium text-destructive">{form.formState.errors.maxLimit.message}</p>}
                                    </div>
                                )} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={prevStep}><ArrowLeft /> Back</Button>
                            <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin mr-2"/>}Submit Application</Button>
                        </CardFooter>
                        </>
                    )}
                     {step === 3 && (
                        <CardContent className="flex flex-col items-center justify-center text-center p-10">
                            <CheckCircle className="w-16 h-16 text-green-500 mb-4"/>
                            <h3 className="text-xl font-bold">Application Submitted!</h3>
                            <p className="text-muted-foreground">Redirecting you to your advertiser dashboard...</p>
                        </CardContent>
                    )}
                </form>
            </Card>
        </div>
    );
}
