// Mirrors the `vocabulary_lists` DB table (backend/prisma/schema.prisma → model VocabularyList):
// a named set of words a tutor/admin assigned to students of a class.
export type VocabularyList = {
  id: string
  classId: string
  title: string
  createdById: string | null
  createdAt: string
}
