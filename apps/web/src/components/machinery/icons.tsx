import { cn } from '@/lib/utils';

/**
 * Animated machinery icons (one stroke system, 48×48, currentColor). Hover micro-interactions are CSS
 * on a parent `.group`: hook swings, forks lift, wheels spin. Transform-only; reduced motion disables them.
 */
const base = 'size-12 shrink-0';

export function CraneHookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h36M10 8v32M6 40h10M14 8l-4 6" />
      <g className="origin-[32px_8px] transition-transform duration-500 ease-out-expo group-hover:rotate-[8deg] motion-safe:animate-[hook-sway_5s_ease-in-out_infinite]">
        <path d="M32 8v16" />
        <path d="M32 24a5 5 0 1 0 5 5h-3a2 2 0 1 1-2-2z" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function ForkliftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 10v28M6 30h22v8H6zM10 30V18h10l4 12" />
      <circle cx="11" cy="40" r="3" />
      <circle cx="23" cy="40" r="3" />
      <g className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-2">
        <path d="M32 36h12" />
        <rect x="34" y="28" width="9" height="7" rx="1" />
      </g>
    </svg>
  );
}

export function TruckIcon({ className }: { className?: string }) {
  const wheel = 'origin-center transition-transform duration-700 ease-out-expo group-hover:rotate-[360deg] [transform-box:fill-box]';
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14h24v20H4zM28 20h8l6 7v7H28z" />
      <g className={wheel}>
        <circle cx="12" cy="36" r="4" />
        <path d="M12 33v6" />
      </g>
      <g className={wheel}>
        <circle cx="35" cy="36" r="4" />
        <path d="M35 33v6" />
      </g>
    </svg>
  );
}

export function LowbedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 30h30l4-6h8v12H2z" />
      <path d="M8 30v-8h12l3 8" className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
      <circle cx="8" cy="38" r="3" />
      <circle cx="16" cy="38" r="3" />
      <circle cx="40" cy="38" r="3" />
    </svg>
  );
}

export function ParcelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">
        <path d="M24 6l16 8v18l-16 8-16-8V14z" />
        <path d="M8 14l16 8 16-8M24 22v18M16 10l16 8" />
      </g>
    </svg>
  );
}

export function WarehouseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18L24 6l20 12v24H4z" />
      <path d="M12 42V26h24v16M12 32h24" />
      <rect x="16" y="34" width="6" height="6" className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-2" />
    </svg>
  );
}

const map = { crane: CraneHookIcon, hook: CraneHookIcon, forklift: ForkliftIcon, truck: TruckIcon, lowbed: LowbedIcon, parcel: ParcelIcon, warehouse: WarehouseIcon };

/** Icon for a service/category key from the DB (`icon` column), defaulting to the crane hook. */
export function MachineryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name as keyof typeof map] ?? CraneHookIcon;
  return <Icon className={className} />;
}

/** Category → illustration key for equipment cards without photos. */
export const categoryIcon: Record<string, keyof typeof map> = {
  cranes: 'crane',
  forklifts: 'forklift',
  'aerial-lifts': 'forklift',
  earthmoving: 'lowbed',
  handling: 'warehouse',
};
