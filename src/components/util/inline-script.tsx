'use client';

/**
 * Renders an inline script that runs synchronously during HTML parsing (before
 * first paint) on the server, and is inert on the client — the Next.js-documented
 * way to avoid React's dev warning about rendering <script> tags while still
 * preventing a flash before hydration.
 *
 * On the server the tag is `type="text/javascript"` (executes during parse); on
 * the client it renders `type="text/plain"` (inert), and `suppressHydrationWarning`
 * tells React to accept the server DOM. See Next docs:
 * app/guides/preventing-flash-before-hydration.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
