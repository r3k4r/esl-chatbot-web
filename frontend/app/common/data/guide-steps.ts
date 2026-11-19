import type { GuideStep } from '~/common/types/guide-types'
import type { UserRole } from '~/common/types/user-permissions'

// The dashboard guide, one tour per role: what each part of the dashboard is, what each menu item
// opens, then search, notifications and the account menu. Targets are `data-guide="…"` attributes
// on the elements (dashboard sections, sidebar items `nav-<id>`, header `search`/`bell`/`account`,
// the phone menu button `menu`). Steps whose element isn't on screen are skipped.

const END: GuideStep[] = [
  { target: 'search', title: 'Search', text: 'Find people, classes, words and chats. Press Ctrl + K from anywhere.', side: 'bottom' },
  { target: 'bell', title: 'Notifications', text: 'New tasks, comments, words from a teacher and plan news land here.', side: 'bottom' },
  { target: 'account', title: 'Your account', text: 'Your profile, settings and sign out. You can take this tour again from here at any time.', side: 'bottom' },
]

export const GUIDE_STEPS: Record<UserRole, GuideStep[]> = {
  STUDENT: [
    { title: 'Welcome to Tutelage AI', text: 'A one-minute tour of your dashboard. Use Next, or press Esc to skip.' },
    { target: 'student-hero', title: 'Today', text: 'Your goal for today and the one thing to do next. The orange button takes you straight there.', side: 'bottom' },
    { target: 'student-stats', title: 'Your numbers', text: 'Words mastered, practice this week, your speaking score and your level.', side: 'top' },
    { target: 'student-skills', title: 'Your skills', text: 'Grammar, vocabulary, fluency and speaking, worked out from your latest messages.', side: 'right' },
    { target: 'nav-chat', nav: true, title: 'AI Chat', text: 'Talk with your AI tutor by typing or with voice messages. It remembers you and corrects you gently.', side: 'right' },
    { target: 'nav-voice', nav: true, title: 'Voice Lab', text: 'A live voice call with the tutor. Choose an American or British voice.', side: 'right' },
    { target: 'nav-vocab', nav: true, title: 'Vocabulary', text: 'Words from your teacher and the AI tutor, as flashcards. The number shows how many are due today.', side: 'right' },
    { target: 'nav-goals', nav: true, title: 'Goals', text: 'Your targets, and the ones your teacher sets for you.', side: 'right' },
    { target: 'nav-classes', nav: true, title: 'Classes', text: 'Join your teacher’s class with a code to get tasks, announcements and word lists.', side: 'right' },
    ...END,
  ],
  TUTOR: [
    { title: 'Welcome to Tutelage AI', text: 'A one-minute tour of your teacher dashboard. Use Next, or press Esc to skip.' },
    { target: 'tutor-figures', title: 'Your week at a glance', text: 'Your students, who practised this week, work to review and missing work.', side: 'bottom' },
    { target: 'tutor-needs', title: 'Needs you', text: 'Hand-ins waiting for feedback, deadlines this week, and students worth a nudge.', side: 'bottom' },
    { target: 'tutor-classes', title: 'Your classes', text: 'How each class is doing. Open one to manage it.', side: 'top' },
    { target: 'nav-classes', nav: true, title: 'Classes', text: 'Create a class and share its code. Inside: tasks, announcements, word lists and each student’s progress.', side: 'right' },
    ...END,
  ],
  ADMIN: [
    { title: 'Welcome to Tutelage AI', text: 'A one-minute tour of the admin dashboard. Use Next, or press Esc to skip.' },
    { target: 'admin-figures', title: 'This week at a glance', text: 'New sign-ups, active learners, AI messages and paying users, each against last week.', side: 'bottom' },
    { target: 'admin-funnel', title: 'Student funnel', text: 'From signing up, to verified, to paying. Each step shows its share of the one above.', side: 'top' },
    { target: 'admin-followups', title: 'Follow up', text: 'Plans ending in the next 7 days and accounts that need attention.', side: 'top' },
    { target: 'admin-plans', title: 'Plans and money', text: 'Who pays for which plan, FIB payments this month and AI usage.', side: 'top' },
    { target: 'nav-users', nav: true, title: 'Users', text: 'Every account: change roles, give or cancel plans, block or unblock.', side: 'right' },
    { target: 'nav-classes', nav: true, title: 'Classes', text: 'Every class in the institute, with its teachers and its code.', side: 'right' },
    ...END,
  ],
}

/** The element the guide waits for before starting (the role's dashboard has loaded). */
export const GUIDE_READY: Record<UserRole, string> = {
  STUDENT: 'student-hero',
  TUTOR: 'tutor-figures',
  ADMIN: 'admin-figures',
}
