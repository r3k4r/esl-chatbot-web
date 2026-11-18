export type Class = {
  id: string;
  className: string;
  classCode: string;
  classCategory: string | null;
  classStatus: 'ACTIVE' | 'INACTIVE';
  archived: boolean;
  archivedAt: string | null;
  classCodeBlocked: boolean;
  classCodeExpiresAt: string | null;
  classCodeRefreshIntervalSeconds: number | null;
  classCodeRefreshedAt: string | null;
  createdById: string | null;
  createdAt: string;
  joinedAt: string;
  updatedAt: string;
};

export type ClassUser = {
  id: string;
  classId: string;
  userId: string;
  role: 'STUDENT' | 'TUTOR';
  joinedAt: string;
};

export type Announcement = {
  id: string;
  classId: string;
  authorId: string;
  content: string;
  /** Students can comment only while this is on (default on) */
  commentsEnabled: boolean;
  editedAt: string | null;
  createdAt: string;
};

export type AnnouncementComment = {
  id: string;
  announcementId: string;
  authorId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementAttachment = {
  id: string;
  announcementId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
};
