import type {
  BlogContent,
  FaqGroup,
  FaqItem,
  ProjectContent,
  TeamContent,
  TestimonialContent,
} from '@app/shared';

type L<T> = { en: T; ar: T };

/** Generic placeholders only. Real client logos are uploaded later in Admin → Clients. */
export const clients = Array.from({ length: 12 }, (_, i) => ({ name: `Client ${i + 1}`, order: i }));

// Demo testimonials: placeholder names and companies, clearly marked for replacement.
export const testimonials: { rating: number; company: string; content: L<TestimonialContent> }[] = [
  {
    rating: 5,
    company: '[Contractor A]',
    content: {
      en: { name: '[Name]', role: 'Project manager', quote: 'The 100-tonne crane arrived at 6 am as promised and the lift plan was ready before we asked for it.' },
      ar: { name: '[الاسم]', role: 'مدير مشروع', quote: 'وصلت الرافعة 100 طن في السادسة صباحًا كما وعدوا، وكانت خطة الرفع جاهزة قبل أن نطلبها.' },
    },
  },
  {
    rating: 5,
    company: '[Retailer B]',
    content: {
      en: { name: '[Name]', role: 'Logistics lead', quote: 'Two trucks a day from Jebel Ali to our Sharjah store for six months, and not one missed slot.' },
      ar: { name: '[الاسم]', role: 'مسؤول اللوجستيات', quote: 'شاحنتان يوميًا من جبل علي إلى متجرنا في الشارقة لستة أشهر، دون أن يفوتنا موعد واحد.' },
    },
  },
  {
    rating: 5,
    company: '[Facility operator C]',
    content: {
      en: { name: '[Name]', role: 'Facilities manager', quote: 'Their scissor lifts and operators kept our mall fit-out on schedule through Ramadan.' },
      ar: { name: '[الاسم]', role: 'مدير المرافق', quote: 'حافظت منصاتهم المقصية ومشغلوهم على جدول تجهيز المركز التجاري خلال رمضان.' },
    },
  },
  {
    rating: 4,
    company: '[Manufacturer D]',
    content: {
      en: { name: '[Name]', role: 'Plant engineer', quote: 'They moved a 48-tonne press from Mussafah to Ras Al Khaimah overnight with all permits in place.' },
      ar: { name: '[الاسم]', role: 'مهندس مصنع', quote: 'نقلوا مكبسًا وزنه 48 طنًا من مصفح إلى رأس الخيمة خلال الليل مع جميع التصاريح.' },
    },
  },
  {
    rating: 5,
    company: '[Trading company E]',
    content: {
      en: { name: '[Name]', role: 'Operations director', quote: 'Same-day courier for spare parts saved us two days of downtime last quarter.' },
      ar: { name: '[الاسم]', role: 'مدير العمليات', quote: 'وفّر علينا التوصيل في اليوم نفسه لقطع الغيار يومين من التوقف في الربع الماضي.' },
    },
  },
  {
    rating: 5,
    company: '[Events company F]',
    content: {
      en: { name: '[Name]', role: 'Production manager', quote: 'Generators, forklifts and a telehandler on site in Abu Dhabi within 24 hours of our call.' },
      ar: { name: '[الاسم]', role: 'مدير الإنتاج', quote: 'مولدات ورافعات شوكية ورافعة تلسكوبية في موقعنا بأبوظبي خلال 24 ساعة من اتصالنا.' },
    },
  },
];

