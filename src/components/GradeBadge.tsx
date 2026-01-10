import { getGradeHex } from '@/utils/gradeColors';
import { cn } from '@/utils/Helpers';

import type { PercentageRange } from '../../convex/schema';

type Props = {
  percentageRange: PercentageRange;
  className?: string;
};

/**
 * Feathered grade badge - edges fade out to communicate uncertainty
 * The visual treatment suggests "this is a range, not a precise value"
 */
export function GradeBadge({ percentageRange, className }: Props) {
  const { lower, upper } = percentageRange;
  const mid = (lower + upper) / 2;
  const hex = getGradeHex(mid);

  const displayText = lower === upper
    ? `${lower}%`
    : `${lower}–${upper}%`;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white',
        className,
      )}
      style={{
        background: `linear-gradient(90deg,
          transparent 0%,
          ${hex}90 15%,
          ${hex} 35%,
          ${hex} 65%,
          ${hex}90 85%,
          transparent 100%
        )`,
      }}
    >
      {displayText}
    </span>
  );
}
