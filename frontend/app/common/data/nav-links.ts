import type { NavItemTypes, SocialLink } from "../types/nav-links-type";


export const navItems: NavItemTypes[] = [
    { name: 'Features', link: '/#features' },
    { name: 'Pricing', link: '/#pricing' },
    { name: 'About', link: '/#about' },
];

export const socialLinks: SocialLink[] = [
    { name: 'Facebook', link: 'https://www.facebook.com/moonlinetravel', class: '' },
    { name: 'Instagram', link: 'https://www.instagram.com/moonline_travel/?hl=en', class: '' },
    { name: 'YouTube', link: 'https://www.youtube.com/@Moonlinetravelandtourism', class: '' },
    { name: 'LinkedIn', link: 'https://www.linkedin.com/company/moonline-travel-&-tourism-company', class: '' },
];
/** The main Tutelage website, linked from the navbar's site switcher */
export const TUTELAGE_MAIN_URL = 'https://www.tutelage.krd/'
