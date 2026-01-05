'use client';

import type { Id } from 'convex/_generated/dataModel';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminMutations } from '@/hooks/useAdmin';

type CreditAdjustFormProps = {
  userId: Id<'users'>;
  currentBalance: string;
  onSuccess?: () => void;
};

export function CreditAdjustForm({
  userId,
  currentBalance,
  onSuccess,
}: CreditAdjustFormProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { adjustCredits } = useAdminMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate amount
    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum)) {
      setError('Please enter a valid number');
      return;
    }

    // Validate reason
    if (reason.length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await adjustCredits({
        userId,
        amount: amountNum.toFixed(2),
        reason,
      });

      setSuccess(
        `Adjusted credits from ${result.previousBalance} to ${result.newBalance}`,
      );
      setAmount('');
      setReason('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Current balance:
        {' '}
        <span className="font-medium">{currentBalance}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="text"
          placeholder="1.00 or -1.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Use negative numbers to deduct (e.g., -1.00)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          placeholder="Explanation for this adjustment..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Required. Minimum 10 characters. (
          {reason.length}
          /10)
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting || !amount || !reason}>
        {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
      </Button>
    </form>
  );
}
