import { describe, it, expect } from 'vitest'
import { notificationRoute } from '~/common/data/notification-routes'
import type { Notification, NotificationType } from '~/common/model/notification'

const make = (type: NotificationType, data?: Notification['data']): Notification => ({
  id: 'n1',
  userId: 'u1',
  type,
  message: 'msg',
  read: false,
  data,
  createdAt: '2026-01-01T00:00:00.000Z',
})

describe('notificationRoute', () => {
  it.each<[NotificationType, string]>([
    ['STREAK_MILESTONE', '/dashboard'],
    ['GOAL_COMPLETED', '/dashboard/goals'],
    ['GOAL_ASSIGNED', '/dashboard/goals'],
    ['VOCABULARY_ASSIGNED', '/dashboard/vocab'],
  ])('%s → %s', (type, route) => {
    expect(notificationRoute(make(type))).toBe(route)
  })

  it.each<[NotificationType, string]>([
    ['TASK_ASSIGNED', 'tasks'],
    ['TASK_SUBMITTED', 'tasks'],
    ['CLASS_ANNOUNCEMENT', 'announcements'],
  ])('%s deep-links to the class %s tab', (type, tab) => {
    expect(notificationRoute(make(type, { classId: 'c42' }))).toBe(`/dashboard/classes/c42?tab=${tab}`)
  })

  it.each<NotificationType>(['TASK_ASSIGNED', 'TASK_SUBMITTED', 'CLASS_ANNOUNCEMENT'])(
    '%s without a classId falls back to the class list',
    (type) => {
      expect(notificationRoute(make(type, null))).toBe('/dashboard/classes')
    },
  )

  it('sends unknown types to the dashboard', () => {
    expect(notificationRoute(make('SOMETHING_NEW' as NotificationType))).toBe('/dashboard')
  })
})
