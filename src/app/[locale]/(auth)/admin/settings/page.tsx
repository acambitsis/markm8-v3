'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AdminAllowlistEditor } from '@/features/admin/AdminAllowlistEditor';
import { useAdminMutations, useAdminPlatformSettings } from '@/hooks/useAdmin';

export default function AdminSettingsPage() {
  const t = useTranslations('AdminSettings');
  const { settings, isLoading } = useAdminPlatformSettings();
  const { updatePlatformSettings } = useAdminMutations();

  const [signupBonus, setSignupBonus] = useState('');
  const [aiConfigJson, setAiConfigJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form values when settings load
  useEffect(() => {
    if (settings && !signupBonus) {
      setSignupBonus(settings.signupBonusAmount);
      setAiConfigJson(JSON.stringify(settings.aiConfig, null, 2));
    }
  }, [settings, signupBonus]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Validate signup bonus
      const bonus = Number.parseFloat(signupBonus);
      if (Number.isNaN(bonus) || bonus < 0) {
        throw new Error('Invalid signup bonus amount');
      }

      // Parse and validate AI config if changed
      let aiConfig;
      if (aiConfigJson !== JSON.stringify(settings?.aiConfig, null, 2)) {
        try {
          aiConfig = JSON.parse(aiConfigJson);
        } catch {
          throw new Error('Invalid JSON in AI configuration');
        }
      }

      await updatePlatformSettings({
        signupBonusAmount: bonus.toFixed(2),
        ...(aiConfig && { aiConfig }),
      });

      setSuccess('Settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Signup Bonus */}
      <Card>
        <CardHeader>
          <CardTitle>{t('signup_bonus')}</CardTitle>
          <CardDescription>{t('signup_bonus_help')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="signupBonus">Credits</Label>
            <Input
              id="signupBonus"
              type="text"
              value={signupBonus}
              onChange={e => setSignupBonus(e.target.value)}
              placeholder="1.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Access */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin_access')}</CardTitle>
          <CardDescription>{t('admin_access_help')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAllowlistEditor />
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('ai_config')}</CardTitle>
          <CardDescription>{t('ai_config_help')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={aiConfigJson}
            onChange={e => setAiConfigJson(e.target.value)}
            rows={15}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('saving') : t('save_changes')}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}
      </div>
    </div>
  );
}
