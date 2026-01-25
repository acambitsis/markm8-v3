'use client';

import { useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Brain,
  Clock,
  Cpu,
  ExternalLink,
  GitMerge,
  Hash,
  Info,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Thermometer,
  Type,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';
import type { AiConfig, ReasoningEffort, SynthesisConfig } from '../../../convex/schema';
import { REASONING_EFFORT_OPTIONS } from '../../../convex/schema';

type AIConfigEditorProps = {
  config: AiConfig | null;
  onChange: (config: AiConfig) => void;
};

// Model type from catalog query
type CatalogModel = {
  slug: string;
  name: string;
  provider: string;
  supportsReasoning?: boolean;
  reasoningRequired?: boolean;
  defaultReasoningEffort?: ReasoningEffort;
};

// Internal run type with stable ID for animations
type RunWithId = {
  id: string;
  model: string;
  reasoningEffort?: ReasoningEffort;
};

// Generate a unique ID for runs
function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * AI Config Editor - Wrapper component that handles loading/error states
 * Requires config from database - no hardcoded fallbacks
 */
export function AIConfigEditor({ config, onChange }: AIConfigEditorProps) {
  // Fetch available models from catalog
  const gradingModels = useQuery(api.modelCatalog.getEnabled, { capability: 'grading' });
  const titleModels = useQuery(api.modelCatalog.getEnabled, { capability: 'title' });

  // Loading state
  if (gradingModels === undefined || titleModels === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading AI configuration...</p>
        </div>
      </div>
    );
  }

  // No models in catalog
  if (gradingModels.length === 0 || titleModels.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="font-semibold text-destructive">Configuration Error</h3>
        <p className="mt-2 text-sm text-destructive/80">
          No models found in the catalog. Please seed the model catalog before configuring AI settings.
        </p>
        <code className="mt-2 block text-xs">npx convex run seed/modelCatalog:seed</code>
      </div>
    );
  }

  // No config from database
  if (!config) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="font-semibold text-destructive">Configuration Error</h3>
        <p className="mt-2 text-sm text-destructive/80">
          AI configuration not found in database. Please run the platform settings seed script.
        </p>
        <code className="mt-2 block text-xs">npx convex run seed/platformSettings:seed</code>
      </div>
    );
  }

  // All data available - render the actual editor
  return (
    <AIConfigEditorInner
      config={config}
      onChange={onChange}
      gradingModels={gradingModels}
      titleModels={titleModels}
    />
  );
}

// Inner props with guaranteed non-null values
type AIConfigEditorInnerProps = {
  config: AiConfig;
  onChange: (config: AiConfig) => void;
  gradingModels: CatalogModel[];
  titleModels: CatalogModel[];
};

/**
 * Inner editor component - receives guaranteed non-null props
 */
