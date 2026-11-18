import type { Notification } from '~/common/model/notification'

export function notificationRoute(n: Notification): string {
  switch (n.type) {
    case 'STREAK_MILESTONE':
      return '/dashboard'
    case 'GOAL_COMPLETED':
    case 'GOAL_ASSIGNED':
      return '/dashboard/goals'
    case 'VOCABULARY_ASSIGNED':
      return '/dashboard/vocab'
    case 'TASK_ASSIGNED':
    case 'TASK_SUBMITTED':
      if (n.data?.classId && n.data?.taskId) return `/dashboard/classes/${n.data.classId}/tasks/${n.data.taskId}`
      return n.data?.classId
        ? `/dashboard/classes/${n.data.classId}?tab=tasks`
        : '/dashboard/classes'
    case 'CLASS_ANNOUNCEMENT':
    case 'ANNOUNCEMENT_COMMENT':
      return n.data?.classId
        ? `/dashboard/classes/${n.data.classId}?tab=announcements`
        : '/dashboard/classes'
    default:
      return '/dashboard'
  }
}
