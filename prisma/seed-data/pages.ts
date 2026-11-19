import type { PageKey } from '@app/shared';

type L<T> = { en: T; ar: T };
type Seo = { title: string; description: string; focusKeyword: string };

export interface SeedPage {
  key: PageKey;
  slug: string;
  content: L<{ title: string; intro: string }>;
  seo: L<Seo>;
  sections: { type: string; content: L<Record<string, unknown>> }[];
}

export const pages: SeedPage[] = [
  {
    key: 'home',
    slug: '',
    content: {
      en: { title: 'Heavy equipment rental, logistics and courier in the UAE', intro: '' },
      ar: { title: 'تأجير المعدات الثقيلة واللوجستيات والتوصيل في الإمارات', intro: '' },
    },
    seo: {
      en: {
        title: 'Crane Rental Dubai, Logistics & Courier UAE',
        description:
          'Crane and forklift rental in Dubai, heavy transport, truckload freight and same-day courier across all seven emirates. Request a quote in minutes.',
        focusKeyword: 'crane rental Dubai',
      },
      ar: {
        title: 'تأجير رافعات في دبي، لوجستيات وتوصيل في الإمارات',
        description:
          'تأجير رافعات ورافعات شوكية في دبي، ونقل ثقيل، وشحن بالشاحنات، وتوصيل في اليوم نفسه في الإمارات السبع. اطلب عرض سعر خلال دقائق.',
        focusKeyword: 'تأجير رافعات دبي',
      },
    },
    sections: [
      {
        type: 'stats',
        content: {
          en: { items: [{ value: 15, suffix: '+', label: 'Years in the UAE' }, { value: 350, suffix: '+', label: 'Machines and trucks' }, { value: 4200, suffix: '+', label: 'Projects delivered' }, { value: 7, suffix: '', label: 'Emirates covered' }] },
          ar: { items: [{ value: 15, suffix: '+', label: 'عامًا في الإمارات' }, { value: 350, suffix: '+', label: 'معدة وشاحنة' }, { value: 4200, suffix: '+', label: 'مشروع منجز' }, { value: 7, suffix: '', label: 'إمارات نغطيها' }] },
        },
      },
      {
        type: 'process',
        content: {
          en: { title: 'From request to delivery', steps: [{ title: 'Request', body: 'Send the load, site and date by form or WhatsApp.' }, { title: 'Quote', body: 'A clear price in AED, usually within the hour.' }, { title: 'Dispatch', body: 'Machine or truck inspected and sent with its operator.' }, { title: 'Deliver', body: 'On site, on time, with photos and paperwork.' }] },
          ar: { title: 'من الطلب حتى التسليم', steps: [{ title: 'الطلب', body: 'أرسل الحمولة والموقع والتاريخ عبر النموذج أو واتساب.' }, { title: 'عرض السعر', body: 'سعر واضح بالدرهم، عادة خلال ساعة.' }, { title: 'الإرسال', body: 'تُفحص المعدة أو الشاحنة وتُرسل مع مشغلها.' }, { title: 'التسليم', body: 'في الموقع وفي الموعد، مع الصور والمستندات.' }] },
        },
      },
      {
        type: 'whyUs',
        content: {
          en: { title: 'Why contractors call us first', points: ['One supplier for machines, trucks and couriers', 'Certified operators and engineered lift plans', 'Our own fleet, not brokered capacity', 'Dispatch from Dubai, Abu Dhabi and Sharjah'] },
          ar: { title: 'لماذا يتصل بنا المقاولون أولًا', points: ['مورد واحد للمعدات والشاحنات والتوصيل', 'مشغلون معتمدون وخطط رفع هندسية', 'أسطولنا الخاص وليس سعة وسيطة', 'الإرسال من دبي وأبوظبي والشارقة'] },
        },
      },
    ],
  },
  {
    key: 'about',
    slug: 'about',
    content: {
      en: { title: 'About us', intro: 'A UAE company that rents heavy equipment, moves freight and delivers parcels, with its own fleet and its own people.' },
      ar: { title: 'من نحن', intro: 'شركة إماراتية تؤجر المعدات الثقيلة وتنقل البضائع وتوصل الطرود، بأسطولها وفريقها الخاص.' },
    },
    seo: {
      en: { title: 'About Us | Heavy Equipment & Logistics Company UAE', description: 'Meet the team behind our heavy equipment rental and logistics services in the UAE: our story, safety culture, fleet and certifications.', focusKeyword: 'heavy equipment rental UAE' },
      ar: { title: 'من نحن | شركة معدات ثقيلة ولوجستيات في الإمارات', description: 'تعرّف على فريق تأجير المعدات الثقيلة والخدمات اللوجستية في الإمارات: قصتنا وثقافة السلامة والأسطول.', focusKeyword: 'تأجير معدات ثقيلة الإمارات' },
    },
    sections: [
      {
        type: 'missionVision',
        content: {
          en: { mission: 'Put the right machine and the right truck on site, safely and on time.', vision: 'The first call for lifting and logistics in the UAE.' },
          ar: { mission: 'إيصال المعدة المناسبة والشاحنة المناسبة إلى الموقع بأمان وفي الموعد.', vision: 'أن نكون الاتصال الأول للرفع واللوجستيات في الإمارات.' },
        },
      },
    ],
  },
  {
    key: 'services',
    slug: 'services',
    content: { en: { title: 'Services', intro: 'Equipment rental, heavy transport, truckload freight, courier, warehousing and rigging.' }, ar: { title: 'الخدمات', intro: 'تأجير المعدات والنقل الثقيل والشحن بالشاحنات والتوصيل والتخزين والرفع.' } },
    seo: {
      en: { title: 'Equipment Rental, Freight & Courier Services UAE', description: 'All our services in one place: construction equipment rental, heavy transport, truck freight, courier, warehousing and rigging across the UAE.', focusKeyword: 'construction equipment rental UAE' },
      ar: { title: 'خدمات تأجير المعدات والشحن والتوصيل في الإمارات', description: 'جميع خدماتنا: تأجير معدات البناء والنقل الثقيل والشحن والتوصيل والتخزين والرفع في الإمارات.', focusKeyword: 'تأجير معدات البناء الإمارات' },
    },
    sections: [],
  },
  {
    key: 'equipment',
    slug: 'equipment',
    content: { en: { title: 'Equipment for rent', intro: 'Cranes, forklifts, aerial lifts, earthmoving and handling equipment, filtered by capacity and operator.' }, ar: { title: 'معدات للإيجار', intro: 'رافعات ورافعات شوكية ومنصات رفع ومعدات حفر ومناولة، حسب الحمولة والمشغل.' } },
    seo: {
      en: { title: 'Forklift Rental UAE & Crane Hire Catalogue', description: 'Browse cranes, forklifts, boom lifts, excavators and reach stackers for rent in the UAE. Filter by capacity and request a quote online.', focusKeyword: 'forklift rental UAE' },
      ar: { title: 'تأجير رافعات شوكية في الإمارات وكتالوج الرافعات', description: 'تصفح الرافعات والرافعات الشوكية والمنصات والحفارات للإيجار في الإمارات، واطلب عرض سعر عبر الإنترنت.', focusKeyword: 'تأجير رافعات شوكية الإمارات' },
    },
    sections: [],
  },
  {
    key: 'logistics',
    slug: 'logistics',
    content: { en: { title: 'Logistics & courier', intro: 'Truck types, lanes across the UAE and GCC, booking and parcel tracking.' }, ar: { title: 'اللوجستيات والتوصيل', intro: 'أنواع الشاحنات والخطوط في الإمارات والخليج والحجز وتتبع الطرود.' } },
    seo: {
      en: { title: 'Freight and Logistics Dubai | Courier Service UAE', description: 'Freight and logistics in Dubai and across the UAE: flatbed, lowbed, reefer and container trucks, GCC lanes, online booking and courier tracking.', focusKeyword: 'freight and logistics Dubai' },
      ar: { title: 'الشحن واللوجستيات في دبي | خدمة التوصيل في الإمارات', description: 'الشحن واللوجستيات في دبي والإمارات: شاحنات مسطحة ومنخفضة ومبردة وحاويات، وخطوط الخليج، والحجز وتتبع الشحنات.', focusKeyword: 'الشحن واللوجستيات دبي' },
    },
    sections: [],
  },
  {
    key: 'contact',
    slug: 'contact',
    content: { en: { title: 'Contact us', intro: 'Call, WhatsApp or send the form. We reply within the hour during working hours.' }, ar: { title: 'اتصل بنا', intro: 'اتصل أو راسلنا عبر واتساب أو أرسل النموذج، ونرد خلال ساعة في أوقات العمل.' } },
    seo: {
      en: { title: 'Contact Us | Request a Quote in Dubai', description: 'Request a quote for equipment rental, transport or courier in Dubai and across the UAE. Call, WhatsApp or use our online form.', focusKeyword: 'equipment rental quote Dubai' },
      ar: { title: 'اتصل بنا | اطلب عرض سعر في دبي', description: 'اطلب عرض سعر لتأجير المعدات أو النقل أو التوصيل في دبي والإمارات، عبر الهاتف أو واتساب أو النموذج.', focusKeyword: 'عرض سعر تأجير معدات دبي' },
    },
    sections: [],
  },
  {
    key: 'projects',
    slug: 'projects',
    content: { en: { title: 'Projects', intro: 'Lifts, moves and logistics programmes we have delivered across the UAE.' }, ar: { title: 'المشاريع', intro: 'عمليات رفع ونقل وبرامج لوجستية نفذناها في الإمارات.' } },
    seo: {
      en: { title: 'Projects | Lifting & Heavy Transport Case Studies UAE', description: 'Case studies of crane lifts, heavy transport and logistics programmes delivered in Dubai, Abu Dhabi, Sharjah and Fujairah.', focusKeyword: 'heavy transport UAE' },
      ar: { title: 'المشاريع | دراسات حالة للرفع والنقل الثقيل', description: 'دراسات حالة لعمليات الرفع والنقل الثقيل والبرامج اللوجستية في دبي وأبوظبي والشارقة والفجيرة.', focusKeyword: 'النقل الثقيل الإمارات' },
    },
    sections: [],
  },
  {
    key: 'blog',
    slug: 'blog',
    content: { en: { title: 'News & guides', intro: 'Practical guides on lifting, transport and logistics in the UAE.' }, ar: { title: 'الأخبار والأدلة', intro: 'أدلة عملية حول الرفع والنقل واللوجستيات في الإمارات.' } },
    seo: {
      en: { title: 'News & Guides | Equipment Rental and Logistics', description: 'Guides on crane rental, forklift hire, heavy transport and courier services in the UAE from our engineers and logistics team.', focusKeyword: 'equipment rental guide UAE' },
      ar: { title: 'الأخبار والأدلة | تأجير المعدات واللوجستيات', description: 'أدلة حول تأجير الرافعات والرافعات الشوكية والنقل الثقيل وخدمات التوصيل في الإمارات.', focusKeyword: 'دليل تأجير المعدات الإمارات' },
    },
    sections: [],
  },
  {
    key: 'privacy',
    slug: 'privacy',
    content: { en: { title: 'Privacy policy', intro: '[Placeholder: have your legal adviser supply the privacy policy text.]' }, ar: { title: 'سياسة الخصوصية', intro: '[نص مؤقت: اطلب نص سياسة الخصوصية من مستشارك القانوني.]' } },
    seo: {
      en: { title: 'Privacy Policy', description: 'How we collect, use and protect personal data submitted through this website.', focusKeyword: '' },
      ar: { title: 'سياسة الخصوصية', description: 'كيف نجمع البيانات الشخصية المرسلة عبر هذا الموقع ونستخدمها ونحميها.', focusKeyword: '' },
    },
    sections: [],
  },
  {
    key: 'terms',
    slug: 'terms',
    content: { en: { title: 'Terms and conditions', intro: '[Placeholder: have your legal adviser supply the terms text.]' }, ar: { title: 'الشروط والأحكام', intro: '[نص مؤقت: اطلب نص الشروط من مستشارك القانوني.]' } },
    seo: {
      en: { title: 'Terms and Conditions', description: 'Terms that apply to equipment hire, transport and courier bookings made through this website.', focusKeyword: '' },
      ar: { title: 'الشروط والأحكام', description: 'الشروط المطبقة على حجوزات تأجير المعدات والنقل والتوصيل عبر هذا الموقع.', focusKeyword: '' },
    },
    sections: [],
  },
];
