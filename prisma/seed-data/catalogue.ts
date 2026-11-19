import type {
  EquipmentCategoryContent,
  EquipmentContent,
  FleetContent,
  ServiceContent,
} from '@app/shared';

type L<T> = { en: T; ar: T };

export interface SeedService {
  slug: string;
  icon: string;
  featured: boolean;
  content: L<ServiceContent>;
  seo: L<{ title: string; description: string; focusKeyword: string }>;
}

export const services: SeedService[] = [
  {
    slug: 'equipment-rental',
    icon: 'crane',
    featured: true,
    content: {
      en: {
        title: 'Equipment rental',
        excerpt: 'Mobile cranes, forklifts, aerial lifts and earthmoving machines, with or without a certified operator.',
        overview:
          'Rent the machine you need for a day, a week or the full project. Every unit is inspected before dispatch, delivered on our own lowbeds, and backed by a breakdown response team across the UAE.',
        features: [
          { title: 'Certified operators', body: 'Operators hold valid third-party certificates for the class of machine they run.' },
          { title: 'Inspected before dispatch', body: 'Load charts, safety devices and hydraulics are checked and logged for every hire.' },
          { title: 'Flexible terms', body: 'Daily, weekly and monthly rates in AED, with or without operator and fuel.' },
        ],
        useCases: ['Building construction', 'Plant shutdowns', 'Warehouse fit-outs', 'Event rigging'],
        faqs: [
          { q: 'Can I rent without an operator?', a: 'Yes, for forklifts, aerial lifts and loaders, provided your operator holds a valid certificate.' },
          { q: 'Do you deliver to site?', a: 'Yes. Delivery and collection are quoted with the hire, to any of the seven emirates.' },
        ],
      },
      ar: {
        title: 'تأجير المعدات',
        excerpt: 'رافعات متحركة ورافعات شوكية ومنصات رفع وآليات حفر، مع مشغل معتمد أو بدونه.',
        overview:
          'استأجر المعدة التي تحتاجها ليوم أو أسبوع أو طوال المشروع. تُفحص كل وحدة قبل الإرسال، وتُنقل على شاحناتنا المنخفضة، ويدعمها فريق استجابة للأعطال في جميع أنحاء الإمارات.',
        features: [
          { title: 'مشغلون معتمدون', body: 'يحمل المشغلون شهادات سارية من جهات مستقلة لفئة المعدة التي يشغلونها.' },
          { title: 'فحص قبل الإرسال', body: 'تُفحص جداول الأحمال وأجهزة السلامة والأنظمة الهيدروليكية وتُسجل لكل عملية تأجير.' },
          { title: 'شروط مرنة', body: 'أسعار يومية وأسبوعية وشهرية بالدرهم، مع المشغل والوقود أو بدونهما.' },
        ],
        useCases: ['إنشاء المباني', 'صيانة المصانع', 'تجهيز المستودعات', 'تجهيزات الفعاليات'],
        faqs: [
          { q: 'هل يمكنني الاستئجار دون مشغل؟', a: 'نعم، للرافعات الشوكية ومنصات الرفع واللوادر، بشرط أن يحمل مشغلك شهادة سارية.' },
          { q: 'هل توصلون المعدات إلى الموقع؟', a: 'نعم، يُسعّر التوصيل والاستلام مع عقد التأجير إلى أي من الإمارات السبع.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Construction Equipment Rental UAE | Cranes & Forklifts',
        description:
          'Construction equipment rental across the UAE: mobile cranes, forklifts, boom lifts and excavators, with certified operators. Fast delivery to any emirate.',
        focusKeyword: 'construction equipment rental UAE',
      },
      ar: {
        title: 'تأجير معدات البناء في الإمارات | رافعات ورافعات شوكية',
        description:
          'تأجير معدات البناء في الإمارات: رافعات متحركة ورافعات شوكية ومنصات رفع وحفارات مع مشغلين معتمدين، وتوصيل سريع إلى أي إمارة.',
        focusKeyword: 'تأجير معدات البناء في الإمارات',
      },
    },
  },
  {
    slug: 'heavy-transport',
    icon: 'lowbed',
    featured: true,
    content: {
      en: {
        title: 'Heavy transport',
        excerpt: 'Lowbed and multi-axle haulage for machinery, transformers and oversized project cargo.',
        overview:
          'We plan the route, arrange permits and police escorts where needed, and move abnormal loads between ports, plants and job sites across the UAE and into the GCC.',
        features: [
          { title: 'Route surveys', body: 'Bridges, turns and overhead lines are checked before the move.' },
          { title: 'Permits handled', body: 'We apply for the road permits each emirate requires for oversized loads.' },
          { title: 'Lashing to standard', body: 'Loads are secured by trained riggers and photographed before departure.' },
        ],
        useCases: ['Plant and machinery moves', 'Transformers', 'Steel structures', 'Port to site project cargo'],
        faqs: [
          { q: 'What is the heaviest load you move?', a: 'Our lowbeds carry up to 60 tonnes; heavier loads are quoted on multi-axle modular trailers.' },
          { q: 'Do you cross into Oman or Saudi Arabia?', a: 'Yes, we handle GCC cross-border moves with customs documentation.' },
        ],
      },
      ar: {
        title: 'النقل الثقيل',
        excerpt: 'نقل بالشاحنات المنخفضة ومتعددة المحاور للآليات والمحولات والبضائع ذات الأبعاد الكبيرة.',
        overview:
          'نخطط المسار ونستخرج التصاريح ونرتب المرافقة الأمنية عند الحاجة، وننقل الأحمال الاستثنائية بين الموانئ والمصانع ومواقع العمل في الإمارات ودول الخليج.',
        features: [
          { title: 'مسح المسار', body: 'نتحقق من الجسور والمنعطفات والخطوط العلوية قبل النقل.' },
          { title: 'تصاريح جاهزة', body: 'نتقدم بطلبات تصاريح الطرق التي تشترطها كل إمارة للأحمال الكبيرة.' },
          { title: 'تثبيت وفق المعايير', body: 'يثبت الحمولة فنيون مدربون وتُصور قبل الانطلاق.' },
        ],
        useCases: ['نقل المصانع والآليات', 'المحولات الكهربائية', 'الهياكل الفولاذية', 'بضائع المشاريع من الميناء إلى الموقع'],
        faqs: [
          { q: 'ما أثقل حمولة تنقلونها؟', a: 'تحمل شاحناتنا المنخفضة حتى 60 طنًا، وتُسعّر الأحمال الأثقل على مقطورات معيارية متعددة المحاور.' },
          { q: 'هل تعبرون إلى عُمان أو السعودية؟', a: 'نعم، ننفذ عمليات النقل عبر حدود الخليج مع مستندات الجمارك.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Lowbed Trailer Dubai | Heavy Transport UAE',
        description:
          'Lowbed trailer and heavy haulage in Dubai and across the UAE. Route surveys, permits and escorts for machinery, transformers and project cargo.',
        focusKeyword: 'lowbed trailer Dubai',
      },
      ar: {
        title: 'شاحنات منخفضة في دبي | النقل الثقيل في الإمارات',
        description:
          'شاحنات منخفضة ونقل ثقيل في دبي وجميع أنحاء الإمارات، مع مسح المسار والتصاريح والمرافقة للآليات والمحولات وبضائع المشاريع.',
        focusKeyword: 'شاحنات منخفضة دبي',
      },
    },
  },
  {
    slug: 'freight-truckload',
    icon: 'truck',
    featured: true,
    content: {
      en: {
        title: 'Freight & truckload',
        excerpt: 'Full and part truckloads on flatbeds, curtain-siders, reefers and container trailers.',
        overview:
          'Book a full truck or share one. We run scheduled lanes between Jebel Ali, Khalifa Port and the industrial areas of every emirate, with live updates from pickup to delivery.',
        features: [
          { title: 'FTL and LTL', body: 'Pay for the whole truck or only the pallet space you use.' },
          { title: 'Temperature control', body: 'Reefer trailers for food and pharmaceuticals, logged end to end.' },
          { title: 'Container haulage', body: '20 and 40 foot boxes to and from Jebel Ali and Khalifa Port.' },
        ],
        useCases: ['Retail distribution', 'Building materials', 'Container pickups', 'Cold chain'],
        faqs: [
          { q: 'How fast can you collect?', a: 'Same day for bookings received before noon, subject to truck availability.' },
          { q: 'Is cargo insured?', a: 'Goods-in-transit cover is available on request and quoted with the move.' },
        ],
      },
      ar: {
        title: 'الشحن والحمولات',
        excerpt: 'حمولات كاملة وجزئية على شاحنات مسطحة وستائرية ومبردة ومقطورات حاويات.',
        overview:
          'احجز شاحنة كاملة أو شارك واحدة. نشغّل خطوطًا منتظمة بين جبل علي وميناء خليفة والمناطق الصناعية في كل إمارة، مع تحديثات مباشرة من الاستلام حتى التسليم.',
        features: [
          { title: 'حمولة كاملة أو جزئية', body: 'ادفع ثمن الشاحنة كاملة أو المساحة التي تستخدمها فقط.' },
          { title: 'التحكم بالحرارة', body: 'مقطورات مبردة للأغذية والأدوية مع تسجيل كامل للحرارة.' },
          { title: 'نقل الحاويات', body: 'حاويات 20 و40 قدمًا من وإلى جبل علي وميناء خليفة.' },
        ],
        useCases: ['توزيع التجزئة', 'مواد البناء', 'استلام الحاويات', 'سلسلة التبريد'],
        faqs: [
          { q: 'ما مدى سرعة الاستلام؟', a: 'في اليوم نفسه للحجوزات قبل الظهر، حسب توفر الشاحنات.' },
          { q: 'هل البضائع مؤمنة؟', a: 'يتوفر تأمين البضائع أثناء النقل عند الطلب ويُسعّر مع الشحنة.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Truck Transport UAE | Freight and Logistics Dubai',
        description:
          'Truck transport across the UAE: FTL, LTL, reefer and container haulage from Jebel Ali and Khalifa Port. Freight and logistics in Dubai with live updates.',
        focusKeyword: 'truck transport UAE',
      },
      ar: {
        title: 'نقل بالشاحنات في الإمارات | الشحن واللوجستيات في دبي',
        description:
          'نقل بالشاحنات في الإمارات: حمولات كاملة وجزئية ومبردة ونقل حاويات من جبل علي وميناء خليفة، مع تحديثات مباشرة.',
        focusKeyword: 'نقل بالشاحنات في الإمارات',
      },
    },
  },
  {
    slug: 'courier-express',
    icon: 'parcel',
    featured: true,
    content: {
      en: {
        title: 'Courier & express',
        excerpt: 'Same-day and next-day delivery within cities and between emirates.',
        overview:
          'Documents, spare parts and parcels collected within two hours and delivered the same day across Dubai, Sharjah and Abu Dhabi, or next day to every other emirate.',
        features: [
          { title: 'Two-hour pickup', body: 'A rider or van at your door within two hours in major cities.' },
          { title: 'Proof of delivery', body: 'Signature and photo captured at handover.' },
          { title: 'Business accounts', body: 'Monthly invoicing and bulk booking for regular shippers.' },
        ],
        useCases: ['Urgent spare parts', 'Contracts and documents', 'E-commerce orders', 'Site deliveries'],
        faqs: [
          { q: 'What is the cut-off for same-day delivery?', a: 'Orders booked before 1 pm are delivered the same day within the same city.' },
          { q: 'Can I track my parcel?', a: 'Yes, every shipment gets a tracking number you can check on this site.' },
        ],
      },
      ar: {
        title: 'التوصيل السريع',
        excerpt: 'توصيل في اليوم نفسه أو اليوم التالي داخل المدن وبين الإمارات.',
        overview:
          'نستلم المستندات وقطع الغيار والطرود خلال ساعتين ونوصلها في اليوم نفسه داخل دبي والشارقة وأبوظبي، أو في اليوم التالي إلى باقي الإمارات.',
        features: [
          { title: 'استلام خلال ساعتين', body: 'مندوب أو شاحنة صغيرة عند بابك خلال ساعتين في المدن الرئيسية.' },
          { title: 'إثبات التسليم', body: 'توقيع وصورة عند التسليم.' },
          { title: 'حسابات الشركات', body: 'فوترة شهرية وحجز جماعي للشاحنين الدائمين.' },
        ],
        useCases: ['قطع الغيار العاجلة', 'العقود والمستندات', 'طلبات التجارة الإلكترونية', 'التوصيل إلى المواقع'],
        faqs: [
          { q: 'ما آخر موعد للتوصيل في اليوم نفسه؟', a: 'الطلبات المحجوزة قبل الساعة 1 ظهرًا تُسلم في اليوم نفسه داخل المدينة.' },
          { q: 'هل يمكنني تتبع شحنتي؟', a: 'نعم، تحصل كل شحنة على رقم تتبع يمكنك التحقق منه على هذا الموقع.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Courier Service UAE | Same-Day Delivery Dubai',
        description:
          'Courier service across the UAE: two-hour pickup, same-day delivery in Dubai, Sharjah and Abu Dhabi, next day to every emirate, with tracking.',
        focusKeyword: 'courier service UAE',
      },
      ar: {
        title: 'خدمة توصيل في الإمارات | توصيل في اليوم نفسه في دبي',
        description:
          'خدمة توصيل في الإمارات: استلام خلال ساعتين وتوصيل في اليوم نفسه في دبي والشارقة وأبوظبي، وفي اليوم التالي لباقي الإمارات مع التتبع.',
        focusKeyword: 'خدمة توصيل في الإمارات',
      },
    },
  },
  {
    slug: 'warehousing',
    icon: 'warehouse',
    featured: false,
    content: {
      en: {
        title: 'Warehousing',
        excerpt: 'Bonded and general storage with pick, pack and dispatch.',
        overview:
          'Short and long-term storage near Jebel Ali with racking, forklifts on hand and a warehouse team that picks, packs and ships to your customers.',
        features: [
          { title: 'Racked and open storage', body: 'Pallet racking plus open yard space for machinery and steel.' },
          { title: 'Inventory reports', body: 'Weekly stock reports and inbound/outbound logs.' },
          { title: 'Cross-docking', body: 'Container devanning and onward truck dispatch in one move.' },
        ],
        useCases: ['Project material staging', 'Retail stock', 'Spare parts', 'Container devanning'],
        faqs: [
          { q: 'What is the minimum storage term?', a: 'One week for pallets; open yard space is quoted monthly.' },
          { q: 'Do you offer bonded storage?', a: 'Available through partner facilities; ask our team for current capacity.' },
        ],
      },
      ar: {
        title: 'التخزين',
        excerpt: 'تخزين عام وجمركي مع الانتقاء والتغليف والإرسال.',
        overview:
          'تخزين قصير وطويل الأمد بالقرب من جبل علي مع رفوف ورافعات شوكية جاهزة، وفريق مستودع ينتقي ويغلف ويشحن إلى عملائك.',
        features: [
          { title: 'تخزين على رفوف وفي ساحات مفتوحة', body: 'رفوف للمنصات إضافة إلى ساحات مفتوحة للآليات والحديد.' },
          { title: 'تقارير المخزون', body: 'تقارير أسبوعية وسجلات للوارد والصادر.' },
          { title: 'المناولة المباشرة', body: 'تفريغ الحاويات وإرسالها بالشاحنات في عملية واحدة.' },
        ],
        useCases: ['تجهيز مواد المشاريع', 'مخزون التجزئة', 'قطع الغيار', 'تفريغ الحاويات'],
        faqs: [
          { q: 'ما أقل مدة للتخزين؟', a: 'أسبوع واحد للمنصات، وتُسعّر الساحات المفتوحة شهريًا.' },
          { q: 'هل تقدمون تخزينًا جمركيًا؟', a: 'متاح عبر منشآت شركائنا، اسأل فريقنا عن السعة الحالية.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Warehousing Dubai | Storage near Jebel Ali',
        description:
          'Warehousing in Dubai near Jebel Ali: racked and open-yard storage, pick and pack, container devanning and onward delivery across the UAE.',
        focusKeyword: 'warehousing Dubai',
      },
      ar: {
        title: 'التخزين في دبي | مستودعات قرب جبل علي',
        description:
          'مستودعات في دبي قرب جبل علي: تخزين على الرفوف وفي ساحات مفتوحة، انتقاء وتغليف، تفريغ حاويات وتوصيل إلى جميع الإمارات.',
        focusKeyword: 'مستودعات دبي',
      },
    },
  },
  {
    slug: 'rigging-lifting',
    icon: 'hook',
    featured: false,
    content: {
      en: {
        title: 'Rigging & lifting',
        excerpt: 'Engineered lift plans, riggers and lifting supervisors for critical lifts.',
        overview:
          'For tandem lifts, tight sites and heavy installations we prepare the lift plan, select the crane and rigging, and supervise the lift from start to finish.',
        features: [
          { title: 'Lift plans', body: 'Load calculations, ground bearing checks and crane positioning drawings.' },
          { title: 'Certified rigging gear', body: 'Slings, shackles and spreader beams with current test certificates.' },
          { title: 'Lifting supervisors', body: 'An appointed person controls every critical lift on site.' },
        ],
        useCases: ['HVAC and chiller installs', 'Tandem crane lifts', 'Generator placement', 'Steel erection'],
        faqs: [
          { q: 'When do I need a lift plan?', a: 'For any lift near capacity, over people or structures, or using more than one crane.' },
          { q: 'Can you work at night?', a: 'Yes. Night lifts are common on live roads and busy sites, subject to permits.' },
        ],
      },
      ar: {
        title: 'الرفع والتعليق',
        excerpt: 'خطط رفع هندسية وفنيو تعليق ومشرفو رفع للعمليات الحرجة.',
        overview:
          'للرفع المزدوج والمواقع الضيقة والتركيبات الثقيلة، نعد خطة الرفع ونختار الرافعة ومعدات التعليق ونشرف على العملية من البداية إلى النهاية.',
        features: [
          { title: 'خطط الرفع', body: 'حسابات الأحمال وفحص تحمل التربة ومخططات تموضع الرافعة.' },
          { title: 'معدات تعليق معتمدة', body: 'حبال وأقفال وعوارض توزيع بشهادات اختبار سارية.' },
          { title: 'مشرفو رفع', body: 'شخص معيّن يتحكم في كل عملية رفع حرجة في الموقع.' },
        ],
        useCases: ['تركيب وحدات التكييف والمبردات', 'الرفع بالرافعتين', 'تركيب المولدات', 'تركيب الهياكل الفولاذية'],
        faqs: [
          { q: 'متى أحتاج خطة رفع؟', a: 'لأي رفع قريب من الحد الأقصى، أو فوق الأشخاص والمباني، أو باستخدام أكثر من رافعة.' },
          { q: 'هل تعملون ليلًا؟', a: 'نعم، الرفع الليلي شائع على الطرق والمواقع المزدحمة، حسب التصاريح.' },
        ],
      },
    },
    seo: {
      en: {
        title: 'Crane Rental Dubai | Rigging and Lifting Services',
        description:
          'Crane rental in Dubai with engineered lift plans, certified rigging gear and lifting supervisors for critical and tandem lifts across the UAE.',
        focusKeyword: 'crane rental Dubai',
      },
      ar: {
        title: 'تأجير رافعات في دبي | خدمات الرفع والتعليق',
        description:
          'تأجير رافعات في دبي مع خطط رفع هندسية ومعدات تعليق معتمدة ومشرفي رفع لعمليات الرفع الحرجة والمزدوجة في الإمارات.',
        focusKeyword: 'تأجير رافعات دبي',
      },
    },
  },
];

export const categories: { slug: string; content: L<EquipmentCategoryContent> }[] = [
  {
    slug: 'cranes',
    content: {
      en: { name: 'Cranes', description: 'Mobile, crawler and tower cranes from 25 to 300 tonnes.' },
      ar: { name: 'الرافعات', description: 'رافعات متحركة وزاحفة وبرجية من 25 إلى 300 طن.' },
    },
  },
  {
    slug: 'forklifts',
    content: {
      en: { name: 'Forklifts & telehandlers', description: 'Diesel and electric forklifts and telescopic handlers.' },
      ar: { name: 'الرافعات الشوكية والتلسكوبية', description: 'رافعات شوكية تعمل بالديزل والكهرباء ورافعات تلسكوبية.' },
    },
  },
  {
    slug: 'aerial-lifts',
    content: {
      en: { name: 'Aerial lifts', description: 'Boom lifts and scissor lifts for safe work at height.' },
      ar: { name: 'منصات الرفع', description: 'منصات ذراعية ومقصية للعمل الآمن على المرتفعات.' },
    },
  },
  {
    slug: 'earthmoving',
    content: {
      en: { name: 'Earthmoving', description: 'Excavators and wheel loaders for site preparation.' },
      ar: { name: 'معدات الحفر', description: 'حفارات ولوادر لتجهيز المواقع.' },
    },
  },
  {
    slug: 'handling',
    content: {
      en: { name: 'Handling & power', description: 'Reach stackers, pallet jacks and generators.' },
      ar: { name: 'المناولة والطاقة', description: 'رافعات حاويات وعربات منصات ومولدات.' },
    },
  },
];

export interface SeedEquipment {
  slug: string;
  category: string;
  capacityValue: number;
  capacityUnit: 't' | 'kg' | 'm' | 'kVA';
  withOperator: boolean;
  operatorOptional: boolean;
  featured: boolean;
  availability: 'available' | 'limited' | 'on-request';
  en: { name: string; summary: string; specs: [string, string][] };
  ar: { name: string; summary: string; specs: [string, string][] };
}

const termsEn = ['Minimum hire: 1 day', 'Rates in AED, excluding VAT', 'Delivery quoted by emirate'];
const termsAr = ['أقل مدة تأجير: يوم واحد', 'الأسعار بالدرهم ولا تشمل ضريبة القيمة المضافة', 'يُسعّر التوصيل حسب الإمارة'];

export const equipment: SeedEquipment[] = [
  {
    slug: 'mobile-crane-50t',
    category: 'cranes',
    capacityValue: 50,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: false,
    featured: true,
    availability: 'available',
    en: { name: '50 t mobile crane', summary: 'All-terrain crane for building and industrial lifts.', specs: [['Max capacity', '50 t'], ['Main boom', '40 m'], ['Max tip height', '55 m'], ['Axles', '4']] },
    ar: { name: 'رافعة متحركة 50 طن', summary: 'رافعة لجميع التضاريس لعمليات الرفع في المباني والمنشآت الصناعية.', specs: [['الحمولة القصوى', '50 طن'], ['الذراع الرئيسي', '40 م'], ['أقصى ارتفاع', '55 م'], ['المحاور', '4']] },
  },
  {
    slug: 'mobile-crane-100t',
    category: 'cranes',
    capacityValue: 100,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: false,
    featured: true,
    availability: 'limited',
    en: { name: '100 t mobile crane', summary: 'Heavy all-terrain crane for plant and steel erection.', specs: [['Max capacity', '100 t'], ['Main boom', '60 m'], ['Max tip height', '80 m'], ['Axles', '5']] },
    ar: { name: 'رافعة متحركة 100 طن', summary: 'رافعة ثقيلة لجميع التضاريس لتركيب المعدات والهياكل الفولاذية.', specs: [['الحمولة القصوى', '100 طن'], ['الذراع الرئيسي', '60 م'], ['أقصى ارتفاع', '80 م'], ['المحاور', '5']] },
  },
  {
    slug: 'crawler-crane-250t',
    category: 'cranes',
    capacityValue: 250,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: false,
    featured: false,
    availability: 'on-request',
    en: { name: '250 t crawler crane', summary: 'Lattice-boom crawler for long-duration heavy lifts.', specs: [['Max capacity', '250 t'], ['Main boom', '84 m'], ['Ground pressure', '1.2 kg/cm²'], ['Transport loads', '9']] },
    ar: { name: 'رافعة زاحفة 250 طن', summary: 'رافعة زاحفة بذراع شبكي لعمليات الرفع الثقيلة طويلة المدة.', specs: [['الحمولة القصوى', '250 طن'], ['الذراع الرئيسي', '84 م'], ['ضغط التربة', '1.2 كغ/سم²'], ['حمولات النقل', '9']] },
  },
  {
    slug: 'tower-crane-10t',
    category: 'cranes',
    capacityValue: 10,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: false,
    featured: false,
    availability: 'on-request',
    en: { name: '10 t tower crane', summary: 'Flat-top tower crane for high-rise construction.', specs: [['Max capacity', '10 t'], ['Jib length', '60 m'], ['Tip load', '2.1 t'], ['Free-standing height', '50 m']] },
    ar: { name: 'رافعة برجية 10 طن', summary: 'رافعة برجية مسطحة لإنشاء الأبراج.', specs: [['الحمولة القصوى', '10 طن'], ['طول الذراع', '60 م'], ['الحمولة عند الطرف', '2.1 طن'], ['الارتفاع الحر', '50 م']] },
  },
  {
    slug: 'diesel-forklift-5t',
    category: 'forklifts',
    capacityValue: 5,
    capacityUnit: 't',
    withOperator: false,
    operatorOptional: true,
    featured: true,
    availability: 'available',
    en: { name: '5 t diesel forklift', summary: 'Outdoor forklift for yards, ports and building sites.', specs: [['Capacity', '5,000 kg'], ['Lift height', '4.5 m'], ['Load centre', '600 mm'], ['Fuel', 'Diesel']] },
    ar: { name: 'رافعة شوكية ديزل 5 طن', summary: 'رافعة شوكية للساحات والموانئ ومواقع البناء.', specs: [['الحمولة', '5,000 كغ'], ['ارتفاع الرفع', '4.5 م'], ['مركز الحمولة', '600 مم'], ['الوقود', 'ديزل']] },
  },
  {
    slug: 'electric-forklift-2-5t',
    category: 'forklifts',
    capacityValue: 2.5,
    capacityUnit: 't',
    withOperator: false,
    operatorOptional: true,
    featured: false,
    availability: 'available',
    en: { name: '2.5 t electric forklift', summary: 'Quiet, zero-emission forklift for warehouses.', specs: [['Capacity', '2,500 kg'], ['Lift height', '6 m'], ['Battery', '80 V'], ['Turning radius', '2.1 m']] },
    ar: { name: 'رافعة شوكية كهربائية 2.5 طن', summary: 'رافعة شوكية هادئة وعديمة الانبعاثات للمستودعات.', specs: [['الحمولة', '2,500 كغ'], ['ارتفاع الرفع', '6 م'], ['البطارية', '80 فولت'], ['نصف قطر الدوران', '2.1 م']] },
  },
  {
    slug: 'telehandler-17m',
    category: 'forklifts',
    capacityValue: 4,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: true,
    featured: true,
    availability: 'available',
    en: { name: '17 m telehandler', summary: 'Telescopic handler for placing loads at height.', specs: [['Capacity', '4,000 kg'], ['Lift height', '17 m'], ['Forward reach', '13 m'], ['Drive', '4×4']] },
    ar: { name: 'رافعة تلسكوبية 17 م', summary: 'رافعة تلسكوبية لوضع الأحمال على الارتفاعات.', specs: [['الحمولة', '4,000 كغ'], ['ارتفاع الرفع', '17 م'], ['المدى الأمامي', '13 م'], ['الدفع', 'رباعي']] },
  },
  {
    slug: 'boom-lift-26m',
    category: 'aerial-lifts',
    capacityValue: 26,
    capacityUnit: 'm',
    withOperator: false,
    operatorOptional: true,
    featured: true,
    availability: 'available',
    en: { name: '26 m articulating boom lift', summary: 'Reach up and over obstacles on facades and steelwork.', specs: [['Working height', '26 m'], ['Outreach', '15 m'], ['Platform load', '230 kg'], ['Drive', 'Diesel 4×4']] },
    ar: { name: 'منصة ذراعية مفصلية 26 م', summary: 'للوصول فوق العوائق في الواجهات والهياكل الفولاذية.', specs: [['ارتفاع العمل', '26 م'], ['المدى الأفقي', '15 م'], ['حمولة المنصة', '230 كغ'], ['الدفع', 'ديزل رباعي']] },
  },
  {
    slug: 'scissor-lift-12m',
    category: 'aerial-lifts',
    capacityValue: 12,
    capacityUnit: 'm',
    withOperator: false,
    operatorOptional: true,
    featured: false,
    availability: 'available',
    en: { name: '12 m electric scissor lift', summary: 'Stable indoor platform for MEP and fit-out work.', specs: [['Working height', '12 m'], ['Platform load', '320 kg'], ['Width', '1.2 m'], ['Power', 'Electric']] },
    ar: { name: 'منصة مقصية كهربائية 12 م', summary: 'منصة مستقرة للأعمال الداخلية والكهروميكانيكية والتشطيبات.', specs: [['ارتفاع العمل', '12 م'], ['حمولة المنصة', '320 كغ'], ['العرض', '1.2 م'], ['الطاقة', 'كهربائية']] },
  },
  {
    slug: 'excavator-20t',
    category: 'earthmoving',
    capacityValue: 20,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: true,
    featured: false,
    availability: 'available',
    en: { name: '20 t crawler excavator', summary: 'General-purpose excavator for trenching and site prep.', specs: [['Operating weight', '20 t'], ['Dig depth', '6.6 m'], ['Bucket', '1.0 m³'], ['Engine', '110 kW']] },
    ar: { name: 'حفارة زاحفة 20 طن', summary: 'حفارة متعددة الاستخدامات للخنادق وتجهيز المواقع.', specs: [['وزن التشغيل', '20 طن'], ['عمق الحفر', '6.6 م'], ['الدلو', '1.0 م³'], ['المحرك', '110 كيلوواط']] },
  },
  {
    slug: 'wheel-loader-3m3',
    category: 'earthmoving',
    capacityValue: 3,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: true,
    featured: false,
    availability: 'limited',
    en: { name: '3 m³ wheel loader', summary: 'Loads sand, aggregate and spoil onto trucks.', specs: [['Bucket', '3 m³'], ['Operating weight', '17 t'], ['Dump height', '2.9 m'], ['Engine', '160 kW']] },
    ar: { name: 'لودر بعجلات 3 م³', summary: 'لتحميل الرمل والركام ومخلفات الحفر على الشاحنات.', specs: [['الدلو', '3 م³'], ['وزن التشغيل', '17 طن'], ['ارتفاع التفريغ', '2.9 م'], ['المحرك', '160 كيلوواط']] },
  },
  {
    slug: 'reach-stacker-45t',
    category: 'handling',
    capacityValue: 45,
    capacityUnit: 't',
    withOperator: true,
    operatorOptional: false,
    featured: true,
    availability: 'limited',
    en: { name: '45 t reach stacker', summary: 'Stacks loaded containers five high in port yards.', specs: [['Capacity, 1st row', '45 t'], ['Stacking', '5 high'], ['Container sizes', '20 / 40 ft'], ['Engine', '250 kW']] },
    ar: { name: 'رافعة حاويات 45 طن', summary: 'ترص الحاويات المحملة حتى خمسة طوابق في ساحات الموانئ.', specs: [['الحمولة في الصف الأول', '45 طن'], ['الرص', '5 طوابق'], ['أحجام الحاويات', '20 / 40 قدم'], ['المحرك', '250 كيلوواط']] },
  },
  {
    slug: 'generator-500kva',
    category: 'handling',
    capacityValue: 500,
    capacityUnit: 'kVA',
    withOperator: false,
    operatorOptional: true,
    featured: false,
    availability: 'available',
    en: { name: '500 kVA silent generator', summary: 'Canopied diesel generator for sites and events.', specs: [['Prime power', '500 kVA'], ['Voltage', '400 V, 3-phase'], ['Fuel tank', '1,000 L'], ['Noise', '75 dB(A) at 7 m']] },
    ar: { name: 'مولد صامت 500 كيلوفولت أمبير', summary: 'مولد ديزل مغلق للمواقع والفعاليات.', specs: [['القدرة الأساسية', '500 كيلوفولت أمبير'], ['الجهد', '400 فولت، ثلاثي الطور'], ['خزان الوقود', '1,000 لتر'], ['الضجيج', '75 ديسيبل على 7 م']] },
  },
];

export const toEquipmentContent = (e: SeedEquipment): L<EquipmentContent> => ({
  en: {
    name: e.en.name,
    summary: e.en.summary,
    description: `${e.en.summary} Available for daily, weekly and monthly hire across Dubai, Abu Dhabi, Sharjah and the northern emirates${e.withOperator ? ', with a certified operator' : ''}.`,
    specs: e.en.specs.map(([label, value]) => ({ label, value })),
    rentalTerms: termsEn,
  },
  ar: {
    name: e.ar.name,
    summary: e.ar.summary,
    description: `${e.ar.summary} متاحة للتأجير اليومي والأسبوعي والشهري في دبي وأبوظبي والشارقة والإمارات الشمالية${e.withOperator ? ' مع مشغل معتمد' : ''}.`,
    specs: e.ar.specs.map(([label, value]) => ({ label, value })),
    rentalTerms: termsAr,
  },
});

export const fleet: { slug: string; payloadTonnes: number; deckLengthM: number; content: L<FleetContent> }[] = [
  {
    slug: 'flatbed',
    payloadTonnes: 25,
    deckLengthM: 13.6,
    content: {
      en: { name: 'Flatbed trailer', summary: 'Open deck for steel, timber, machinery and palletised goods.', bestFor: ['Steel', 'Building materials', 'Machinery'] },
      ar: { name: 'مقطورة مسطحة', summary: 'سطح مفتوح للحديد والأخشاب والآليات والبضائع على المنصات.', bestFor: ['الحديد', 'مواد البناء', 'الآليات'] },
    },
  },
  {
    slug: 'lowbed',
    payloadTonnes: 60,
    deckLengthM: 12,
    content: {
      en: { name: 'Lowbed trailer', summary: 'Low deck height for tall and heavy machinery.', bestFor: ['Excavators', 'Cranes', 'Transformers'] },
      ar: { name: 'مقطورة منخفضة', summary: 'سطح منخفض للآليات العالية والثقيلة.', bestFor: ['الحفارات', 'الرافعات', 'المحولات'] },
    },
  },
  {
    slug: 'reefer',
    payloadTonnes: 22,
    deckLengthM: 13.6,
    content: {
      en: { name: 'Reefer trailer', summary: 'Temperature-controlled from -25 °C to +25 °C.', bestFor: ['Food', 'Pharmaceuticals', 'Flowers'] },
      ar: { name: 'مقطورة مبردة', summary: 'تحكم بالحرارة من -25 إلى +25 درجة مئوية.', bestFor: ['الأغذية', 'الأدوية', 'الزهور'] },
    },
  },
  {
    slug: 'curtain-side',
    payloadTonnes: 24,
    deckLengthM: 13.6,
    content: {
      en: { name: 'Curtain-side trailer', summary: 'Side loading by forklift, covered in transit.', bestFor: ['Retail', 'FMCG', 'Packaged goods'] },
      ar: { name: 'مقطورة ستائرية', summary: 'تحميل جانبي بالرافعة الشوكية مع تغطية أثناء النقل.', bestFor: ['التجزئة', 'السلع الاستهلاكية', 'البضائع المعبأة'] },
    },
  },
  {
    slug: 'container-trailer',
    payloadTonnes: 30,
    deckLengthM: 12.2,
    content: {
      en: { name: 'Container trailer', summary: 'Skeletal chassis for 20 and 40 foot containers.', bestFor: ['Port pickups', 'Import/export', 'Project cargo'] },
      ar: { name: 'مقطورة حاويات', summary: 'هيكل مخصص لحاويات 20 و40 قدمًا.', bestFor: ['الاستلام من الموانئ', 'الاستيراد والتصدير', 'بضائع المشاريع'] },
    },
  },
  {
    slug: 'courier-van',
    payloadTonnes: 1.2,
    deckLengthM: 3.2,
    content: {
      en: { name: 'Courier van', summary: 'Same-day city and inter-emirate parcel delivery.', bestFor: ['Parcels', 'Documents', 'Spare parts'] },
      ar: { name: 'شاحنة توصيل صغيرة', summary: 'توصيل الطرود داخل المدن وبين الإمارات في اليوم نفسه.', bestFor: ['الطرود', 'المستندات', 'قطع الغيار'] },
    },
  },
];
