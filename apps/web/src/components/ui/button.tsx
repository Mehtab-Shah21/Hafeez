import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Pill buttons. Hover/press use transform only; the chevron nudges toward the reading
 * direction and is mirrored in RTL via `rtl:-scale-x-100`.
 */
const buttonVariants = cva(
  'group inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[transform,background-color,color,box-shadow] duration-200 ease-out-quart active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-yellow text-navy shadow-cta hover:bg-yellow-600',
        secondary: 'bg-navy text-offwhite hover:bg-navy-700',
        outline: 'border border-navy/20 bg-transparent text-navy hover:border-navy/40 hover:bg-navy/5',
        glass: 'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20',
        ghost: 'text-navy hover:bg-navy/5',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-12 px-6 text-[0.95rem]',
        lg: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a router Link) with button styles. */
  asChild?: boolean;
  /** Show the trailing chevron. Defaults to true for the primary variant. */
  chevron?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, chevron, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const showChevron = chevron ?? (variant === 'primary' || variant == null);
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        <Slottable>{children}</Slottable>
        {showChevron && (
          <span
            aria-hidden="true"
            className="-me-1 grid size-7 place-items-center rounded-full bg-navy/10 transition-transform duration-200 ease-out-quart group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          >
            <ChevronRight strokeWidth={2.5} />
          </span>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
