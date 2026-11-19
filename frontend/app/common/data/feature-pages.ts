import type { FeatureKey, FeaturePage } from '~/common/types/feature-page-types'

// Screenshots are real screens of the student dashboard (light theme, 1552×777 CSS px at 100%
// zoom; <name>.webp is 1×, @2x and @3x), in public/features/, taken by scripts/capture-feature-shots.cjs
// (which also takes the landing page's phone shots). Boxes are % of the screenshot: what each tour
// note lights up. Measured on the shots of 2026-11-19; retake a screenshot and check its boxes again.
const S = (name: string) => `/features/${name}.webp`

export const FEATURE_PAGES: FeaturePage[] = [
  {
    key: 'conversation',
    slug: 'ai-conversation',
    icon: 'lucide:message-circle',
    hero: S('chat-session'),
    tour: S('chat-session'),
    boxes: [
      { x: 4.9, y: 29.3, w: 17.5, h: 70.7 },  // your chats
      { x: 5.2, y: 16, w: 17, h: 5.1 },       // new chat
      { x: 51.2, y: 14.4, w: 32.5, h: 8.6 },  // your message
      { x: 40.3, y: 57.3, w: 43.3, h: 7.1 },  // tutor reply
      { x: 24.2, y: 8.6, w: 11.9, h: 4.6 },   // level
      { x: 37.2, y: 69.1, w: 49.5, h: 28.7 }, // session report
    ],
    faqCount: 6,
  },
  {
    key: 'voice',
    slug: 'voice-practice',
    icon: 'lucide:mic',
    hero: S('voice-lab'),
    tour: S('voice-lab'),
    boxes: [
      { x: 40.4, y: 56.6, w: 11.9, h: 4.6 },  // start call
      { x: 24.7, y: 85.6, w: 43.3, h: 7.6 },  // how the call works
      { x: 77.3, y: 19, w: 22.7, h: 14.4 },   // live scoring
      { x: 77.3, y: 35.8, w: 22.7, h: 11.7 }, // word-level pronunciation
    ],
    faqCount: 5,
  },
  {
    key: 'vocab',
    slug: 'vocabulary',
    icon: 'lucide:brain',
    hero: S('vocab-card'),
    tour: S('vocab-review'),
    boxes: [
      { x: 29.7, y: 37.5, w: 28.9, h: 38.4 }, // the card
      { x: 29.7, y: 76.1, w: 28.9, h: 12.2 }, // your answer
      { x: 72.9, y: 20.6, w: 27.1, h: 20.2 }, // today
      { x: 72.9, y: 42.9, w: 27.1, h: 54.4 }, // mastery
      { x: 29.7, y: 30.4, w: 28.9, h: 4.6 },  // today's progress
      { x: 16.4, y: 14.9, w: 13, h: 3.6 },    // due today
    ],
    faqCount: 5,
  },
  {
    key: 'pronunciation',
    slug: 'pronunciation',
    icon: 'lucide:activity',
    hero: S('dashboard-progress'),
    tour: S('dashboard-progress'),
    boxes: [
      { x: 17.1, y: 18.4, w: 26.4, h: 38.7 }, // skills
      { x: 18.4, y: 24.6, w: 22.2, h: 3.6 },  // what it is based on
      { x: 18.2, y: 50.6, w: 24, h: 4 },      // speaking
      { x: 18.2, y: 93.4, w: 24, h: 6 },      // voice chats
    ],
    faqCount: 4,
  },
  {
    key: 'goals',
    slug: 'goals',
    icon: 'lucide:target',
    hero: S('goals'),
    tour: S('goals'),
    boxes: [
      { x: 16.6, y: 42.1, w: 27.1, h: 31 },   // a goal
      { x: 46, y: 60.5, w: 24.5, h: 5.8 },    // progress
      { x: 17.4, y: 67.5, w: 12, h: 4 },      // from your teacher
      { x: 16.6, y: 34.1, w: 28.9, h: 4.9 },  // filters
      { x: 16.6, y: 75.4, w: 27.1, h: 24.6 }, // finished goals
      { x: 92.1, y: 9.3, w: 7.9, h: 4.9 },    // new goal
    ],
    faqCount: 4,
  },
  {
    key: 'analytics',
    slug: 'progress',
    icon: 'lucide:bar-chart-2',
    hero: S('dashboard-home'),
    tour: S('dashboard-progress'),
    boxes: [
      { x: 17.1, y: 18.4, w: 26.4, h: 38.7 }, // skills
      { x: 44.9, y: 18.4, w: 26.4, h: 38.7 }, // this week
      { x: 72.7, y: 18.4, w: 26.7, h: 34.7 }, // class work
      { x: 17.1, y: 59.8, w: 26.4, h: 40.2 }, // recent chats
      { x: 44.9, y: 59.8, w: 26.4, h: 40.2 }, // last 12 weeks
      { x: 72.7, y: 55.9, w: 26.7, h: 44.1 }, // vocabulary
    ],
    faqCount: 4,
  },
]

export const featurePageBySlug = (slug: string) => FEATURE_PAGES.find(f => f.slug === slug)
export const featurePagePath = (key: FeatureKey) => `/features/${FEATURE_PAGES.find(f => f.key === key)!.slug}`

/** The 1× (1552w), 2× (3104w) and 3× (4656w) files of a screenshot, for `srcset` */
export const shotSrcset = (src: string) =>
  `${src} 1552w, ${src.replace(/\.webp$/, '@2x.webp')} 3104w, ${src.replace(/\.webp$/, '@3x.webp')} 4656w`
