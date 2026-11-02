export const useSeo = async (options?: {
  title?: string,
  description?: string,
  keywords?: string,
  ogImage?: string,
}) => {
  const seoFallback = {
    title: "LEO Institute | AI English Tutor & Student Portal (پەیمانگای لیۆ)",
    description: "Master English with guaranteed results at Leo Institute in Sulaymaniyah. In-person & online courses powered by Kurdistan's first 24/7 AI Speaking Coach.",
    keywords: "LEO Institute, پەیمانگای لیۆ, Learn English Online, English Sulaymaniyah, IELTS Kurdistan, ESL AI Tutor, Mamostayan Azadi Park"
  };
  let title = options?.title || seoFallback.title;
  let description = options?.description || seoFallback.description;
  let keywords = options?.keywords || seoFallback.keywords;

  useSeoMeta({
    title,
    ogTitle: title,
    twitterTitle: title,
    description,
    ogDescription: description,
    twitterDescription: description,
    keywords,
    ogUrl: 'https://leoinstitute.krd',
    twitterImage: options?.ogImage || '/leo-logo.jpg',
    ogImage: options?.ogImage || '/leo-logo.jpg',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    themeColor: '#B91C1C',
  })
}
