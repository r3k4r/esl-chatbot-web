import type { Task, TaskAttachment, TaskComment, TaskSubmission } from '~/common/model/task'
import type { User } from '~/common/model/user'
import type { ClassPaginationMeta } from '~/common/types/class-types'

export type { ClassPaginationMeta }

export type TaskAuthor = Pick<User, 'id' | 'displayName' | 'avatarUrl'>

export interface TaskSubmissionItem extends TaskSubmission {
  student: TaskAuthor
  /** Files handed in with the work */
  attachments: TaskAttachment[]
}

export interface TaskItem extends Task {
  createdBy: TaskAuthor
  /** Present for tutor/admin callers only */
  submissionCount?: number
  commentCount: number
  /** Files the tutor attached to the task itself */
  attachments: TaskAttachment[]
  /** Present for student callers only; null = not yet submitted */
  mySubmission?: TaskSubmissionItem | null
}

export type { TaskAttachment }

/** The author's role in this class; ADMIN when an admin (not a member) wrote it */
export type ClassActorRole = 'TUTOR' | 'STUDENT' | 'ADMIN'

export interface TaskCommentItem extends Pick<TaskComment, 'id' | 'taskId' | 'content' | 'editedAt' | 'createdAt'> {
  author: TaskAuthor & { classRole: ClassActorRole }
  attachments: TaskAttachment[]
}

/** What the comment box hands back: text, new files, and (when editing) files to drop */
export interface CommentDraft {
  content: string
  files: File[]
  removeAttachmentIds: string[]
}
