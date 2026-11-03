// In-depth content for each page under /industries, keyed by the slug in lib/industries.ts. Sections start with a
// direct answer, so they work for readers and for search and AI answers. Rules are pointers, not legal advice.
// `projects` lists only real, published portfolio slugs relevant to the industry; leave it empty rather than stretch.

export type IndustryGuide = {
  answer: string;
  howBuyersDecide: string;
  mustHaves: [string, string][];
  problems: [string, string][];
  rules: string[];
  services: string[];
  projects: string[];
  faqs: [string, string][];
};

export const INDUSTRY_GUIDES: Record<string, IndustryGuide> = {
  "ecommerce-retail": {
    answer: "A good e-commerce website makes buying quick on a phone. It needs fast product pages, clear prices and delivery costs, trusted payment options such as UPI, and an easy way to ask questions. Most stores are best on Shopify, while unusual catalogues may need a custom build.",
    howBuyersDecide: "Online shoppers compare quickly and can't touch the product. They look at photos, price, delivery date, return policy and reviews, and they'll often leave when something is unclear. Many also check a store's social media or contact details first to confirm it's real.",
    mustHaves: [
      ["Fast, phone-first product pages", "Several clear photos, sizes, stock status and delivery estimate, without long loading."],
      ["Useful search and filters", "Let customers narrow by size, price, colour or use."],
      ["Simple checkout", "Guest checkout, UPI, cards, and cash on delivery if it suits your margins."],
      ["Clear policies", "Shipping, returns and refunds linked from product pages and the checkout."],
      ["WhatsApp support", "Many Indian buyers want a quick answer before they pay."],
      ["Order notifications", "Confirmation and tracking messages reduce support queries."],
    ],
    problems: [
      ["High cart abandonment", "Show delivery costs early, shorten checkout and offer preferred payment options."],
      ["Reliance on marketplaces", "Your own store lets you keep customer relationships and build repeat sales."],
      ["Slow stores from too many apps", "Audit apps and scripts, and remove what doesn't earn its place."],
    ],
    rules: ["India's Consumer Protection (E-Commerce) Rules, 2020 expect details such as seller information, return policy and a grievance contact.", "GST invoices are needed for taxable sales.", "The Digital Personal Data Protection Act, 2023 affects how you handle customer data."],
    services: ["ecommerce-shopify", "seo-performance-optimisation", "website-maintenance-support"],
    projects: ["slicedot-e-commerce-platform", "fresh-meal-food-store"],
    faqs: [
      ["Should I sell on my own website or on Amazon and Flipkart?", "Often both. Marketplaces bring ready demand but charge commission and own the customer relationship. Your own store costs more effort to promote but builds your brand and margins."],
      ["How much does an online store cost?", "A straightforward store is usually within ₹20,000–₹60,000. Larger catalogues and custom platforms start at ₹60,000. Platform and payment fees are separate."],
      ["What makes customers trust a new online store?", "Clear contact details, real photos, honest reviews, visible return policies and familiar payment options."],
    ],
  },

  "saas-startups": {
    answer: "A SaaS or startup website has to explain quickly what the product does and get visitors to try it. It needs a clear headline, product screenshots or a demo, simple pricing and an easy sign-up. Early on, launching fast and learning from users matters more than a large site.",
    howBuyersDecide: "Software buyers want to know whether this solves their problem, whether it's worth the price, and whether they can trust it. They look for screenshots, pricing, comparisons, security details and documentation, and many want to try it before they speak to anyone.",
    mustHaves: [
      ["A clear product message", "Say what it does and who it's for above the fold."],
      ["Real product visuals", "Screenshots or a short demo build more trust than abstract graphics."],
      ["Simple pricing page", "Clear plans and answers to common questions."],
      ["Sign-up or demo flow", "Keep the first step short."],
      ["Comparison and use-case pages", "These match how buyers research and are useful for search."],
      ["Docs and changelog", "They show the product is real and actively maintained."],
    ],
    problems: [
      ["Clever copy that hides the product", "Plain words beat slogans when visitors have only seconds."],
      ["Building too much before launch", "Ship a focused first version and improve it from real usage."],
      ["Separate tools that don't connect", "Connect sign-ups, billing and analytics so you can see what works."],
    ],
    rules: ["If you have users in the EU, GDPR may apply. In India, check the Digital Personal Data Protection Act, 2023.", "Publish clear terms, a privacy policy and honest security claims.", "Don't claim certifications such as SOC 2 unless you actually hold them."],
    services: ["web-application-development", "ui-ux-design", "landing-page-design", "api-backend-development"],
    projects: [],
    faqs: [
      ["Do I need a full website before launching?", "Usually not. A focused landing page and waitlist can test demand first."],
      ["Which tech stack should a startup use?", "Choose common, well-supported tools. We usually use Next.js, React, TypeScript and PostgreSQL, because it's easy to hire for and scales well for most products."],
      ["How long does an MVP take?", "A focused first version usually takes 3–8 weeks, depending on its scope."],
    ],
  },

  "manufacturing-industrial": {
    answer: "A manufacturing website should work like a technical salesperson. It needs a well-organised product catalogue, downloadable specifications and datasheets, industry or application pages, and a quick way to request a quote. Buyers are looking for proof that you can meet their specification.",
    howBuyersDecide: "Industrial buying usually involves several people, such as engineers, purchase teams and owners. Engineers check specifications, materials and tolerances. Purchase teams check capacity, certificates, delivery and pricing. Many search by exact product terms, and often want a PDF they can forward internally.",
    mustHaves: [
      ["Structured product catalogue", "Categories, specifications and applications for each product."],
      ["Datasheets and brochures", "Easy-to-download files that buyers can forward to their team."],
      ["Request-a-quote form", "Lets buyers attach a drawing and state quantity and specification."],
      ["Industry and application pages", "Show how your products suit specific sectors."],
      ["Proof of capability", "Real factory photos, processes, quality checks and genuine certificates."],
      ["Enquiry tracking", "A simple admin view, so that no lead gets lost."],
    ],
    problems: [
      ["Dependence on IndiaMART and directories", "Your own product pages can rank for exact product searches and bring direct enquiries."],
      ["Products buried in one PDF", "A separate page for each product is easier to find and to share."],
      ["Enquiries lost in email", "Store them in one place, with their status and owner."],
    ],
    rules: ["Show certifications such as ISO or BIS only if they are current and held by you.", "Keep claims about performance or life testable and specific.", "Exporters should make sure product details and any HS codes shown are accurate."],
    services: ["custom-website-development", "web-application-development", "document-pdf-solutions", "seo-performance-optimisation"],
    projects: ["maxvolt-heaters", "subhot-industrial-heater", "hamza-food-cart"],
    faqs: [
      ["Can a manufacturer really get leads from a website?", "Yes, because industrial buyers search for specific products and applications. It works best with detailed product pages and a simple enquiry process. Results depend on your market and on effort over time."],
      ["Can we manage products ourselves?", "Yes. We can build an admin panel where your team adds products, specifications and datasheets."],
      ["Should we publish prices?", "Often not for custom or made-to-order products. Offer a fast quote process instead, and publish what's useful, such as specifications and minimum order sizes."],
    ],
  },

  "healthcare-wellness": {
    answer: "A healthcare website must help patients trust a practitioner and take action easily. It needs clear information about doctors and treatments, simple appointment booking, click-to-call, location details, and easy-to-read pages. Accuracy and privacy matter more than visual effects.",
    howBuyersDecide: "Patients are often worried, in a hurry and on a phone. They check the doctor's qualifications and experience, the treatments offered, timings, location and reviews. Many also search for a symptom or treatment, so plain-language medical content written or reviewed by a qualified person can help.",
    mustHaves: [
      ["Doctor profiles", "Qualifications, registration details, experience and specialities."],
      ["Treatment pages", "Plain explanations of what to expect, reviewed by a qualified professional."],
      ["Easy booking", "Call, WhatsApp or a short form, reachable from every page."],
      ["Local details", "Address, map, timings and a matching Google Business Profile."],
      ["Accessible design", "Readable text, good contrast and simple navigation for all ages."],
      ["Privacy by design", "Collect as little data as possible, and protect it."],
    ],
    problems: [
      ["Patients can't quickly find how to book", "Keep booking and phone buttons always visible on mobile."],
      ["Generic content copied from elsewhere", "Original, expert-reviewed content is more useful and more trustworthy."],
      ["Slow sites on patients' phones", "Compress images and remove unnecessary effects."],
    ],
    rules: ["In India, medical ethics rules and the Drugs and Magic Remedies Act limit advertising claims. Avoid guaranteed cures.", "Google treats health content as 'Your Money or Your Life', with higher expectations of accuracy.", "Patient data is sensitive. The Digital Personal Data Protection Act, 2023 applies to personal data. Check specifics with your adviser."],
    services: ["custom-website-development", "wordpress-development", "seo-performance-optimisation", "website-maintenance-support"],
    projects: ["dr-subhash-gupta"],
    faqs: [
      ["Can patients book appointments on the website?", "Yes. It can be a simple request form, WhatsApp, or a full booking system with available slots."],
      ["Does a clinic need local SEO?", "Yes. Patients usually search nearby, so accurate location pages and a complete Google Business Profile are important."],
      ["Who should write medical content?", "It should be written or reviewed by a qualified professional, with their name and credentials shown."],
    ],
  },

  "real-estate-property": {
    answer: "A real estate website should turn property interest into qualified enquiries. It needs strong visuals, clear project details, floor plans, location information, RERA numbers and easy contact through a call, WhatsApp or a short form. Most buyers browse on a phone.",
    howBuyersDecide: "Property is a major, slow decision, often involving a family. Buyers compare location, price, layout, developer reputation and legal approvals. They revisit many times, share links with relatives, and want to verify information before they visit a site.",
    mustHaves: [
      ["Project or listing pages", "Price range, sizes, floor plans, amenities and status."],
      ["Location details", "Map, connectivity and nearby landmarks."],
      ["Fast image and video galleries", "Optimised for phones, as these are often the heaviest parts of the site."],
      ["WhatsApp and call actions", "Always one tap away, with the project name pre-filled."],
      ["Brochure download", "A shareable PDF for family decisions."],
      ["Campaign landing pages", "One page per project for ads, with lead tracking."],
    ],
    problems: [
      ["Beautiful but very slow websites", "Compress media and load it only when it's needed."],
      ["Low-quality leads", "A short qualifying question, such as budget or timeline, can help your sales team."],
      ["Outdated listings", "An admin panel makes it easy to keep availability and prices current."],
    ],
    rules: ["RERA requires projects in its scope to show a registration number in advertising. Include it, and the regulator's website, where applicable.", "Show photos and renders honestly, and label artist's impressions.", "Prices, sizes and possession dates must match approved documents."],
    services: ["custom-website-development", "landing-page-design", "seo-performance-optimisation"],
    projects: ["murec-redesign"],
    faqs: [
      ["Do I need a website if I already advertise on property portals?", "Portals bring traffic but also show competitors. Your own site builds credibility and gives your ads a focused destination."],
      ["Can we update listings ourselves?", "Yes. An admin panel lets your team add projects, images and availability."],
      ["Should every project have its own page?", "Yes. It helps search visibility, makes ad tracking easier and gives buyers a simple link to share."],
    ],
  },

  "education-elearning": {
    answer: "An education website must help students and parents find the right course and apply easily. It needs clear course details, fees, eligibility, faculty, results presented honestly, and a simple enquiry or admission form. E-learning platforms also need reliable video, progress tracking and payments.",
    howBuyersDecide: "Often there are two audiences: students, who want course and career information, and parents, who check credibility, safety, fees and recognition. Both compare several institutes, and many decisions peak at admission time, so being easy to find and fast to reply to matters.",
    mustHaves: [
      ["Course pages", "Syllabus, duration, fees, eligibility and outcomes."],
      ["Admission enquiry", "A short form plus WhatsApp, with fast follow-up."],
      ["Faculty and facilities", "Real names, qualifications and photos."],
      ["Notices and events", "Easy for staff to update themselves."],
      ["Student login or LMS", "Videos, tests and progress, if you teach online."],
      ["Local SEO", "For schools and coaching centres that serve a specific area."],
    ],
    problems: [
      ["Fees and course details are hard to find", "Put the details parents look for up front."],
      ["Outdated notices", "Give staff an easy editing tool."],
      ["Low course completion", "Short lessons, clear progress and working mobile video all help."],
    ],
    rules: ["Claims about results, rankings and placements should be verifiable. ASCI has guidelines for education advertising.", "State recognition and affiliation accurately.", "Be careful with children's data. India's data protection law sets stricter rules for minors."],
    services: ["wordpress-development", "web-application-development", "custom-website-development"],
    projects: [],
    faqs: [
      ["Should we use WordPress or a custom LMS?", "WordPress with an LMS plugin suits many institutes. A custom platform makes sense for unusual workflows or larger scale."],
      ["Can students pay fees online?", "Yes. We can integrate an Indian payment gateway with receipts."],
      ["Can staff update notices themselves?", "Yes. We set up simple editing and train your staff."],
    ],
  },

  "finance-fintech": {
    answer: "A finance website must earn trust before anything else. It needs clear explanations of the product, visible registration details, transparent fees, strong security and a simple way to contact a real person. Fintech dashboards must also present numbers clearly and protect every action.",
    howBuyersDecide: "People are careful with money. They look for regulator registrations, company details, fees, security and reviews. Google also treats financial content as 'Your Money or Your Life', so accuracy and clearly identified authors matter for both customers and search.",
    mustHaves: [
      ["Registration and company details", "Regulator numbers and legal entity name in clear view."],
      ["Transparent fees", "Plain explanations, including examples."],
      ["Calculators", "Useful tools, such as EMI or returns calculators, with clear assumptions."],
      ["Secure accounts", "Strong login, access control and activity logs."],
      ["Clear dashboards", "Numbers that are easy to understand and verify."],
      ["Credible content", "Named, qualified authors, with dates and sources."],
    ],
    problems: [
      ["Complex wording", "Explain products in plain language and give examples."],
      ["Visitors are unsure if it's legitimate", "Show registrations, address and real contact details."],
      ["Slow or unreliable dashboards", "Good caching, database design and monitoring help."],
    ],
    rules: ["SEBI-registered intermediaries must show registration details. Avoid promises of guaranteed returns.", "RBI's digital lending rules require disclosure of the regulated lender and its terms.", "Financial data needs strong security. Have regulated work reviewed by your compliance adviser."],
    services: ["web-application-development", "ui-ux-design", "api-backend-development", "custom-website-development"],
    projects: [],
    faqs: [
      ["Is a fintech product built differently from a normal website?", "Yes. It needs stricter access control, audit logs, testing and data protection from the start."],
      ["Can you add calculators to our website?", "Yes. Calculators are useful for visitors and can bring in search traffic. We make their assumptions clear."],
      ["Do you provide compliance advice?", "No. We build what your compliance adviser specifies, and we'll flag issues we notice."],
    ],
  },

  "hospitality-food": {
    answer: "A hotel or restaurant website should answer three questions fast: what do you offer, how much is it, and how do I book or order? It needs a readable menu or room list, real photos, location, opening hours and direct booking or WhatsApp ordering, all working well on a phone.",
    howBuyersDecide: "Guests decide quickly, often while travelling or hungry. They check photos, price, reviews, location and availability. Many find you on Google Maps first, then visit your website or call. Direct booking can save on commission, so it should be easy.",
    mustHaves: [
      ["Readable menu or room list", "A proper web page, not just a large PDF or image."],
      ["Direct booking or ordering", "Booking engine, table reservation or WhatsApp ordering."],
      ["Real photos", "Honest, well-lit images of food, rooms and spaces."],
      ["Location and hours", "Map, directions and current timings."],
      ["Google Business Profile match", "Consistent name, address and phone everywhere."],
      ["Offers and events", "Easy for staff to update."],
    ],
    problems: [
      ["Paying high commission to aggregators", "A direct option and simple offers can move some repeat customers to you."],
      ["Menus as heavy PDFs or images", "Web menus are faster, searchable and easier to update."],
      ["Outdated timings and prices", "An easy admin panel keeps them current."],
    ],
    rules: ["Food businesses in India need FSSAI registration or a licence, and generally must show the number.", "Show prices clearly, including how taxes and service charges are applied.", "Label vegetarian and non-vegetarian food properly, and list allergens where you can."],
    services: ["custom-website-development", "landing-page-design", "seo-performance-optimisation"],
    projects: ["hotel-the-grand", "fresh-meal-food-store"],
    faqs: [
      ["Do I need a website if I'm on Zomato or MakeMyTrip?", "They bring discovery, but a website gives you direct bookings, your own customer relationships and more control over your brand."],
      ["Can customers order through WhatsApp?", "Yes. A simple menu can send the order to your WhatsApp, without any app."],
      ["Can I update the menu myself?", "Yes. We can set up an admin panel, so prices and dishes are easy to change."],
    ],
  },

  "nonprofits-ngos": {
    answer: "An NGO website has to build trust and make giving easy. It needs a clear mission, proof of work, transparent reports, registration details, an easy donation process and automatic receipts. Volunteers and partners should also find a simple way to get involved.",
    howBuyersDecide: "Donors want to know the organisation is genuine and that their money is well used. They look for registrations, photos of real work, reports and named people. Corporate CSR teams go further and check documents and past work before committing.",
    mustHaves: [
      ["Clear mission and programmes", "What you do, where you do it and who benefits."],
      ["Simple online donation", "UPI and card payments, with fewer steps."],
      ["Automatic receipts", "Including 80G details where applicable."],
      ["Reports and registrations", "Annual reports, financials and certificates that are easy to find."],
      ["Stories from the field", "Real stories, with consent from those shown."],
      ["Volunteer and CSR pages", "Dedicated ways for each group to get in touch."],
    ],
    problems: [
      ["Donation forms that are too long", "Ask only for what's necessary for the receipt."],
      ["Reports hidden or missing", "Put them where donors and CSR teams look."],
      ["Campaign pages that take too long to make", "Reusable templates let your team launch quickly."],
    ],
    rules: ["Show 12A and 80G status only if currently valid. Receipts must carry the required details.", "FCRA registration rules apply to foreign contributions. Only accept them where permitted.", "Get consent before publishing photos or stories, especially of children."],
    services: ["custom-website-development", "wordpress-development", "landing-page-design"],
    projects: [],
    faqs: [
      ["Can donors get an 80G receipt automatically?", "Yes. We can generate and email receipts after payment, using the format approved by your accountant."],
      ["Can we run campaign pages?", "Yes. We can build templates so your team can create new campaigns without coding."],
      ["Which payment gateway should we use?", "It depends on your registration and on whether you accept foreign donations. We'll help compare suitable Indian gateways."],
    ],
  },
};
