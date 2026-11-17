export type TextSize =
  | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '20' | '22' | '24' | '30' | '32' | '36' | '40' | '48'
  // Responsive landing-page hero/section sizes: base / sm / lg
  | 'section-h2'   // 40px base → 52px sm (Features, HowItWorks, Dashboard, Pricing titles)
  | 'hero-h1'      // 44px base → 64px sm → 78px lg (Hero headline)
  | 'cta-h2'       // 44px base → 68px sm (Final CTA headline)
  | 'price'        // 52px (pricing amount)

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type TextColor =
  | 'white'
  | 'black'
  | 'neutral-600'
  | 'neutral-400'
  | 'primary-orange-500'
  | 'primary-500'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  // Landing-page brand colors (from main.css tokens)
  | 'brand-primary'
  | 'brand-ink'
  | 'brand-sub'
  | 'white-90'
  | 'white-70'
  | 'white-60'
  | 'white-55'
  | 'white-50'
  | 'white-45'
  | 'white-40'
  | 'white-35'
export type FontFamily = 'poppins' | 'inter' | 'mono'

export const sizeClasses: Record<TextSize, string> = {
  '10': 'text-[10px]',
  '11': 'text-[11px]',
  '12': 'text-xs',
  '13': 'text-[13px]',
  '14': 'text-sm',
  '15': 'text-[15px]',
  '16': 'text-base',
  '17': 'text-[17px]',
  "18": 'lg:text-lg text-base',
  "20": 'lg:text-xl text-lg',
  '22': 'text-[22px]',
  '24': 'lg:text-2xl text-xl',
  '30': 'lg:text-3xl text-2xl',
  '32': 'lg:text-3.5xl text-2xl',
  '36': 'lg:text-4xl text-3.5xl',
  '40': 'lg:text-4.5xl text-3.5xl',
  '48': 'lg:text-5xl text-4.5xl',
  // Responsive landing-page sizes — preserve the EXACT same responsive steps as the original design
  'section-h2': 'text-[40px] sm:text-[52px]',
  'hero-h1':    'text-[44px] sm:text-[64px] lg:text-[78px]',
  'cta-h2':     'text-[44px] sm:text-[68px]',
  'price':      'text-[52px]',
}

export const weightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export const colorClasses: Record<TextColor, string> = {
  'white': 'text-neutral-50',
  // dark: variants only ever apply in the dashboard (public pages are always light)
  'black': 'text-neutral-900 dark:text-text-heading',
  'neutral-600': 'text-neutral-600 dark:text-text-body',
  'neutral-400': 'text-neutral-400 dark:text-text-muted',
  'primary-orange-500': 'text-primary-500 dark:text-primary-300',
  'primary-500': 'text-primary-500 dark:text-primary-300',
  'error': 'text-destructive',
  'success': 'text-primary-500 dark:text-primary-300',
  'warning': 'text-ternary-300 dark:text-ternary-200',
  'info': 'text-secondary-700 dark:text-secondary-200',
  // Landing-page colors — resolved to tokens in main.css
  'brand-primary': 'text-brand-primary',
  'brand-ink':     'text-brand-ink dark:text-text-heading',
  'brand-sub':     'text-brand-sub dark:text-text-muted',
  'white-90': 'text-neutral-50/90',
  'white-70': 'text-neutral-50/70',
  'white-60': 'text-neutral-50/60',
  'white-55': 'text-neutral-50/55',
  'white-50': 'text-neutral-50/50',
  'white-45': 'text-neutral-50/45',
  'white-40': 'text-neutral-50/40',
  'white-35': 'text-neutral-50/35',
}

export const fontFamilyClasses: Record<FontFamily, string> = {
  'poppins': 'font-poppins',
  'inter':   'font-sans',
  'mono':    'font-mono',
}

export type TextProps = {
  size?: TextSize
  weight?: TextWeight
  color?: TextColor
  fontFamily?: FontFamily
  classList?: string
  htmlContent?: string
  capitalize?: boolean;
  uppercase?: boolean;
  underline?: boolean;
  italic?: boolean;
}


