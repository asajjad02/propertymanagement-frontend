'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OnboardingShell, type StepMeta } from '@/components/onboarding/onboarding-shell';
import { ApartmentTypesStep } from '@/components/onboarding/steps/apartment-types-step';
import { ElectricityRateStep } from '@/components/onboarding/steps/electricity-rate-step';
import { FlatsStep } from '@/components/onboarding/steps/flats-step';
import { SocietyStep } from '@/components/onboarding/steps/society-step';
import { TeamStep } from '@/components/onboarding/steps/team-step';
import { ONBOARDING_DONE_KEY } from '@/lib/onboarding';
import { useAuth } from '@/providers/auth-provider';

const STEPS: StepMeta[] = [
  { key: 'society', title: 'Tell us about your society', desc: 'This names your workspace and appears on your bills.' },
  { key: 'types', title: 'Set up apartment types', desc: 'Each type carries a monthly maintenance charge used on the bill.' },
  { key: 'rate', title: 'Set your electricity rate', desc: 'The per-unit rate applied to metered electricity.' },
  { key: 'flats', title: 'Add your flats', desc: 'Create the units in your property — bulk-add by pasting numbers.' },
  { key: 'team', title: 'Invite your team', desc: 'Add managers, accountants, or guards. This step is optional.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { role, status } = useAuth();
  const [step, setStep] = useState(0);

  // Setup is admin-only; send anyone else to their landing.
  useEffect(() => {
    if (status === 'authenticated' && role && role !== 'admin') router.replace('/');
  }, [status, role, router]);

  function finish() {
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    } catch {
      /* ignore */
    }
    router.replace('/dashboard');
  }

  function next() {
    setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    if (step >= STEPS.length - 1) finish();
  }
  const back = step > 0 ? () => setStep((s) => Math.max(0, s - 1)) : undefined;

  return (
    <OnboardingShell steps={STEPS} current={step} onSkipAll={finish}>
      {step === 0 && <SocietyStep onNext={next} onSkip={next} />}
      {step === 1 && <ApartmentTypesStep onNext={next} onBack={back} onSkip={next} />}
      {step === 2 && <ElectricityRateStep onNext={next} onBack={back} onSkip={next} />}
      {step === 3 && <FlatsStep onNext={next} onBack={back} onSkip={next} />}
      {step === 4 && <TeamStep onNext={next} onBack={back} onSkip={next} />}
    </OnboardingShell>
  );
}
