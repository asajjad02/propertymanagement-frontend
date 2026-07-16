'use client';

import { AtriumLogo } from '@/components/brand/atrium-logo';
import { cn } from '@/lib/cn';

export interface StepMeta {
  key: string;
  title: string;
  desc: string;
}

/** Full-screen onboarding chrome: logo, skip, step progress, and the step body. */
export function OnboardingShell({
  steps,
  current,
  onSkipAll,
  children,
}: {
  steps: StepMeta[];
  current: number;
  onSkipAll: () => void;
  children: React.ReactNode;
}) {
  const step = steps[current];
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <AtriumLogo markSize={30} />
        <button onClick={onSkipAll} className="text-sm text-muted transition-colors hover:text-ink">
          Skip setup
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-6 sm:py-10">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <span
                  key={s.key}
                  className={cn(
                    'h-1.5 flex-1 rounded-pill transition-colors',
                    i < current ? 'bg-primary' : i === current ? 'bg-primary' : 'bg-hairline',
                    i === current && 'opacity-100',
                    i > current && 'opacity-100',
                  )}
                />
              ))}
            </div>
            <p className="label-mono mt-3">
              Step {current + 1} of {steps.length}
            </p>
          </div>

          <h1 className="display text-[1.7rem] leading-tight text-ink">{step.title}</h1>
          <p className="mt-1.5 text-sm text-muted">{step.desc}</p>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