export const projects: { slug: string; year: number; emirate: string; featured: boolean; content: L<ProjectContent> }[] = [
  {
    slug: 'port-crane-components-khalifa-port',
    year: 2025,
    emirate: 'abu-dhabi',
    featured: true,
    content: {
      en: {
        title: 'Port equipment components, Khalifa Port',
        summary: 'Heavy haulage of oversized port equipment sections from quay to assembly yard.',
        challenge: 'Twelve oversized sections had to move across a live terminal without stopping vessel operations.',
        solution: 'Night moves on multi-axle trailers, a pre-agreed route with terminal control and two lifting supervisors.',
        results: ['12 sections delivered in 9 nights', 'Zero terminal downtime', 'No safety incidents'],
      },
      ar: {
        title: 'مكونات معدات الميناء، ميناء خليفة',
        summary: 'نقل ثقيل لأجزاء معدات ميناء ذات أبعاد كبيرة من الرصيف إلى ساحة التجميع.',
        challenge: 'كان يجب نقل اثني عشر جزءًا كبيرًا عبر محطة عاملة دون إيقاف عمليات السفن.',
        solution: 'نقل ليلي على مقطورات متعددة المحاور، بمسار متفق عليه مع إدارة المحطة ومشرفي رفع اثنين.',
        results: ['تسليم 12 جزءًا في 9 ليالٍ', 'دون توقف للمحطة', 'دون حوادث سلامة'],
      },
    },
  },
  {
    slug: 'high-rise-tower-crane-dubai-marina',
    year: 2024,
    emirate: 'dubai',
    featured: true,
    content: {
      en: {
        title: 'Tower crane support, Dubai Marina',
        summary: 'Tower crane erection and mobile crane support for a residential tower.',
        challenge: 'A tight plot between two occupied buildings with weekend-only road closures.',
        solution: 'A 250 t crawler crane erected the tower crane over two weekends with an engineered lift plan.',
        results: ['Erected on schedule', 'Two weekend closures only', 'Lift plan approved first time'],
      },
      ar: {
        title: 'دعم الرافعة البرجية، دبي مارينا',
        summary: 'تركيب رافعة برجية ودعم برافعة متحركة لبرج سكني.',
        challenge: 'قطعة أرض ضيقة بين مبنيين مأهولين مع إغلاق الطرق في عطلات نهاية الأسبوع فقط.',
        solution: 'ركّبت رافعة زاحفة 250 طن الرافعة البرجية خلال عطلتي نهاية أسبوع بخطة رفع هندسية.',
        results: ['تركيب في الموعد', 'إغلاقان فقط في نهاية الأسبوع', 'اعتماد خطة الرفع من المرة الأولى'],
      },
    },
  },
  {
    slug: 'retail-distribution-northern-emirates',
    year: 2025,
    emirate: 'sharjah',
    featured: true,
    content: {
      en: {
        title: 'Retail distribution, northern emirates',
        summary: 'Daily truckload and courier network serving 40 stores from Sharjah.',
        challenge: 'Stores needed fixed morning delivery windows and same-day top-ups.',
        solution: 'Scheduled curtain-side lanes at dawn plus courier vans for urgent top-ups.',
        results: ['98% on-time deliveries', '40 stores served daily', 'Same-day top-ups in 4 hours'],
      },
      ar: {
        title: 'توزيع التجزئة، الإمارات الشمالية',
        summary: 'شبكة يومية للحمولات والتوصيل تخدم 40 متجرًا انطلاقًا من الشارقة.',
        challenge: 'احتاجت المتاجر مواعيد توصيل صباحية ثابتة وتزويدًا إضافيًا في اليوم نفسه.',
        solution: 'خطوط منتظمة بشاحنات ستائرية فجرًا، وشاحنات توصيل صغيرة للطلبات العاجلة.',
        results: ['98% توصيل في الموعد', '40 متجرًا يوميًا', 'تزويد إضافي خلال 4 ساعات'],
      },
    },
  },
  {
    slug: 'power-plant-shutdown-fujairah',
    year: 2024,
    emirate: 'fujairah',
    featured: false,
    content: {
      en: {
        title: 'Plant shutdown support, Fujairah',
        summary: 'Cranes, aerial lifts and generators for a planned maintenance shutdown.',
        challenge: 'Fourteen days to complete inspections across a large site with restricted access.',
        solution: 'A dedicated equipment pool on site, operators on shifts and a breakdown technician on standby.',
        results: ['Shutdown closed a day early', '30 machines on site', '24/7 operator cover'],
      },
      ar: {
        title: 'دعم صيانة محطة، الفجيرة',
        summary: 'رافعات ومنصات رفع ومولدات لصيانة مجدولة.',
        challenge: 'أربعة عشر يومًا لإتمام الفحوصات في موقع كبير بدخول مقيد.',
        solution: 'مجموعة معدات مخصصة في الموقع، ومشغلون بنظام المناوبات، وفني أعطال في حالة استعداد.',
        results: ['إنهاء الصيانة قبل الموعد بيوم', '30 معدة في الموقع', 'تغطية بالمشغلين على مدار الساعة'],
      },
    },
  },
];