function AIConfigEditorInner({
  config,
  onChange,
  gradingModels,
  titleModels,
}: AIConfigEditorInnerProps) {
  // Local state for the config
  const [localConfig, setLocalConfig] = useState<AiConfig>(config);

  // Track runs with stable IDs for animations
  const [runsWithIds, setRunsWithIds] = useState<RunWithId[]>(() =>
    config.grading.runs.map(run => ({
      id: generateRunId(),
      model: run.model,
      reasoningEffort: run.reasoningEffort,
    })),
  );

  // Track if we've initialized from config to avoid re-initialization
  const initializedRef = useRef(false);

  // Sync local state when config prop changes (only on initial load)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setLocalConfig(config);
      setRunsWithIds(config.grading.runs.map(run => ({
        id: generateRunId(),
        model: run.model,
        reasoningEffort: run.reasoningEffort,
      })));
    }
  }, [config]);

  // Update grading config
  const updateGrading = useCallback((updates: Partial<AiConfig['grading']>) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev, grading: { ...prev.grading, ...updates } };
      onChange(newConfig);
      return newConfig;
    });
  }, [onChange]);

  // Update title generation config
  const updateTitleGeneration = useCallback((updates: Partial<AiConfig['titleGeneration']>) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev, titleGeneration: { ...prev.titleGeneration, ...updates } };
      onChange(newConfig);
      return newConfig;
    });
  }, [onChange]);

  // Update synthesis config
  const updateSynthesis = useCallback((updates: Partial<SynthesisConfig>) => {
    setLocalConfig((prev) => {
      if (!prev.synthesis) {
        return prev;
      }
      const newConfig = { ...prev, synthesis: { ...prev.synthesis, ...updates } };
      onChange(newConfig);
      return newConfig;
    });
  }, [onChange]);

  // Get first grading model as default for new runs
  const firstGradingModel = gradingModels[0]?.slug ?? '';

  // Add a grading run
  const addGradingRun = useCallback(() => {
    const newRun: RunWithId = { id: generateRunId(), model: firstGradingModel };
    setRunsWithIds(prev => [...prev, newRun]);
    updateGrading({
      runs: [...localConfig.grading.runs, { model: firstGradingModel }],
    });
  }, [firstGradingModel, localConfig.grading.runs, updateGrading]);

  // Remove a grading run by ID
  const removeGradingRun = useCallback((id: string) => {
    if (runsWithIds.length <= 1) {
      return;
    }
    const index = runsWithIds.findIndex(r => r.id === id);
    if (index === -1) {
      return;
    }
    setRunsWithIds(prev => prev.filter(r => r.id !== id));
    const newRuns = localConfig.grading.runs.filter((_, i) => i !== index);
    updateGrading({ runs: newRuns });
  }, [runsWithIds, localConfig.grading.runs, updateGrading]);

  // Helper to check if a model supports reasoning
  const modelSupportsReasoning = useCallback((slug: string) => {
    const model = gradingModels?.find(m => m.slug === slug);
    return model?.supportsReasoning ?? false;
  }, [gradingModels]);

  // Helper to check if a model requires reasoning
  const modelRequiresReasoning = useCallback((slug: string) => {
    const model = gradingModels?.find(m => m.slug === slug);
    return model?.reasoningRequired ?? false;
  }, [gradingModels]);

  // Helper to get default reasoning effort for a model (fallback to 'medium' if not specified)
  const getDefaultReasoningEffort = useCallback((slug: string): ReasoningEffort => {
    const model = gradingModels?.find(m => m.slug === slug);
    return model?.defaultReasoningEffort ?? 'medium';
  }, [gradingModels]);

  // Update a specific grading run's model by ID
  const updateGradingRunModel = useCallback((id: string, model: string) => {
    const index = runsWithIds.findIndex(r => r.id === id);
    if (index === -1) {
      return;
    }
    // When switching models, set default reasoning effort if the new model supports it
    const newReasoningEffort = modelSupportsReasoning(model)
      ? getDefaultReasoningEffort(model)
      : undefined;
    setRunsWithIds(prev => prev.map(r => r.id === id ? { ...r, model, reasoningEffort: newReasoningEffort } : r));
    const newRuns = localConfig.grading.runs.map((run, i) =>
      i === index ? { ...run, model, reasoningEffort: newReasoningEffort } : run,
    );
    updateGrading({ runs: newRuns });
  }, [runsWithIds, localConfig.grading.runs, updateGrading, modelSupportsReasoning, getDefaultReasoningEffort]);

  // Update a specific grading run's reasoning effort by ID
  const updateGradingRunReasoningEffort = useCallback((id: string, effort: ReasoningEffort | undefined) => {
    const index = runsWithIds.findIndex(r => r.id === id);
    if (index === -1) {
      return;
    }
    setRunsWithIds(prev => prev.map(r => r.id === id ? { ...r, reasoningEffort: effort } : r));
    const newRuns = localConfig.grading.runs.map((run, i) =>
      i === index ? { ...run, reasoningEffort: effort } : run,
    );
    updateGrading({ runs: newRuns });
  }, [runsWithIds, localConfig.grading.runs, updateGrading]);

  // Update retry backoff
  const updateBackoff = useCallback((index: number, value: number) => {
    const newBackoff = [...localConfig.grading.retry.backoffMs];
    newBackoff[index] = value;
    updateGrading({
      retry: { ...localConfig.grading.retry, backoffMs: newBackoff },
    });
  }, [localConfig.grading.retry, updateGrading]);

  // Group models by provider for better UX
  const groupByProvider = <T extends { provider: string }>(models: T[] | undefined) =>
    models?.reduce((acc, model) => {
      (acc[model.provider] ??= []).push(model);
      return acc;
    }, {} as Record<string, T[]>);

  const groupedGradingModels = groupByProvider(gradingModels);
  const groupedTitleModels = groupByProvider(titleModels);

  const isLiveMode = localConfig.grading.mode === 'live';
  const synthesisConfig = localConfig.synthesis; // May be undefined if not configured

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Grading Mode Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              <h3 className="font-semibold">Grading Mode</h3>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    <strong>Mock mode:</strong>
                    {' '}
                    Returns simulated grades instantly (for testing)
                  </p>
                  <p className="mt-1">
                    <strong>Live mode:</strong>
                    {' '}
                    Uses real AI models (costs credits)
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isLiveMode ? 'text-muted-foreground' : 'font-medium'}`}>
                Mock
              </span>
              <Switch
                checked={isLiveMode}
                onCheckedChange={(checked: boolean) =>
                  updateGrading({ mode: checked ? 'live' : 'mock' })}
              />
              <span className={`text-sm ${isLiveMode ? 'text-muted-foreground' : 'font-medium'}`}>
                Live
              </span>
            </div>
          </div>

          {isLiveMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span>Live mode will use real AI API calls and consume credits.</span>
            </motion.div>
          )}
        </motion.div>

        {/* Grading Runs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="size-5 text-blue-500" />
              <h3 className="font-semibold">Grading Models</h3>
              <Badge variant="secondary" className="text-xs">
                {runsWithIds.length}
                {' '}
                run
                {runsWithIds.length !== 1 ? 's' : ''}
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Multiple runs improve accuracy through consensus. 3-5 runs recommended.</p>
                </TooltipContent>
              </Tooltip>
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View pricing
                <ExternalLink className="size-3" />
              </a>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGradingRun}
              disabled={runsWithIds.length >= 10}
              className="gap-1"
            >
              <Plus className="size-4" />
              Add Run
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {runsWithIds.map((run, index) => (
                <motion.div
                  key={run.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-sm text-muted-foreground">
                      #
                      {index + 1}
                    </span>
                    <Select
                      value={run.model}
                      onValueChange={value => updateGradingRunModel(run.id, value)}
                    >
                      <SelectTrigger className="min-w-[180px] flex-1">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedGradingModels && Object.entries(groupedGradingModels).map(([provider, models]) => (
                          <SelectGroup key={provider}>
                            <SelectLabel>{provider}</SelectLabel>
                            {models?.map(model => (
                              <SelectItem key={model.slug} value={model.slug}>
                                <div className="flex items-center justify-between gap-4">
                                  <span>{model.name}</span>
                                  {model.supportsReasoning && (
                                    <Brain className="size-3 text-purple-500" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                        {!gradingModels?.length && (
                          <SelectItem value={run.model} disabled>
                            Loading models...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {/* Reasoning effort selector inline (shown when model supports reasoning) */}
                    {modelSupportsReasoning(run.model) && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Brain
                              className={cn(
                                'size-4 shrink-0',
                                modelRequiresReasoning(run.model) ? 'text-purple-600' : 'text-purple-400',
                              )}
                              aria-label={modelRequiresReasoning(run.model)
                                ? 'Reasoning required'
                                : 'Reasoning supported'}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {modelRequiresReasoning(run.model)
                              ? 'This model requires reasoning to function'
                              : 'This model supports optional reasoning'}
                          </TooltipContent>
                        </Tooltip>
                        <Select
                          value={run.reasoningEffort ?? 'medium'}
                          onValueChange={value => updateGradingRunReasoningEffort(run.id, value as ReasoningEffort)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REASONING_EFFORT_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGradingRun(run.id)}
                      disabled={runsWithIds.length <= 1}
                      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Minus className="size-4" />
                    </Button>
                  </div>
                  {/* Warning if reasoning required but not configured */}
                  {modelRequiresReasoning(run.model) && !run.reasoningEffort && (
                    <div className="ml-8 mt-2 flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="size-4" />
                      <span>This model requires reasoning effort to be configured</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {runsWithIds.length < 3 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Tip: 3+ runs recommended for accurate consensus grading
            </p>
          )}
        </motion.div>

        {/* Temperature Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="size-5 text-red-500" />
            <h3 className="font-semibold">Grading Temperature</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Controls randomness in AI responses. Lower = more consistent, higher = more varied.</p>
                <p className="mt-1">Recommended: 0.3-0.5 for grading</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Consistent</span>
              <span className="text-sm font-medium">{localConfig.grading.temperature.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">Creative</span>
            </div>
            <Slider
              value={[localConfig.grading.temperature]}
              onValueChange={([value]: number[]) => updateGrading({ temperature: value })}
              min={0}
              max={1}
              step={0.05}
              className="py-2"
            />
            {localConfig.grading.temperature > 0.5 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Higher temperatures may produce inconsistent grades
              </p>
            )}
          </div>
        </motion.div>

        {/* Outlier Threshold Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            <h3 className="font-semibold">Outlier Threshold</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Grades deviating more than this percentage from the median are excluded from the final score.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Strict (5%)</span>
              <span className="text-sm font-medium">
                {localConfig.grading.outlierThresholdPercent >= 100
                  ? 'Off'
                  : `${localConfig.grading.outlierThresholdPercent}%`}
              </span>
              <span className="text-sm text-muted-foreground">Off (100%)</span>
            </div>
            <Slider
              value={[localConfig.grading.outlierThresholdPercent]}
              onValueChange={([value]: number[]) => updateGrading({ outlierThresholdPercent: value })}
              min={5}
              max={100}
              step={5}
              className="py-2"
            />
          </div>
        </motion.div>

        {/* Retry Configuration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="size-5 text-green-500" />
            <h3 className="font-semibold">Retry Configuration</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Configure how many times to retry failed API calls and the delay between retries.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                min={0}
                max={5}
                value={localConfig.grading.retry.maxRetries}
                onChange={e =>
                  updateGrading({
                    retry: {
                      ...localConfig.grading.retry,
                      maxRetries: Math.max(0, Math.min(5, Number.parseInt(e.target.value) || 0)),
                    },
                  })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="size-3" />
                Backoff Delays (ms)
              </Label>
              <div className="flex gap-2">
                {localConfig.grading.retry.backoffMs.map((ms, index) => (

                  <Input
                    key={`backoff-${index}`} // eslint-disable-line react/no-array-index-key -- position-based array, values can duplicate
                    type="number"
                    min={1000}
                    max={120000}
                    step={1000}
                    value={ms}
                    onChange={e => updateBackoff(index, Number.parseInt(e.target.value) || 5000)}
                    className="w-24 tabular-nums text-center"
                    title={`Retry ${index + 1}: ${(ms / 1000).toFixed(0)}s`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Max Output Tokens Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Hash className="size-5 text-cyan-500" />
            <h3 className="font-semibold">Max Output Tokens</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Maximum tokens the AI can generate in its response. OpenRouter pre-authorizes this amount, which affects budget usage.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={1}
              step={1024}
              value={localConfig.grading.maxTokens}
              onChange={e =>
                updateGrading({
                  maxTokens: Math.max(1, Number.parseInt(e.target.value) || localConfig.grading.maxTokens || 8192),
                })}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t" />

        {/* Title Generation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Type className="size-5 text-indigo-500" />
            <h3 className="font-semibold">Title Generation</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Configure the AI model used to generate essay titles automatically.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={localConfig.titleGeneration.model}
                onValueChange={value => updateTitleGeneration({ model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {groupedTitleModels && Object.entries(groupedTitleModels).map(([provider, models]) => (
                    <SelectGroup key={provider}>
                      <SelectLabel>{provider}</SelectLabel>
                      {models?.map(model => (
                        <SelectItem key={model.slug} value={model.slug}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  {!titleModels?.length && (
                    <SelectItem value={localConfig.titleGeneration.model} disabled>
                      Loading models...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                min={5}
                max={100}
                value={localConfig.titleGeneration.maxTokens}
                onChange={e =>
                  updateTitleGeneration({
                    maxTokens: Math.max(5, Math.min(100, Number.parseInt(e.target.value) || localConfig.titleGeneration.maxTokens)),
                  })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm font-medium">{localConfig.titleGeneration.temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[localConfig.titleGeneration.temperature]}
              onValueChange={([value]: number[]) => updateTitleGeneration({ temperature: value })}
              min={0}
              max={1}
              step={0.05}
              className="py-2"
            />
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t" />

        {/* Feedback Synthesis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="size-5 text-teal-500" />
              <h3 className="font-semibold">Feedback Synthesis</h3>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    <strong>Enabled:</strong>
                    {' '}
                    Uses an LLM to synthesize feedback from all grading models into a unified response
                  </p>
                  <p className="mt-1">
                    <strong>Disabled:</strong>
                    {' '}
                    Uses feedback from the lowest-scoring model (most critical)
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {synthesisConfig && (
              <div className="flex items-center gap-3">
                <span className={cn('text-sm', synthesisConfig.enabled ? 'text-muted-foreground' : 'font-medium')}>
                  Off
                </span>
                <Switch
                  checked={synthesisConfig.enabled}
                  onCheckedChange={(checked: boolean) =>
                    updateSynthesis({ enabled: checked })}
                />
                <span className={cn('text-sm', !synthesisConfig.enabled ? 'text-muted-foreground' : 'font-medium')}>
                  On
                </span>
              </div>
            )}
          </div>

          {!synthesisConfig && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Synthesis configuration not found. Run the migration script to add synthesis config:
              </p>
              <code className="mt-2 block text-xs text-amber-600 dark:text-amber-500">
                npx convex run seed/migrations/addSynthesisConfig:migrate
              </code>
            </div>
          )}

          {synthesisConfig && (
            <AnimatePresence>
              {synthesisConfig.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 rounded-md bg-teal-500/10 p-3 text-sm text-teal-700 dark:text-teal-400">
                    <GitMerge className="size-4 shrink-0" />
                    <span>Synthesis merges feedback from all grading models into a single coherent response.</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Synthesis Model</Label>
                      <Select
                        value={synthesisConfig.model}
                        onValueChange={value => updateSynthesis({ model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupedGradingModels && Object.entries(groupedGradingModels).map(([provider, models]) => (
                            <SelectGroup key={provider}>
                              <SelectLabel>{provider}</SelectLabel>
                              {models?.map(model => (
                                <SelectItem key={model.slug} value={model.slug}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                          {!gradingModels?.length && (
                            <SelectItem value={synthesisConfig.model} disabled>
                              Loading models...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        min={1024}
                        max={16384}
                        step={1024}
                        value={synthesisConfig.maxTokens}
                        onChange={e =>
                          updateSynthesis({
                            maxTokens: Math.max(1024, Math.min(16384, Number.parseInt(e.target.value) || synthesisConfig?.maxTokens || 8192)),
                          })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm font-medium">{synthesisConfig.temperature.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[synthesisConfig.temperature]}
                      onValueChange={([value]: number[]) => updateSynthesis({ temperature: value })}
                      min={0}
                      max={1}
                      step={0.05}
                      className="py-2"
                    />
                    {synthesisConfig.temperature > 0.5 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Higher temperatures may produce inconsistent synthesis
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Debug Preview (collapsible) */}
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="group rounded-lg border bg-muted/30"
        >
          <summary className="flex cursor-pointer items-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Bot className="size-4" />
            View JSON Configuration
          </summary>
          <pre className="overflow-x-auto border-t bg-muted/50 p-3 text-xs">
            {JSON.stringify(localConfig, null, 2)}
          </pre>
        </motion.details>
      </div>
    </TooltipProvider>
  );
}
