import type {
  AnalyticsSettings,
  CompanySettings,
  FooterSettings,
  HeroSettings,
  NavbarSettings,
  RobotsSettings,
  SeoGlobalSettings,
  ThemeSettings,
} from '@app/shared';

// Every value here is a placeholder, editable later in Admin → Company information.
export const company: CompanySettings = {
  name: { en: '[COMPANY NAME]', ar: '[اسم الشركة]' },
  tagline: {
    en: 'Heavy equipment, freight and courier across the UAE',
    ar: 'معدات ثقيلة وشحن وتوصيل سريع في جميع أنحاء الإمارات',
  },
  about: {
    en: 'We rent cranes, forklifts and lifting equipment, move cargo between all seven emirates and the GCC, and deliver parcels the same day. One team, one call, from site to doorstep.',
    ar: 'نؤجر الرافعات والرافعات الشوكية ومعدات الرفع، وننقل البضائع بين الإمارات السبع ودول الخليج، ونوصل الطرود في اليوم نفسه. فريق واحد واتصال واحد، من الموقع حتى الباب.',
  },
  logoLightId: null,
  logoDarkId: null,
  faviconId: null,
  phones: ['+971 4 000 0000', '+971 50 000 0000'],
  whatsapp: '+971500000000',
  emails: ['sales@example.com', 'ops@example.com'],
  branches: [
    {
      id: 'dxb',
      emirate: 'dubai',
      isHeadOffice: true,
      lat: 25.0119,
      lng: 55.1131,
      phone: '+971 4 000 0000',
      text: {
        en: { name: 'Head office, Dubai', address: '[Street], Jebel Ali Industrial Area, Dubai, UAE' },
        ar: { name: 'المكتب الرئيسي، دبي', address: '[الشارع]، المنطقة الصناعية بجبل علي، دبي، الإمارات' },
      },
    },
    {
      id: 'auh',
      emirate: 'abu-dhabi',
      isHeadOffice: false,
      lat: 24.3487,
      lng: 54.5126,
      phone: '+971 2 000 0000',
      text: {
        en: { name: 'Abu Dhabi yard', address: '[Street], Mussafah Industrial Area, Abu Dhabi, UAE' },
        ar: { name: 'ساحة أبوظبي', address: '[الشارع]، المنطقة الصناعية بمصفح، أبوظبي، الإمارات' },
      },
    },
    {
      id: 'shj',
      emirate: 'sharjah',
      isHeadOffice: false,
      lat: 25.3069,
      lng: 55.4498,
      phone: '+971 6 000 0000',
      text: {
        en: { name: 'Sharjah depot', address: '[Street], Industrial Area 13, Sharjah, UAE' },
        ar: { name: 'مستودع الشارقة', address: '[الشارع]، المنطقة الصناعية 13، الشارقة، الإمارات' },
      },
    },
  ],
  workingHours: {
    en: [
      { days: 'Monday – Saturday', hours: '7:00 – 19:00' },
      { days: 'Sunday', hours: 'Dispatch on call' },
    ],
    ar: [
      { days: 'الاثنين – السبت', hours: '7:00 – 19:00' },
      { days: 'الأحد', hours: 'الإرسال عند الطلب' },
    ],
  },
  social: [
    { network: 'linkedin', url: 'https://www.linkedin.com/' },
    { network: 'instagram', url: 'https://www.instagram.com/' },
  ],
  tradeLicence: '[TRADE LICENCE NO.]',
  trn: '[TRN]',
  defaultLocale: 'en',
};

export const theme: ThemeSettings = {
  navy: '#0B1B3A',
  yellow: '#FFC62B',
  blue: '#2F63FF',
  offwhite: '#F4F7FB',
  ink: '#0A0B0C',
};

export const navbar: NavbarSettings = {
  items: [
    { href: '/services', label: { en: 'Services', ar: 'الخدمات' } },
    { href: '/equipment', label: { en: 'Equipment', ar: 'المعدات' } },
    { href: '/logistics', label: { en: 'Logistics & Courier', ar: 'اللوجستيات والتوصيل' } },
    { href: '/projects', label: { en: 'Projects', ar: 'المشاريع' } },
    { href: '/about', label: { en: 'About', ar: 'من نحن' } },
    { href: '/contact', label: { en: 'Contact', ar: 'اتصل بنا' } },
  ],
  ctaLabel: { en: 'Get a quote', ar: 'اطلب عرض سعر' },
  ctaHref: '/contact?type=quote',
};

