import { User, ReceiptText, Ticket, History, LogOut, UserPen } from 'lucide-vue-next';
import type { ProfileLink } from '~/common/types/profile-links-type';

export const profileLinks: ProfileLink[] = [
    { label: 'Profile', path: '/user/profile', icon: UserPen },
    { label: 'Purchase', path: '/user/purchase', icon: ReceiptText },
    { label: 'Voucher', path: '/user/voucher', icon: Ticket },
    { label: 'Point History', path: '/user/point-history', icon: History },
    { label: 'Logout', icon: LogOut },
];