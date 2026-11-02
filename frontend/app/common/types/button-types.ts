export type ButtonHeight = 'auto' | '24' | '28' | '32' | '36' | '38' | '40' | '44' | '48' | '52' | '56'
export type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'brand' | 'dark-ghost' | 'ink' | 'navy'
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

const disabledClasses = 'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:border-neutral-200 dark:disabled:border-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-500 disabled:icon-neutral-400 dark:disabled:icon-neutral-500';

export const variantClasses: Record<Variant, string> = {
  'primary': `${disabledClasses} bg-[#B91C1C] bg-linear-to-b from-[#B91C1C] to-[#991B1B] hover:from-[#DC2626] hover:to-[#B91C1C] active:from-[#7F1D1D] active:to-[#991B1B] border border-red-700/60 shadow-sm shadow-red-950/20 text-white icon-white justify-center px-4 font-medium transition-all duration-200`,
  'secondary': `${disabledClasses} bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 icon-slate-700 dark:icon-slate-200 justify-center px-4 hover:bg-slate-50 dark:hover:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600 active:bg-slate-100 transition-all duration-200`,
  'outline': `${disabledClasses} bg-transparent border border-secondary-300 text-secondary-800 icon-secondary-800 justify-center px-4 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-100 dark:icon-secondary-100 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 active:border-secondary-400 dark:active:border-secondary-500 active:text-secondary-900 dark:active:text-secondary-50 active:icon-secondary-900 dark:active:icon-secondary-50`,
  'ghost': `${disabledClasses} bg-transparent border border-transparent text-secondary-800 icon-secondary-800 justify-center px-4 hover:bg-secondary-50 dark:text-secondary-100 dark:icon-secondary-100 dark:hover:bg-secondary-800 active:bg-secondary-100 dark:active:bg-secondary-700 active:text-secondary-900 dark:active:text-secondary-50 active:icon-secondary-900 dark:active:icon-secondary-50`,
  'danger': `${disabledClasses} bg-destructive border border-destructive text-neutral-50 icon-destructive-foreground justify-center px-4 hover:bg-destructive/90 active:bg-destructive/80`,
  'brand': `${disabledClasses} justify-center px-5 font-semibold text-white bg-linear-to-b from-[#B91C1C] to-[#991B1B] border border-[#DC2626]/80 ring-1 ring-red-400/30 shadow-lg shadow-red-900/30 hover:brightness-110 active:brightness-95`,
  'navy': `${disabledClasses} justify-center px-5 font-semibold text-white bg-linear-to-b from-[#1B365D] to-[#0F2042] border border-[#1B365D]/80 shadow-md shadow-blue-950/30 hover:brightness-110 active:brightness-95`,
  'dark-ghost': `${disabledClasses} justify-center px-5 font-medium text-neutral-50/90 bg-neutral-50/3 border border-neutral-50/15 hover:bg-neutral-50/6 active:bg-neutral-50/8`,
  'ink': `${disabledClasses} justify-center px-5 font-semibold bg-brand-ink text-neutral-50 border border-brand-ink hover:bg-neutral-800 active:bg-neutral-900`,
}

export const activeClasses: Record<Variant, string> = {
  'primary': 'bg-clip-padding! outline! outline-red-600!',
  'secondary': 'bg-secondary-300! border-secondary-400! text-secondary-900! icon-secondary-900!',
  'outline': 'bg-secondary-100! dark:bg-secondary-700 border-secondary-400! dark:border-secondary-500 text-secondary-900! dark:text-secondary-50! icon-secondary-900! dark:icon-secondary-50!',
  'ghost': 'bg-secondary-100! dark:bg-secondary-700 text-secondary-900! dark:text-secondary-50! icon-secondary-900! dark:icon-secondary-50!',
  'danger': 'bg-destructive/90! outline! outline-destructive!',
  'brand': 'brightness-95!',
  'navy': 'brightness-95!',
  'dark-ghost': 'bg-neutral-50/8!',
  'ink': 'bg-neutral-900!',
}
