
'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';

export function BalanceToggle() {
  const { isBalanceVisible, toggleBalanceVisibility } = useGame();

  return (
    <Button variant="ghost" size="icon" onClick={toggleBalanceVisibility}>
      {isBalanceVisible ? <EyeOff /> : <Eye />}
      <span className="sr-only">Toggle balance visibility</span>
    </Button>
  );
}
