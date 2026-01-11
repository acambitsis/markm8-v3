'use client';

import { motion } from 'framer-motion';
import { Bot, Check, Coins, DollarSign, Loader2, Radio, Settings, Shield, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminAllowlistEditor } from '@/features/admin/AdminAllowlistEditor';
import { AIConfigEditor } from '@/features/admin/AIConfigEditor';
import { SentryTestCard } from '@/features/admin/SentryTestCard';
import { useAdminMutations, useAdminPlatformSettings } from '@/hooks/useAdmin';

import type { AiConfig } from '../../../../../../convex/schema';

export default function AdminSettingsPage() {
  const { settings, isLoading } = useAdminPlatformSettings();
  const { updatePlatformSettings } = useAdminMutations();

  const [signupBonus, setSignupBonus] = useState('');
  const [gradingCost, setGradingCost] = useState('');
  const [creditsPerDollar, setCreditsPerDollar] = useState('');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form values when settings load
  useEffect(() => {
    if (settings) {
      if (!signupBonus) {
        setSignupBonus(settings.signupBonusAmount);
      }
      if (!gradingCost && settings.gradingCostPerEssay) {
        setGradingCost(settings.gradingCostPerEssay);
      }
      if (!creditsPerDollar && settings.creditsPerDollar) {
        setCreditsPerDollar(settings.creditsPerDollar);
      }
      if (!aiConfig && settings.aiConfig) {
        setAiConfig(settings.aiConfig);
      }
    }
  }, [settings, signupBonus, gradingCost, creditsPerDollar, aiConfig]);

  // Handle AI config changes
  const handleAiConfigChange = useCallback((newConfig: AiConfig) => {
    setAiConfig(newConfig);
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }, []);

  // Handle signup bonus changes
  const handleSignupBonusChange = useCallback((value: string) => {
    setSignupBonus(value);
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }, []);

  // Handle pricing changes
  const handleGradingCostChange = useCallback((value: string) => {
    setGradingCost(value);
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }, []);

  const handleCreditsPerDollarChange = useCallback((value: string) => {
    setCreditsPerDollar(value);
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }, []);

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

      // Validate grading cost
      const cost = Number.parseFloat(gradingCost);
      if (Number.isNaN(cost) || cost <= 0) {
        throw new Error('Grading cost must be a positive number');
      }

      // Validate credits per dollar
      const cpd = Number.parseFloat(creditsPerDollar);
      if (Number.isNaN(cpd) || cpd <= 0) {
        throw new Error('Credits per dollar must be a positive number');
      }

      // Validate AI config
      if (aiConfig) {
        if (aiConfig.grading.runs.length < 1) {
          throw new Error('At least one grading run is required');
        }
        if (aiConfig.grading.runs.length > 10) {
          throw new Error('Maximum 10 grading runs allowed');
        }
        if (aiConfig.grading.temperature < 0 || aiConfig.grading.temperature > 1) {
          throw new Error('Grading temperature must be between 0 and 1');
        }
        if (aiConfig.titleGeneration.temperature < 0 || aiConfig.titleGeneration.temperature > 1) {
          throw new Error('Title generation temperature must be between 0 and 1');
        }
      }

      await updatePlatformSettings({
        signupBonusAmount: bonus.toFixed(2),
        gradingCostPerEssay: cost.toFixed(2),
        creditsPerDollar: cpd.toFixed(2),
        ...(aiConfig && { aiConfig }),
      });

      setSuccess('Settings saved successfully');
      setHasChanges(false);
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
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Platform Settings</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Configure platform-wide settings</p>
      </motion.div>

      <div className="space-y-6">
        {/* Signup Bonus */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <Coins className="size-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold">Signup Bonus</h2>
                <p className="text-sm text-muted-foreground">Credits given to new users on signup</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="signupBonus" className="text-muted-foreground">Credits</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signupBonus"
                  type="text"
                  value={signupBonus}
                  onChange={e => handleSignupBonusChange(e.target.value)}
                  placeholder="1.00"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="size-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold">Pricing</h2>
                <p className="text-sm text-muted-foreground">Essay grading cost and credit rates</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gradingCost" className="text-muted-foreground">Grading Cost (credits)</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="gradingCost"
                  type="text"
                  value={gradingCost}
                  onChange={e => handleGradingCostChange(e.target.value)}
                  placeholder="1.00"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Credits charged per essay graded</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditsPerDollar" className="text-muted-foreground">Credits per Dollar</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="creditsPerDollar"
                  type="text"
                  value={creditsPerDollar}
                  onChange={e => handleCreditsPerDollarChange(e.target.value)}
                  placeholder="1.00"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Credits received per $1 spent</p>
            </div>
            {/* Calculated price display - validate both values to prevent NaN/Infinity */}
            {(() => {
              const cost = Number.parseFloat(gradingCost);
              const cpd = Number.parseFloat(creditsPerDollar);
              const isValid = !Number.isNaN(cost) && !Number.isNaN(cpd) && cpd > 0 && cost >= 0;
              if (!isValid) {
                return null;
              }
              return (
                <div className="col-span-full rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Price per essay: </span>
                    <span className="font-semibold">
                      $
                      {(cost / cpd).toFixed(2)}
                    </span>
                  </p>
                </div>
              );
            })()}
          </div>
        </motion.div>

        {/* Admin Access */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Admin Access</h2>
                <p className="text-sm text-muted-foreground">Email addresses with admin access</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <AdminAllowlistEditor />
          </div>
        </motion.div>

        {/* AI Configuration */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Bot className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold">AI Configuration</h2>
                <p className="text-sm text-muted-foreground">Configure AI grading and title generation models</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <AIConfigEditor
              config={aiConfig}
              onChange={handleAiConfigChange}
            />
          </div>
        </motion.div>

        {/* Monitoring */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Radio className="size-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold">Monitoring</h2>
                <p className="text-sm text-muted-foreground">Test error tracking and alerting</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <SentryTestCard />
          </div>
        </motion.div>

        {/* Save Button - Sticky at bottom */}
        <motion.div
          className="sticky bottom-4 flex items-center gap-4 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn-lift gap-2"
            size="lg"
          >
            {isSaving
              ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                )
              : 'Save Changes'}
          </Button>

          {!hasChanges && !error && !success && (
            <span className="text-sm text-muted-foreground">
              No unsaved changes
            </span>
          )}

          {error && (
            <motion.div
              className="flex items-center gap-2 text-sm text-destructive"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <X className="size-4" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="flex items-center gap-2 text-sm text-green-600"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Check className="size-4" />
              {success}
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
