'use client';
import { useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

type KycStep = 'personal' | 'address' | 'id' | 'review' | 'complete';

export default function KycPage() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<KycStep>('personal');
  const [progress, setProgress] = useState(25);
  
  if(user?.isKycVerified) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center text-center space-y-4 h-full">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h1 className="text-2xl font-bold">You are already verified!</h1>
        <p className="text-muted-foreground">You have full access to all features of Kotela.</p>
        <Button asChild><Link href="/profile">Go to Profile</Link></Button>
      </div>
    )
  }

  const nextStep = (next: KycStep, newProgress: number) => {
    setStep(next);
    setProgress(newProgress);
  };
  
  const handleComplete = () => {
    updateUser({ isKycVerified: true });
    nextStep('complete', 100);
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification (KYC)</CardTitle>
          <CardDescription>
            Complete the steps to verify your identity and unlock all features.
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent>
          {step === 'personal' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 1: Personal Information</h3>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" />
              </div>
              <Button onClick={() => nextStep('address', 50)} className="w-full">
                Next
              </Button>
            </div>
          )}

          {step === 'address' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 2: Address</h3>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="10001" />
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => nextStep('personal', 25)} variant="outline" className="w-full">Back</Button>
                <Button onClick={() => nextStep('id', 75)} className="w-full">Next</Button>
              </div>
            </div>
          )}

          {step === 'id' && (
            <div className="space-y-4 text-center">
              <h3 className="font-semibold text-lg">Step 3: Document Upload</h3>
              <p className="text-sm text-muted-foreground">Use your camera to take a picture of your government-issued ID.</p>
              <div className="aspect-video w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center bg-muted/50">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Camera functionality is simulated</p>
              </div>
               <div className="flex gap-4">
                <Button onClick={() => nextStep('address', 50)} variant="outline" className="w-full">Back</Button>
                <Button onClick={() => nextStep('review', 100)} className="w-full">Simulate Scan</Button>
              </div>
            </div>
          )}
          
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 4: Review and Submit</h3>
              <p className="text-sm text-muted-foreground">Please review your information. This is a simulation, so submitting will instantly verify your account.</p>
              <div className="flex gap-4">
                <Button onClick={() => nextStep('id', 75)} variant="outline" className="w-full">Back</Button>
                <Button onClick={handleComplete} className="w-full">Submit for Verification</Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
             <div className="space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="font-semibold text-lg">Verification Complete!</h3>
                <p className="text-sm text-muted-foreground">Thank you. Your identity has been verified.</p>
                <Button asChild className="w-full"><Link href="/profile">Go to Profile</Link></Button>
             </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