export const footer: FooterSettings = {
  text: {
    en: 'Equipment rental, heavy transport and courier services in Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain.',
    ar: 'تأجير المعدات والنقل الثقيل وخدمات التوصيل في دبي وأبوظبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين.',
  },
  quoteBand: {
    en: {
      title: 'Need a crane on site tomorrow?',
      body: 'Tell us the load, the site and the date. We reply with a price within the hour during working hours.',
      cta: 'Request a quote',
    },
    ar: {
      title: 'تحتاج رافعة في موقعك غدًا؟',
      body: 'أخبرنا بالحمولة والموقع والتاريخ، ونرد بالسعر خلال ساعة في أوقات العمل.',
      cta: 'اطلب عرض سعر',
    },
  },
  columns: [
    {
      title: { en: 'Services', ar: 'الخدمات' },
      links: [
        { href: '/services/equipment-rental', label: { en: 'Equipment rental', ar: 'تأجير المعدات' } },
        { href: '/services/heavy-transport', label: { en: 'Heavy transport', ar: 'النقل الثقيل' } },
        { href: '/services/freight-truckload', label: { en: 'Freight & truckload', ar: 'الشحن والحمولات' } },
        { href: '/services/courier-express', label: { en: 'Courier & express', ar: 'التوصيل السريع' } },
      ],
    },
    {
      title: { en: 'Company', ar: 'الشركة' },
      links: [
        { href: '/about', label: { en: 'About us', ar: 'من نحن' } },
        { href: '/projects', label: { en: 'Projects', ar: 'المشاريع' } },
        { href: '/blog', label: { en: 'News', ar: 'الأخبار' } },
        { href: '/contact', label: { en: 'Contact', ar: 'اتصل بنا' } },
      ],
    },
    {
      title: { en: 'Legal', ar: 'قانوني' },
      links: [
        { href: '/privacy', label: { en: 'Privacy policy', ar: 'سياسة الخصوصية' } },
        { href: '/terms', label: { en: 'Terms', ar: 'الشروط والأحكام' } },
      ],
    },
  ],
};

export const hero: HeroSettings = {
  mode: 'vector',
  intensity: 'standard',
  videoUrl: null,
  videoUrlMobile: null,
  posterId: null,
  backgroundId: null,
  text: {
    en: {
      eyebrow: 'Equipment rental · Logistics · Courier',
      lines: ['Moving the', 'weight of', 'the UAE', 'forward'],
      subtitle:
        'Cranes, forklifts and trucks with trained operators, dispatched to any site in the seven emirates.',
      primaryCta: 'Get a quote',
      secondaryCta: 'Browse equipment',
      badges: ['24/7 dispatch', 'All 7 emirates', 'GCC cross-border'],
    },
    ar: {
      eyebrow: 'تأجير معدات · لوجستيات · توصيل',
      lines: ['نحمل', 'ثقل الإمارات', 'إلى الأمام'],
      subtitle: 'رافعات ورافعات شوكية وشاحنات مع مشغلين مدربين، تصل إلى أي موقع في الإمارات السبع.',
      primaryCta: 'اطلب عرض سعر',
      secondaryCta: 'تصفح المعدات',
      badges: ['إرسال على مدار الساعة', 'الإمارات السبع', 'عبر حدود الخليج'],
    },
  },
};

export const seoGlobal: SeoGlobalSettings = {
  titleTemplate: { en: '%s | [COMPANY NAME]', ar: '%s | [اسم الشركة]' },
  defaultOgImageId: null,
  googleVerification: '',
  bingVerification: '',
};

export const analytics: AnalyticsSettings = {
  ga4Id: '',
  gtmId: '',
  metaPixelId: '',
  customHead: '',
  customBody: '',
};

export const robots: RobotsSettings = {
  content: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n',
};
