'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/** Shared onboarding step footer: Back · Skip · Continue/Finish. */
export function StepFooter({
  onBack,
  onSkip,
  onContinue,
  busy,
  isLast,
  continueLabel,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  onContinue: () => void;
  busy?: boolean;
  isLast?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onSkip && (
          <Button type="button" variant="secondary" onClick={onSkip} disabled={busy}>
            Skip
          </Button>
        )}
        <Button type="button" onClick={onContinue} disabled={busy}>
          {busy && <Spinner className="text-white" />}
          {continueLabel ?? (isLast ? 'Finish' : 'Continue')}
          {!busy && !isLast && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
