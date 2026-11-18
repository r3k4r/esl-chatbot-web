export type NotificationType =
  | 'STREAK_MILESTONE'
  | 'GOAL_COMPLETED'
  | 'GOAL_ASSIGNED'
  | 'VOCABULARY_ASSIGNED'
  | 'CLASS_ANNOUNCEMENT'
  | 'TASK_ASSIGNED'
  | 'TASK_SUBMITTED'
  | 'ANNOUNCEMENT_COMMENT'

export interface NotificationData {
  classId?: string
  taskId?: string
  announcementId?: string
  goalId?: string
  vocabularyId?: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  read: boolean
  data?: NotificationData | null
  createdAt: string
}
