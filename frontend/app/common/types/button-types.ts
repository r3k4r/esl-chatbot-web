export type ButtonHeight = 'auto' | '24' | '28' | '32' | '36' | '38' | '40' | '44' | '48' | '52' | '56'
export type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'brand' | 'dark-ghost' | 'ink'
export type ButtonRadius = 'none' | 'full' | '4' | '8' | '12' | '16'


export const buttonSizeClasses: Record<ButtonHeight, string> = {
  'auto': 'h-auto',
  '24': 'h-6 text-xs',
  '28': 'h-7 text-xs',
  '32': 'h-8 text-sm',
  '36': 'h-9 text-sm',
  '38': 'h-9.5 text-sm',
  "40": 'h-10 text-sm',
  '44': 'h-11 text-base',
  '48': 'h-12 text-base',
  '52': 'h-[52px] text-[15px]',
  '56': 'h-14 text-[15px]',
}
export const buttonRadiusClasses: Record<ButtonRadius, string> = {
  'none': 'rounded-0',
  '4': 'rounded-sm',
  '8': 'rounded-lg',
  '12': 'rounded-xl',
  '16': 'rounded-2xl',
  'full': 'rounded-full',
}

// dark: classes only ever apply in the dashboard (public pages are always light).
const disabledClasses = 'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-neutral-100 dark:disabled:bg-surface-raised disabled:border-neutral-200 dark:disabled:border-border-card disabled:text-neutral-400 dark:disabled:text-text-subtle disabled:icon-neutral-400';

export const variantClasses: Record<Variant, string> = {
  'primary': `${disabledClasses} bg-linear-to-br border border-transparent from-primary-500 active:bg-clip-padding active:outline active:outline-primary-500 to-primary-300 hover:from-primary-500 hover:to-primary-400 justify-center px-4 text-neutral-50 icon-neutral-50`,
  'secondary': `${disabledClasses} bg-surface-raised border border-border-card text-text-body justify-center px-4 hover:bg-surface-well hover:text-text-heading active:bg-surface-well`,
  'outline': `${disabledClasses} bg-transparent border border-border-card text-text-body justify-center px-4 hover:bg-surface-raised hover:text-text-heading active:bg-surface-well`,
  'ghost': `${disabledClasses} bg-transparent border border-transparent text-text-body justify-center px-4 hover:bg-surface-raised hover:text-text-heading active:bg-surface-well`,
  'danger': `${disabledClasses} bg-destructive border border-destructive text-neutral-50 icon-destructive-foreground justify-center px-4 hover:bg-destructive/90 active:bg-destructive/80`,
  'brand': `${disabledClasses} justify-center px-5 font-semibold text-brand-ink bg-linear-to-b from-brand-primary to-primary-400 border border-brand-primary/70 ring-1 ring-primary-300/40 shadow-lg shadow-brand-primary/40 hover:brightness-110 active:brightness-95`,
  'dark-ghost': `${disabledClasses} justify-center px-5 font-medium text-neutral-50/90 bg-neutral-50/3 border border-neutral-50/15 hover:bg-neutral-50/6 active:bg-neutral-50/8`,
  'ink': `${disabledClasses} justify-center px-5 font-semibold bg-brand-ink text-neutral-50 border border-brand-ink hover:bg-neutral-800 active:bg-neutral-900`,
}

export const activeClasses: Record<Variant, string> = {
  'primary': 'bg-clip-padding! outline! outline-primary-500!',
  'secondary': 'bg-surface-well! text-text-heading!',
  'outline': 'bg-surface-well! text-text-heading!',
  'ghost': 'bg-surface-well! text-text-heading!',
  'danger': 'bg-destructive/90! outline! outline-destructive!',
  'brand': 'brightness-95!',
  'dark-ghost': 'bg-neutral-50/8!',
  'ink': 'bg-neutral-900!',
}