export const team: L<TeamContent>[] = [
  { en: { name: '[Name]', role: 'Managing director', bio: 'Leads the company and its key client relationships.' }, ar: { name: '[الاسم]', role: 'المدير العام', bio: 'يقود الشركة وعلاقاتها مع كبار العملاء.' } },
  { en: { name: '[Name]', role: 'Head of operations', bio: 'Runs dispatch, the yard and the fleet across all branches.' }, ar: { name: '[الاسم]', role: 'رئيس العمليات', bio: 'يدير الإرسال والساحة والأسطول في جميع الفروع.' } },
  { en: { name: '[Name]', role: 'HSE manager', bio: 'Owns lifting safety, operator certification and site audits.' }, ar: { name: '[الاسم]', role: 'مدير الصحة والسلامة والبيئة', bio: 'مسؤول عن سلامة الرفع واعتماد المشغلين وتدقيق المواقع.' } },
  { en: { name: '[Name]', role: 'Lifting engineer', bio: 'Prepares lift plans and supervises critical lifts.' }, ar: { name: '[الاسم]', role: 'مهندس رفع', bio: 'يعد خطط الرفع ويشرف على عمليات الرفع الحرجة.' } },
  { en: { name: '[Name]', role: 'Logistics manager', bio: 'Plans truckload lanes and cross-border moves.' }, ar: { name: '[الاسم]', role: 'مدير اللوجستيات', bio: 'يخطط خطوط الشحن وعمليات النقل عبر الحدود.' } },
  { en: { name: '[Name]', role: 'Customer service lead', bio: 'First point of contact for quotes and bookings.' }, ar: { name: '[الاسم]', role: 'مسؤول خدمة العملاء', bio: 'نقطة الاتصال الأولى لعروض الأسعار والحجوزات.' } },
];

export const faqs: { group: FaqGroup; content: L<FaqItem> }[] = [
  { group: 'general', content: { en: { q: 'Which emirates do you cover?', a: 'All seven: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain, plus GCC cross-border moves.' }, ar: { q: 'ما الإمارات التي تغطونها؟', a: 'الإمارات السبع: دبي وأبوظبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين، إضافة إلى النقل عبر حدود الخليج.' } } },
  { group: 'general', content: { en: { q: 'How quickly do you reply to a quote request?', a: 'Within one hour during working hours. Urgent requests are best sent on WhatsApp.' }, ar: { q: 'ما سرعة الرد على طلب عرض السعر؟', a: 'خلال ساعة في أوقات العمل، ويُفضل إرسال الطلبات العاجلة عبر واتساب.' } } },
  { group: 'rental', content: { en: { q: 'Are your operators certified?', a: 'Yes, every operator holds a valid third-party certificate for the machine class.' }, ar: { q: 'هل مشغلوكم معتمدون؟', a: 'نعم، يحمل كل مشغل شهادة سارية من جهة مستقلة لفئة المعدة.' } } },
  { group: 'rental', content: { en: { q: 'What is included in the hire rate?', a: 'The machine, routine maintenance and breakdown cover. Operator, fuel and delivery are quoted separately.' }, ar: { q: 'ماذا يشمل سعر التأجير؟', a: 'المعدة والصيانة الدورية وتغطية الأعطال، ويُسعّر المشغل والوقود والتوصيل بشكل منفصل.' } } },
  { group: 'logistics', content: { en: { q: 'Can you collect containers from Jebel Ali?', a: 'Yes, we collect 20 and 40 foot containers from Jebel Ali and Khalifa Port daily.' }, ar: { q: 'هل تستلمون الحاويات من جبل علي؟', a: 'نعم، نستلم حاويات 20 و40 قدمًا يوميًا من جبل علي وميناء خليفة.' } } },
  { group: 'logistics', content: { en: { q: 'Do you handle permits for oversized loads?', a: 'Yes, we apply for the road permits and escorts each emirate requires.' }, ar: { q: 'هل تستخرجون تصاريح الأحمال الكبيرة؟', a: 'نعم، نتقدم بطلبات تصاريح الطرق والمرافقة التي تشترطها كل إمارة.' } } },
  { group: 'courier', content: { en: { q: 'What is the same-day cut-off?', a: 'Book before 1 pm for same-day delivery within the same city.' }, ar: { q: 'ما آخر موعد للتوصيل في اليوم نفسه؟', a: 'احجز قبل الساعة 1 ظهرًا للتوصيل في اليوم نفسه داخل المدينة.' } } },
  { group: 'courier', content: { en: { q: 'How do I track a shipment?', a: 'Enter your tracking number on the Logistics & Courier page.' }, ar: { q: 'كيف أتتبع شحنتي؟', a: 'أدخل رقم التتبع في صفحة اللوجستيات والتوصيل.' } } },
];

