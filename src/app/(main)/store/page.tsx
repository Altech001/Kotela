
'use client';

import { Store } from '@/components/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function StorePage() {
  const { user } = useAuth();
  return (
    <div className="container mx-auto">
       <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Store</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                    Enhance your gameplay with boosts and power-ups.
                </CardDescription>
              </div>
              <div className="text-left sm:text-right shrink-0">
                  <p className="text-muted-foreground text-xs">Your Balance</p>
                  <p className="font-bold text-lg">{user?.ktc.toFixed(2)} KTC</p>
              </div>
          </div>
        </CardHeader>
        <CardContent>
           <Store isDialog={false} />
        </CardContent>
       </Card>
    </div>
  );
}
