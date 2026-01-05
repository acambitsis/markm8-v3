'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminMutations, useAdminPlatformSettings } from '@/hooks/useAdmin';

export function AdminAllowlistEditor() {
  const { settings, isLoading } = useAdminPlatformSettings();
  const { addAdminEmail, removeAdminEmail } = useAdminMutations();
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminEmails = settings?.adminEmails ?? [];

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsAdding(true);
    try {
      await addAdminEmail({ email: newEmail });
      setNewEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add email');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    setError(null);
    setRemovingEmail(email);
    try {
      await removeAdminEmail({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove email');
    } finally {
      setRemovingEmail(null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current admins list */}
      <div className="space-y-2">
        {adminEmails.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                No admin emails configured
              </p>
            )
          : (
              adminEmails.map(email => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={removingEmail === email}
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                    <span className="sr-only">
                      Remove
                      {email}
                    </span>
                  </Button>
                </div>
              ))
            )}
      </div>

      {/* Add new admin form */}
      <form onSubmit={handleAddEmail} className="flex gap-2">
        <Input
          type="email"
          placeholder="email@example.com"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          disabled={isAdding}
          className="flex-1"
        />
        <Button type="submit" disabled={isAdding || !newEmail}>
          {isAdding ? 'Adding...' : 'Add Admin'}
        </Button>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