const p = (s: string) => `<p>${s}</p>`;

export const blog: { slug: string; tags: string[]; daysAgo: number; content: L<BlogContent>; seo: L<{ title: string; description: string; focusKeyword: string }> }[] = [
  {
    slug: 'choosing-the-right-crane-for-your-lift',
    tags: ['cranes', 'safety'],
    daysAgo: 7,
    content: {
      en: {
        title: 'Choosing the right crane for your lift in the UAE',
        excerpt: 'Load weight is only the start. Radius, ground conditions and site access decide which crane you need.',
        bodyHtml:
          p('Most crane rental enquiries in Dubai start with a weight. The right crane depends just as much on the radius, the height and the ground it will stand on.') +
          '<h2>Start with the radius</h2>' +
          p('A 50 tonne crane lifts far less than 50 tonnes at 20 metres. Ask for the load chart at your working radius, not the headline capacity.') +
          '<h2>Check the ground</h2>' +
          p('Outrigger loads on reclaimed land or fresh backfill need mats or a ground survey. We check this as part of every lift plan.'),
      },
      ar: {
        title: 'كيف تختار الرافعة المناسبة لعملية الرفع في الإمارات',
        excerpt: 'وزن الحمولة مجرد بداية؛ نصف القطر وحالة التربة والوصول إلى الموقع تحدد الرافعة المناسبة.',
        bodyHtml:
          p('تبدأ معظم استفسارات تأجير الرافعات في دبي بالوزن، لكن الرافعة المناسبة تعتمد أيضًا على نصف القطر والارتفاع والأرض التي ستقف عليها.') +
          '<h2>ابدأ بنصف القطر</h2>' +
          p('ترفع الرافعة 50 طنًا أقل بكثير من 50 طنًا على مسافة 20 مترًا، فاطلب جدول الأحمال عند نصف قطر العمل.') +
          '<h2>افحص التربة</h2>' +
          p('أحمال الأرجل الداعمة على الأراضي المستصلحة أو الردم الحديث تحتاج إلى ألواح أو مسح للتربة، ونتحقق من ذلك في كل خطة رفع.'),
      },
    },
    seo: {
      en: { title: 'Crane Rental Dubai: How to Choose the Right Crane', description: 'A practical guide to crane rental in Dubai: load charts, working radius, ground conditions and lift plans explained by our lifting engineers.', focusKeyword: 'crane rental Dubai' },
      ar: { title: 'تأجير رافعات في دبي: كيف تختار الرافعة المناسبة', description: 'دليل عملي لتأجير الرافعات في دبي: جداول الأحمال ونصف قطر العمل وحالة التربة وخطط الرفع.', focusKeyword: 'تأجير رافعات دبي' },
    },
  },
  {
    slug: 'forklift-rental-checklist',
    tags: ['forklifts'],
    daysAgo: 21,
    content: {
      en: {
        title: 'Forklift rental checklist for UAE warehouses',
        excerpt: 'Diesel or electric, mast height, tyres and operator certificates: what to confirm before you hire.',
        bodyHtml:
          p('Forklift rental in the UAE is quick to arrange, but the wrong truck slows a warehouse down. Confirm these points before you book.') +
          '<h2>Diesel or electric</h2>' +
          p('Electric forklifts suit indoor warehouses; diesel suits yards and building sites with rough ground.') +
          '<h2>Mast and load centre</h2>' +
          p('Check the top racking level and the load centre of your heaviest pallet against the rated capacity.'),
      },
      ar: {
        title: 'قائمة التحقق لتأجير الرافعات الشوكية في مستودعات الإمارات',
        excerpt: 'ديزل أم كهرباء، ارتفاع الصاري، الإطارات وشهادات المشغلين: ما يجب التأكد منه قبل الاستئجار.',
        bodyHtml:
          p('تأجير الرافعات الشوكية في الإمارات سريع، لكن الاختيار الخاطئ يبطئ المستودع. تأكد من هذه النقاط قبل الحجز.') +
          '<h2>ديزل أم كهرباء</h2>' +
          p('تناسب الرافعات الكهربائية المستودعات الداخلية، ويناسب الديزل الساحات ومواقع البناء ذات الأرض الوعرة.') +
          '<h2>الصاري ومركز الحمولة</h2>' +
          p('قارن أعلى مستوى للرفوف ومركز حمولة أثقل منصة لديك مع الحمولة المقررة.'),
      },
    },
    seo: {
      en: { title: 'Forklift Rental UAE: Checklist Before You Hire', description: 'Forklift rental in the UAE made simple: diesel vs electric, mast height, load centre and operator certificates to confirm before booking.', focusKeyword: 'forklift rental UAE' },
      ar: { title: 'تأجير رافعات شوكية في الإمارات: قائمة تحقق قبل الاستئجار', description: 'تأجير الرافعات الشوكية في الإمارات: ديزل أم كهرباء، ارتفاع الصاري، مركز الحمولة وشهادات المشغلين.', focusKeyword: 'تأجير رافعات شوكية الإمارات' },
    },
  },
  {
    slug: 'moving-oversized-cargo-between-emirates',
    tags: ['logistics', 'heavy-transport'],
    daysAgo: 40,
    content: {
      en: {
        title: 'Moving oversized cargo between emirates',
        excerpt: 'Permits, escorts and lowbed trailers: how heavy transport works across the UAE.',
        bodyHtml:
          p('Heavy equipment rental in Abu Dhabi often ends with a lowbed move to another emirate. Here is how we plan it.') +
          '<h2>Permits</h2>' +
          p('Each emirate issues its own permit for loads over the legal width, height or weight, so allow time for approval.') +
          '<h2>Escorts and timing</h2>' +
          p('Wide loads usually travel at night with escort vehicles, avoiding peak traffic on the main highways.'),
      },
      ar: {
        title: 'نقل البضائع ذات الأبعاد الكبيرة بين الإمارات',
        excerpt: 'التصاريح والمرافقة والمقطورات المنخفضة: كيف يعمل النقل الثقيل في الإمارات.',
        bodyHtml:
          p('ينتهي تأجير المعدات الثقيلة في أبوظبي غالبًا بنقل على شاحنة منخفضة إلى إمارة أخرى. إليك كيف نخطط لذلك.') +
          '<h2>التصاريح</h2>' +
          p('تصدر كل إمارة تصريحها الخاص للأحمال التي تتجاوز العرض أو الارتفاع أو الوزن القانوني، لذا خصص وقتًا للموافقة.') +
          '<h2>المرافقة والتوقيت</h2>' +
          p('تتحرك الأحمال العريضة عادة ليلًا مع مركبات مرافقة لتجنب الازدحام على الطرق الرئيسية.'),
      },
    },
    seo: {
      en: { title: 'Heavy Equipment Rental Abu Dhabi & Oversized Transport', description: 'How heavy equipment rental in Abu Dhabi connects to lowbed transport across the UAE: permits, escorts and night moves explained.', focusKeyword: 'heavy equipment rental Abu Dhabi' },
      ar: { title: 'تأجير المعدات الثقيلة في أبوظبي والنقل الاستثنائي', description: 'كيف يرتبط تأجير المعدات الثقيلة في أبوظبي بالنقل على الشاحنات المنخفضة: التصاريح والمرافقة والنقل الليلي.', focusKeyword: 'تأجير معدات ثقيلة أبوظبي' },
    },
  },
];
