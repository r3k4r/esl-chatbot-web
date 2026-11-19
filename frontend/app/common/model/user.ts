export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  avatarUrl: string;
  isActive: boolean;
  emailVerified: boolean;
  /** when the dashboard guide was finished or skipped; null = show it */
  guideSeenAt: string | null;
  subscription: {
    plan: 'FREE' | 'GOLD' | 'PREMIUM';
    status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
  };
};

