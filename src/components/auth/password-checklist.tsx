import { Check, Circle } from 'lucide-react';

import { cn } from '@/lib/cn';
import { passwordRules } from '@/lib/validation';

/** Live checklist of password rules; each turns green as it's satisfied. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="space-y-1.5">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-sm">
            {met ? (
              <Check className="h-4 w-4 text-ok" />
            ) : (
              <Circle className="h-4 w-4 text-faint" />
            )}
            <span className={cn(met ? 'text-ink font-medium' : 'text-muted')}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
