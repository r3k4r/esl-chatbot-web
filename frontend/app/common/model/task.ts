export type TaskStatus = 'OPEN' | 'CLOSED'

export type Task = {
  id: string
  classId: string
  createdById: string
  title: string
  description: string
  deadline: string | null
  status: TaskStatus
  closedAt: string | null
  /** Off = students can no longer comment; existing comments stay visible */
  commentsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type TaskSubmission = {
  id: string
  taskId: string
  studentId: string
  content: string | null
  fileUrl: string | null
  feedback: string | null
  feedbackAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskComment = {
  id: string
  taskId: string
  authorId: string
  /** null when the comment is only files */
  content: string | null
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Neither commentId nor submissionId = the tutor attached it to the task itself */
export type TaskAttachment = {
  id: string
  taskId: string
  commentId: string | null
  /** Set on a student's hand-in file (private to that student and the tutors) */
  submissionId: string | null
  uploadedById: string
  fileName: string
  fileUrl: string
  mimeType: string
  /** bytes */
  size: number
  createdAt: string
}
