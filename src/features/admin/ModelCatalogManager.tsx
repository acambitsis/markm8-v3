'use client';

import { useMutation, useQuery } from 'convex/react';
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';
import type { ModelCapability } from '../../../convex/schema';

// OpenRouter model structure
type OpenRouterModel = {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
};

// Provider name mapping
const PROVIDER_MAP: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'google': 'Google',
  'meta-llama': 'Meta',
  'x-ai': 'xAI',
  'mistralai': 'Mistral',
  'cohere': 'Cohere',
  'deepseek': 'DeepSeek',
  'qwen': 'Qwen',
  'perplexity': 'Perplexity',
};

function extractProvider(modelId: string): string {
  const [provider] = modelId.split('/');
  return PROVIDER_MAP[provider ?? ''] ?? provider ?? 'Unknown';
}

function formatPrice(pricePerToken: string): string {
  const price = Number.parseFloat(pricePerToken);
  if (Number.isNaN(price) || price === 0) {
    return 'Free';
  }
  // Convert to per 1M tokens
  const perMillion = price * 1_000_000;
  if (perMillion < 0.01) {
    return '<$0.01/M';
  }
  return `$${perMillion.toFixed(2)}/M`;
}

export function ModelCatalogManager() {
  const catalogModels = useQuery(api.admin.getModelCatalog);
  const addModel = useMutation(api.admin.addModelToCatalog);
  const removeModel = useMutation(api.admin.removeModelFromCatalog);
  const toggleModel = useMutation(api.admin.toggleModelEnabled);

  // OpenRouter models state
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);
  const [capabilities, setCapabilities] = useState<ModelCapability[]>(['grading']);
  const [supportsReasoning, setSupportsReasoning] = useState(false);

  // Action state
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch OpenRouter models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setLoadError(null);
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        setOpenRouterModels(data.data || []);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const catalogSlugs = new Set(catalogModels?.map(m => m.slug) ?? []);

    return openRouterModels
      .filter(model =>
        (model.id.toLowerCase().includes(query)
          || model.name.toLowerCase().includes(query))
          && !catalogSlugs.has(model.id), // Exclude already added models
      )
      .slice(0, 20); // Limit results
  }, [searchQuery, openRouterModels, catalogModels]);

  // Handle model selection
  const handleSelectModel = useCallback((model: OpenRouterModel) => {
    setSelectedModel(model);
    setSearchQuery(model.name);
    setIsDropdownOpen(false);

    // Auto-detect capabilities based on model name/size
    const isSmallModel
      = model.id.includes('mini')
      || model.id.includes('flash')
      || model.id.includes('haiku')
      || model.id.includes('fast');

    setCapabilities(isSmallModel ? ['grading', 'title'] : ['grading']);

    // Auto-detect reasoning support
    const hasReasoning
      = model.id.includes('o1')
      || model.id.includes('o3')
      || model.id.includes('reasoning')
      || model.id.includes('think');

    setSupportsReasoning(hasReasoning);
  }, []);

  // Handle adding model to catalog
  const handleAddModel = async () => {
    if (!selectedModel) {
      return;
    }

    setIsAdding(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addModel({
        slug: selectedModel.id,
        name: selectedModel.name,
        provider: extractProvider(selectedModel.id),
        capabilities,
        contextLength: selectedModel.context_length,
        supportsReasoning: supportsReasoning || undefined,
      });

      setActionSuccess(`Added "${selectedModel.name}" to catalog`);
      setSelectedModel(null);
      setSearchQuery('');
      setCapabilities(['grading']);
      setSupportsReasoning(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle removing model
  const handleRemoveModel = async (slug: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await removeModel({ slug });
      setActionSuccess('Model removed from catalog');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove model');
    }
  };

  // Handle toggling model enabled status
  const handleToggleModel = async (slug: string, enabled: boolean) => {
    setActionError(null);

    try {
      await toggleModel({ slug, enabled });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update model');
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedModel(null);
    setSearchQuery('');
    setCapabilities(['grading']);
    setSupportsReasoning(false);
    inputRef.current?.focus();
  };

  // Toggle capability
  const toggleCapability = (cap: ModelCapability) => {
    setCapabilities(prev =>
      prev.includes(cap)
        ? prev.filter(c => c !== cap)
        : [...prev, cap],
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Model Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Add Model from OpenRouter</Label>
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Browse all models
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Search Input with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={isLoadingModels ? 'Loading models...' : 'Search OpenRouter models...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedModel(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="pl-9 pr-9"
              disabled={isLoadingModels}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {isDropdownOpen && filteredModels.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-lg">
              {filteredModels.map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.id}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{formatPrice(model.pricing.prompt)}</div>
                    <div>
                      {(model.context_length / 1000).toFixed(0)}
                      k ctx
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isDropdownOpen && searchQuery && filteredModels.length === 0 && !isLoadingModels && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-lg">
              No models found matching "
              {searchQuery}
              "
            </div>
          )}
        </div>

        {loadError && (
          <p className="text-sm text-destructive">{loadError}</p>
        )}

        {/* Selected Model Details */}
        {selectedModel && (
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{selectedModel.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedModel.id}</p>
              </div>
              <Badge variant="secondary">{extractProvider(selectedModel.id)}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Context: </span>
                <span>
                  {(selectedModel.context_length / 1000).toFixed(0)}
                  k tokens
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Input: </span>
                <span>{formatPrice(selectedModel.pricing.prompt)}</span>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <Label className="text-sm">Capabilities</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={capabilities.includes('grading') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCapability('grading')}
                >
                  {capabilities.includes('grading') && <Check className="mr-1 size-3" />}
                  Grading
                </Button>
                <Button
                  type="button"
                  variant={capabilities.includes('title') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCapability('title')}
                >
                  {capabilities.includes('title') && <Check className="mr-1 size-3" />}
                  Title Generation
                </Button>
              </div>
            </div>

            {/* Reasoning Support */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reasoning" className="text-sm">Supports Reasoning</Label>
              <Switch
                id="reasoning"
                checked={supportsReasoning}
                onCheckedChange={setSupportsReasoning}
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAddModel}
              disabled={isAdding || capabilities.length === 0}
              className="w-full gap-2"
            >
              {isAdding
                ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Adding...
                    </>
                  )
                : (
                    <>
                      <Plus className="size-4" />
                      Add to Catalog
                    </>
                  )}
            </Button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <X className="size-4" />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600">
          <Check className="size-4" />
          {actionSuccess}
        </div>
      )}

      {/* Current Catalog Models */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Current Model Catalog</Label>

        {catalogModels === undefined
          ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )
          : catalogModels.length === 0
            ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No models in catalog. Add models above.
                </p>
              )
            : (
                <div className="divide-y rounded-lg border">
                  {catalogModels.map(model => (
                    <div
                      key={model._id}
                      className={cn(
                        'flex items-center justify-between p-3',
                        !model.enabled && 'opacity-60',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {model.provider}
                          </Badge>
                          {model.supportsReasoning && (
                            <Badge variant="secondary" className="text-xs">
                              Reasoning
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{model.slug}</span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{model.capabilities.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={model.enabled}
                          onCheckedChange={enabled => handleToggleModel(model.slug, enabled)}
                          aria-label={model.enabled ? 'Disable model' : 'Enable model'}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveModel(model.slug)}
                          className="size-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
      </div>
    </div>
  );
}
