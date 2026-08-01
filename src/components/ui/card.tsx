import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Keep the bordered, rounded box on mobile too.
   *
   * Almost nothing should. Reach for it only when a panel genuinely has to read
   * as a discrete object floating among others — not for the normal case of a
   * section of a page.
   */
  boxed?: boolean;
}

/**
 * A section of content. Bordered card at `md` and up; a full-bleed band on
 * mobile.
 *
 * A rounded, bordered box inside a 16px page gutter is desktop furniture: on a
 * phone it's a frame around a frame, it costs 32px of width, and a column of
 * them turns a screen into a stack of floating boxes instead of a document. So
 * below `md` the side borders and the radius go, the section runs edge to edge,
 * and only the top and bottom hairlines survive to separate it from its
 * neighbours.
 */
export function Card({ className, boxed = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border-hairline',
        boxed
          ? 'rounded-card border'
          : '-mx-4 border-y md:mx-0 md:rounded-card md:border',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The section's label. On mobile it reads as a heading over the rows below —
 * no divider under it, because a rule there is what makes the group look like
 * a titled card rather than a section of the page.
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 pb-1.5 pt-3.5',
        'md:border-b md:border-hairline md:px-5 md:py-4',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('label-mono', className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3 md:p-5', className)} {...props} />;
}
