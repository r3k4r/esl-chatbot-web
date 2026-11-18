// The public feature pages (/features/[slug]) opened from the landing page's Features cards.
// Words live in i18n under `featurePages.items.<key>`; this is only the structure.

export type FeatureKey = 'conversation' | 'voice' | 'vocab' | 'pronunciation' | 'goals' | 'analytics'

/** A part of a screenshot, in % of its width and height (always left-to-right, even in RTL) */
export interface ScreenBox { x: number; y: number; w: number; h: number }

export interface FeaturePage {
  key: FeatureKey
  slug: string
  /** Iconify name, same as the landing card */
  icon: string
  /** Screenshot under the headline */
  hero: string
  /** Screenshot the notes point at */
  tour: string
  /** One box per note (n1, n2, ...), in order */
  boxes: ScreenBox[]
  /** How many questions (q1, q2, ...) the FAQ has */
  faqCount: number
}
