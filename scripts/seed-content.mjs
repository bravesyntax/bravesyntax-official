// Fills service pages and location content. Only empty fields are written, so edits made in the admin are never
// overwritten. Run once inside web/ after the migration: node scripts/seed-content.mjs
// Everything here describes the service or public facts about a city. It never claims clients or results.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const sql = neon(process.env.DATABASE_URL);

const SERVICES = {
  "UI/UX Design": {
    slug: "ui-ux-design",
    tagline: "Interfaces people understand the first time they use them.",
    overview: "Good UI/UX starts before anything is drawn. We map who is using the product, what they came to do and where they currently get stuck, then turn that into wireframes and a clickable Figma prototype you can test with real people.\n\nBy the time development starts, every screen, state and edge case is already decided. That means fewer changes mid-build, and a handoff your developers can follow without guessing.",
    includes: ["User flows and information architecture", "Wireframes for every key screen", "High-fidelity designs in Figma", "Clickable prototype for testing", "Component library and style guide", "Developer handoff with specs and assets"],
    bestFor: ["New products that need a clear structure before code", "Existing apps with drop-offs or support complaints", "Teams with developers but no in-house designer"],
    timeline: "1–3 weeks, depending on the number of screens",
    faq: [
      ["Do I need UI/UX design if I already have a developer?", "Usually yes. Developers build what is specified, and design is where those decisions get made. A prototype is much cheaper to change than finished code."],
      ["What do I receive at the end?", "The complete Figma file, the prototype link, the component library and exported assets. You own all of it."],
      ["Can you redesign just part of an existing product?", "Yes. We can start with the flow causing the most trouble, such as sign-up or checkout, and work outward from there."],
    ],
  },
  "Custom Website Development": {
    slug: "custom-website-development",
    tagline: "Hand-built websites that load fast and are easy to keep updated.",
    overview: "A custom website is built around your content and how your customers actually buy, rather than around the limits of a theme. We write the code ourselves using modern frameworks, so the site stays fast and doesn't carry features you never use.\n\nWhen it's useful, we add a simple admin panel so you can change text, photos and pages yourself. Search basics such as page titles, structured data and a sitemap are part of the build, not an extra.",
    includes: ["Custom design for your brand", "Mobile-first, responsive layouts", "Admin panel for editing content", "Contact forms and email alerts", "On-page SEO and structured data", "Deployment, training and documentation"],
    bestFor: ["Businesses that have outgrown a template site", "Companies whose site needs custom features", "Brands that want full ownership of their code"],
    timeline: "1–3 weeks for most business websites",
    faq: [
      ["Will I be able to update the website myself?", "Yes. If you expect to change content regularly we include an admin panel and show you how to use it."],
      ["Do I own the code?", "Yes. You receive the full source code and accounts in your own name, with no lock-in."],
      ["Which technology do you use?", "Usually Next.js and React with a Postgres database. We pick based on the project and explain why before starting."],
    ],
  },
  "Web Application Development": {
    slug: "web-application-development",
    tagline: "Dashboards, portals and internal tools built around how you work.",
    overview: "If your team is running the business on spreadsheets and WhatsApp messages, a web application can replace that with one reliable system. We scope the smallest version that solves the real problem, build it, and grow it from there.\n\nThat covers the full stack: database design, user accounts and permissions, APIs, integrations and the interface on top. Security and backups are planned from the first day rather than added at the end.",
    includes: ["Requirements workshop and written scope", "Database design", "User roles, login and permissions", "Admin dashboards and reports", "Third-party and payment integrations", "Staging environment, testing and deployment"],
    bestFor: ["Teams replacing spreadsheets with a real system", "Founders building a first SaaS version", "Companies needing a customer or vendor portal"],
    timeline: "3–8 weeks for a first version",
    faq: [
      ["How do you price a web app?", "We write the scope first, then give a fixed price for it. If new requirements appear, we quote them separately before doing the work."],
      ["Can you take over an app someone else built?", "Often, yes. We review the code first and tell you honestly whether to continue with it or rebuild parts of it."],
      ["Will it work on phones?", "Yes. Web apps we build are responsive and work in any modern browser, so nothing has to be installed."],
    ],
  },
  "E-Commerce & Shopify": {
    slug: "ecommerce-shopify",
    tagline: "Online stores built to make buying simple, especially on a phone.",
    overview: "Most online shoppers in India are on a phone, and they leave at the first slow page or confusing step. We design stores around that: quick product pages, clear pricing and a short checkout with the payment options your customers expect.\n\nWe recommend Shopify when you want to manage everything yourself with little upkeep, WooCommerce when you already run on WordPress, and a custom build when your catalogue or pricing doesn't fit either one.",
    includes: ["Store design or theme customisation", "Product, collection and variant setup", "Razorpay, UPI and COD setup", "Shipping and tax configuration", "Product page SEO and structured data", "Order management training"],
    bestFor: ["Brands starting to sell online", "Sellers moving away from marketplaces only", "Stores with a slow or dated checkout"],
    timeline: "2–6 weeks, depending on catalogue size",
    faq: [
      ["Shopify, WooCommerce or custom?", "It depends on your catalogue, your budget and who will run the store. We recommend one after understanding your business, and we explain the running costs of each."],
      ["Can you move my existing store?", "Yes. Products, customers and order history can usually be migrated, and we set up redirects so old links keep working."],
      ["Who adds the products?", "Either. We can upload your catalogue from a spreadsheet, or set it up and train your team to do it."],
    ],
  },
  "WordPress Development": {
    slug: "wordpress-development",
    tagline: "WordPress that stays fast, secure and pleasant to edit.",
    overview: "WordPress is a good choice when your team wants to publish often without asking a developer. The trouble usually comes from heavy page builders and piles of plugins, which slow the site down and open security holes.\n\nWe build lightweight custom themes with only the plugins you actually need, and we set up editing screens so your team can't accidentally break the layout. We can also speed up and clean up a WordPress site you already have.",
    includes: ["Custom theme, no page builder bloat", "Editable fields with ACF", "Plugin audit and clean-up", "Speed and Core Web Vitals work", "Security hardening and backups", "Editor training for your team"],
    bestFor: ["Teams publishing content regularly", "Sites slowed down by page builders", "Businesses already invested in WordPress"],
    timeline: "1–3 weeks",
    faq: [
      ["Can you fix my slow WordPress site?", "Usually yes. We audit the theme, plugins, images and hosting, then tell you what is causing the slowdown before changing anything."],
      ["Should I use WordPress or a custom site?", "WordPress suits content-heavy sites edited by non-technical teams. A custom site suits sites with special features or strict speed needs."],
      ["Do you maintain WordPress sites?", "Yes. Updates, backups and monitoring are available on a monthly plan."],
    ],
  },
  "Landing Page Design": {
    slug: "landing-page-design",
    tagline: "One page, one goal, and nothing in the way of it.",
    overview: "A landing page has one job: get the visitor to take a single action, whether that's an enquiry, a demo booking or a purchase. We write the structure around that action, and we match the message to the ad or campaign that brought the visitor in.\n\nPages are built to load quickly on mobile data, because paid clicks are wasted when a page is slow. Analytics and conversion tracking are set up so you can see what is working.",
    includes: ["Page structure and copy guidance", "Custom design matched to your campaign", "Fast, mobile-first build", "Lead form connected to email or CRM", "Analytics and conversion tracking", "Variants for A/B testing on request"],
    bestFor: ["Google and Meta ad campaigns", "Product or course launches", "Testing a new offer before building a full site"],
    timeline: "3–5 days",
    faq: [
      ["Can you write the copy too?", "We can structure it and draft it from your brief. You know your customers best, so we review it together."],
      ["Do you run the ads?", "We build the page and set up tracking. Ad management can be handled by your existing team or partner."],
      ["Can it use my own domain?", "Yes, on your main domain or a subdomain such as offer.yourcompany.com."],
    ],
  },
  "Brand Identity & Logo Design": {
    slug: "brand-identity-logo-design",
    tagline: "A logo and visual system that stays recognisable everywhere it appears.",
    overview: "A brand identity is more than a logo. It is the set of decisions that makes your business look like itself on a website, a visiting card, a WhatsApp profile and a shop sign. We start with who you serve and how you want to be seen, then explore a few distinct directions.\n\nYou receive the final logo in every format you will need, along with the colours, fonts and simple rules that keep your materials consistent as you grow.",
    includes: ["Discovery questionnaire and direction", "Logo concepts and refinement", "Colour palette and typography", "Logo files for print and digital", "Social media profile assets", "Brand guidelines PDF"],
    bestFor: ["New businesses launching properly", "Companies whose logo no longer fits them", "Teams needing consistent marketing material"],
    timeline: "1–2 weeks",
    faq: [
      ["How many logo options will I see?", "We present a small number of distinct directions and refine the one you choose, rather than dozens of small variations."],
      ["Who owns the final logo?", "You do. Full ownership transfers to you, with all source files included."],
      ["Can you refresh my existing logo?", "Yes. Often a refresh keeps the recognition you've built while fixing what no longer works."],
    ],
  },
  "Graphic Design & Print": {
    slug: "graphic-design-print",
    tagline: "Brochures, cards and decks that look as good as your business is.",
    overview: "Printed and shared material is often the first thing a customer holds or forwards. We design brochures, catalogues, visiting cards, banners and pitch decks that follow your brand and are easy to read.\n\nFiles are prepared properly for print, with correct bleed, colour mode and resolution, so what comes back from the printer matches what you approved. You also get web-ready versions for email and WhatsApp.",
    includes: ["Brochures and product catalogues", "Visiting cards and letterheads", "Banners, standees and flyers", "Pitch decks and presentations", "Print-ready files with bleed and CMYK", "Web-friendly versions for sharing"],
    bestFor: ["Exhibitions and trade fairs", "Sales teams needing better material", "Manufacturers with large product ranges"],
    timeline: "2–7 days per item",
    faq: [
      ["Do you handle printing too?", "We prepare the files and can coordinate with your printer. Printing itself is billed by the print vendor."],
      ["Can you work from my existing brand?", "Yes. We follow your existing logo and colours, or suggest a simple system if you don't have one yet."],
      ["Can I edit the files later?", "Yes. We share editable source files on request, so simple changes don't need a designer."],
    ],
  },
  "SEO & Performance Optimisation": {
    slug: "seo-performance-optimisation",
    tagline: "Fix what's stopping Google and your visitors from reaching you.",
    overview: "SEO work starts with an honest audit of what's blocking your site: technical errors, slow pages, thin or duplicate content, and pages that target nothing in particular. You get a prioritised list, in plain language, of what matters most.\n\nThen we fix it: speed and Core Web Vitals, structured data, titles and descriptions, internal links and a sensible page structure. Nobody can honestly promise a specific Google ranking, and we won't, but we can remove what's holding you back and report on what changes.",
    includes: ["Technical SEO audit", "Core Web Vitals and speed fixes", "Titles, descriptions and headings", "Structured data and sitemaps", "Keyword and content recommendations", "Search Console setup and reporting"],
    bestFor: ["Sites getting little search traffic", "Slow sites losing mobile visitors", "Businesses after a redesign or migration"],
    timeline: "1–2 weeks for the audit and first fixes",
    faq: [
      ["Can you guarantee first-page rankings?", "No, and be careful of anyone who does. Rankings depend on Google and your competitors. We guarantee the work itself and report what changes."],
      ["How long until I see results?", "Technical fixes can show up within weeks. Content and ranking improvements usually take a few months."],
      ["Do you build backlinks?", "We focus on your site and content first, and we avoid paid link schemes that can get a site penalised."],
    ],
  },
  "API & Backend Development": {
    slug: "api-backend-development",
    tagline: "Reliable behind-the-scenes systems that connect everything together.",
    overview: "When your website, app, payment gateway and accounting software don't talk to each other, your team ends up doing the work by hand. We build the APIs and integrations that connect them, so data moves without copy and paste.\n\nWe focus on the parts people only notice when they fail: authentication, input validation, rate limits, error logging and clear documentation that the next developer can actually use.",
    includes: ["REST API design and build", "Payment gateway integration", "Third-party and ERP integrations", "Authentication and permissions", "Logging and error monitoring", "Written API documentation"],
    bestFor: ["Apps that need a dependable backend", "Businesses connecting separate software", "Teams with a frontend but no backend developer"],
    timeline: "1–4 weeks per integration or API",
    faq: [
      ["Can you integrate with my existing software?", "If it has an API or a documented export, usually yes. We check its documentation before quoting."],
      ["Which payment gateways do you work with?", "Razorpay and Stripe most often, and others on request, provided they offer developer documentation."],
      ["Will my own developers be able to take over?", "Yes. You get the source code and documentation, written so another developer can continue the work."],
    ],
  },
  "Mobile App Design": {
    slug: "mobile-app-design",
    tagline: "Clear, native-feeling app designs ready for your developers.",
    overview: "On a small screen there is no room for confusion. We design iOS and Android interfaces that follow each platform's conventions and keep the most common actions within thumb's reach.\n\nThe result is a complete Figma file and a tappable prototype, covering every screen and state, including empty, loading and error screens. You can hand it to your app developers, test it with users, or use it to raise funding. This service covers design; we don't currently publish native apps ourselves.",
    includes: ["User flows and screen map", "iOS and Android interface design", "Tappable Figma prototype", "Empty, loading and error states", "Design system and components", "App store screenshots and icon"],
    bestFor: ["Founders planning a new app", "Apps with poor reviews or retention", "Development teams needing clear designs"],
    timeline: "2–4 weeks",
    faq: [
      ["Do you develop the app as well?", "We design the app and hand it to your developers. For many businesses a web app is a good first step, and we can build that."],
      ["Do I need separate designs for iOS and Android?", "Usually one design adapted to each platform's conventions. We'll advise based on your audience."],
      ["Can I test the design before building?", "Yes. The prototype runs on a phone, so you can put it in front of real users before spending on development."],
    ],
  },
  "Social Media Design": {
    slug: "social-media-design",
    tagline: "Consistent, recognisable posts without designing from scratch each week.",
    overview: "Posting regularly is hard when every post starts from a blank page. We create a set of branded templates for your common posts, such as offers, products, tips and festival wishes, so your feed looks consistent and your team can publish quickly.\n\nTemplates are made in Canva or Figma, whichever your team prefers, and sized for Instagram, Facebook, LinkedIn and WhatsApp. We can also design monthly batches of posts if you'd rather hand it off.",
    includes: ["Social media visual style", "Post, carousel and story templates", "Profile picture and cover images", "Highlight covers", "Editable Canva or Figma files", "Monthly post designs on request"],
    bestFor: ["Businesses posting inconsistently", "Teams without a full-time designer", "Brands launching a new look"],
    timeline: "3–7 days for a template set",
    faq: [
      ["Will I be able to edit the templates?", "Yes. That's the point. Your team changes the text and images and posts in minutes."],
      ["Do you manage the accounts and posting?", "We focus on design. Posting and community management stay with you or your marketing partner."],
      ["Do you write the captions?", "We can suggest captions with monthly batches, but your own voice usually works best."],
    ],
  },
  "Website Maintenance & Support": {
    slug: "website-maintenance-support",
    tagline: "Someone to keep your website updated, backed up and working.",
    overview: "A website needs looking after: software updates, backups, security patches and small content changes. When nobody is responsible for that, problems tend to surface at the worst moment, such as during a campaign.\n\nOn a monthly plan we handle the routine work and fix issues as they come up. You get a direct contact rather than a ticket queue, and a simple summary of what was done. Plans start at ₹5,000 per month, depending on the size of the site.",
    includes: ["Software and plugin updates", "Regular off-site backups", "Uptime monitoring", "Security patches", "Small content edits each month", "Monthly summary of work done"],
    bestFor: ["Businesses without a developer on staff", "Sites running an online store or ads", "Anyone whose developer has disappeared"],
    timeline: "Ongoing monthly plan",
    faq: [
      ["Do you maintain sites you didn't build?", "Yes. We review the site first, fix anything urgent, and then take it over."],
      ["What if something breaks?", "Contact us directly and we prioritise it. Most issues can be resolved from backups or a quick fix."],
      ["Is there a long contract?", "No. Plans are month to month, and everything stays in your accounts if you leave."],
    ],
  },
  "Document & PDF Solutions": {
    slug: "document-pdf-solutions",
    tagline: "Stop building quotes and invoices by hand.",
    overview: "If your team copies data into Word or Excel to produce quotes, invoices or certificates, that work can be automated. We build systems that generate correctly formatted PDFs from your data, with your branding, in seconds.\n\nThat can include approvals, e-signatures, secure storage and search, so documents stop living in scattered email threads. We have also built a free set of browser-based PDF tools, which you can try on this site.",
    includes: ["Branded PDF templates", "Automatic generation from your data", "Quote and invoice workflows", "E-signature integration", "Secure document storage", "Search and access controls"],
    bestFor: ["Sales teams producing quotes all day", "Businesses issuing certificates or reports", "Firms needing controlled document access"],
    timeline: "2–4 weeks",
    faq: [
      ["Can it use our existing templates?", "Yes. We recreate your current format, so your documents look the same but are produced automatically."],
      ["Can it connect to our software?", "If your software has an API or export, usually yes. We check this before quoting."],
      ["Are the documents secure?", "Files are stored privately with role-based access, and links aren't publicly guessable."],
    ],
  },
};

const CITIES = {
  delhi: {
    about: "Delhi runs on trade, government and professional services, from the wholesale markets of Chandni Chowk and Karol Bagh to the consultancies and head offices around Connaught Place and Nehru Place. With so many competitors a metro ride away, buyers here compare options quickly and often decide from their phones.",
    sectors: [["Wholesale and retail traders", "a clear product range and an easy way to send bulk enquiries"], ["Consultants, CAs and legal firms", "credibility, plain service pages and simple appointment requests"], ["Education and coaching institutes", "course details and admission enquiries that work well on mobile"]],
  },
  mumbai: {
    about: "Mumbai is India's financial and entertainment capital, with banks, brokers, media houses, shipping firms and D2C brands all competing for attention. Customers and investors here are used to polished digital experiences, so a dated site can cost you trust before a conversation even begins.",
    sectors: [["Financial and advisory firms", "compliance-minded pages that build trust before the first call"], ["Media and creative studios", "portfolio sites where the work loads fast and looks sharp"], ["D2C and lifestyle brands", "a quick mobile store with a short path to checkout"]],
  },
  bangalore: {
    about: "Bangalore is the centre of India's startup and software ecosystem, with product companies clustered around Koramangala, HSR Layout and Whitefield. Audiences here are technical and notice details, so slow pages and vague messaging stand out. Early-stage teams also tend to need something credible live quickly.",
    sectors: [["SaaS and product startups", "a landing site that explains the product and converts sign-ups"], ["Deep-tech and aerospace firms", "technical content that recruiters and partners can trust"], ["Funded early-stage teams", "a fast first version that can grow without being rebuilt"]],
  },
  hyderabad: {
    about: "Hyderabad combines a large IT corridor around HITEC City and Gachibowli with one of India's biggest pharmaceutical and life sciences clusters at Genome Valley. Many businesses here sell to global clients, so their websites need to read as credible and professional to buyers overseas as well as locally.",
    sectors: [["Pharma and life sciences companies", "structured product information and clear compliance details"], ["IT services firms", "case-led service pages aimed at international buyers"], ["Real estate developers", "project pages with plans, locations and enquiry capture"]],
  },
  chennai: {
    about: "Chennai has deep roots in automotive manufacturing along the Sriperumbudur and Oragadam belt, alongside a strong SaaS community and a major healthcare sector that draws patients from across India and abroad. Buyers here tend to research carefully, which rewards websites with detailed, well-organised information.",
    sectors: [["Auto component manufacturers", "searchable catalogues and RFQ forms for B2B buyers"], ["SaaS companies", "product marketing sites and documentation that scale"], ["Hospitals and specialty clinics", "doctor profiles and appointment requests patients can use easily"]],
  },
  kolkata: {
    about: "Kolkata is eastern India's main commercial centre, with long-established businesses in trade, tea, jute and engineering, plus a strong education and cultural scene. Many family firms here have decades of reputation offline but little to show for it online, which makes a first proper website especially valuable.",
    sectors: [["Established family businesses", "a website that reflects the reputation they've built offline"], ["Tea and commodity exporters", "product and origin pages written for buyers abroad"], ["Schools and colleges", "admissions information that's easy for parents to find"]],
  },
  pune: {
    about: "Pune blends a big automotive and manufacturing base around Chakan and Pimpri-Chinchwad with an IT sector in Hinjawadi and a large student population. That mix means one city holds both B2B engineering firms that need technical catalogues and young, mobile-first consumers who expect a smooth online experience.",
    sectors: [["Engineering and auto suppliers", "technical catalogues and enquiry forms for procurement teams"], ["IT and product companies", "hiring pages and product sites that attract talent"], ["Education institutes", "course and admission journeys built for students on phones"]],
  },
  ahmedabad: {
    about: "Ahmedabad is one of Gujarat's main business hubs, known for textiles, chemicals, pharmaceuticals and a strong entrepreneurial culture among family-run firms. Many of these companies export or sell B2B, so a website often works as a digital catalogue that has to reassure buyers they have never met.",
    sectors: [["Textile manufacturers and traders", "catalogues buyers can browse before asking for samples"], ["Chemical and pharma firms", "detailed product data and easy technical enquiries"], ["Family-run businesses going digital", "a straightforward site the team can actually keep updated"]],
  },
  jaipur: {
    about: "Jaipur's economy is closely tied to tourism, gems and jewellery, and handicrafts such as block-print textiles and blue pottery. Much of that trade reaches customers abroad, so visuals carry a lot of the weight online. Hotels and artisans alike benefit from selling directly rather than relying only on third-party platforms.",
    sectors: [["Hotels and heritage stays", "direct booking enquiries that reduce dependence on travel portals"], ["Jewellery and gemstone sellers", "high-quality product photography presented with trust signals"], ["Handicraft and textile exporters", "stores and catalogues that work for international buyers"]],
  },
  surat: {
    about: "Surat is globally known for diamond cutting and polishing and for its huge textile trade in synthetic fabrics and sarees. Business moves quickly here and much of it happens on WhatsApp, so websites work best when they make it fast to view a catalogue and start a conversation directly.",
    sectors: [["Textile and saree wholesalers", "catalogues that can be shared on WhatsApp in a tap"], ["Diamond and jewellery businesses", "secure, premium product presentation for trade buyers"], ["Manufacturers selling B2B", "bulk enquiry forms sent straight to the sales team"]],
  },
  ghaziabad: {
    about: "Ghaziabad, where Brave Syntax is based, is an industrial city in the Delhi NCR with manufacturers in Sahibabad and along Meerut Road, alongside growing residential areas such as Indirapuram and Raj Nagar Extension. Local manufacturers often sell across India, so a good website lets a small factory reach buyers far beyond the NCR.",
    sectors: [["Industrial manufacturers", "product catalogues and specification sheets for B2B buyers"], ["Real estate and builders", "project pages that turn site visits into enquiries"], ["Local schools and clinics", "simple, trustworthy information for families nearby"]],
  },
  noida: {
    about: "Noida is a planned hub for IT and IT-enabled services, electronics manufacturing and media companies, with offices spread across its sectors and along the Greater Noida Expressway. Many companies here serve clients across the country and abroad, so their websites need to work as a serious sales and recruitment tool.",
    sectors: [["IT and ITES companies", "service pages and careers sections that support sales and hiring"], ["Electronics manufacturers", "product documentation and dealer enquiry forms"], ["Media and edtech firms", "fast, content-heavy sites that handle lots of traffic"]],
  },
  lucknow: {
    about: "Lucknow is Uttar Pradesh's administrative capital and a growing centre for education and healthcare, and it remains famous for chikankari embroidery and its food. Many local businesses still rely on word of mouth, so even a simple, well-made website can set a business apart from nearby competitors.",
    sectors: [["Chikankari and apparel sellers", "online stores that reach customers beyond the city"], ["Hospitals and diagnostic centres", "services and timings patients can find easily"], ["Coaching and education institutes", "course details and enquiries from students on phones"]],
  },
  indore: {
    about: "Indore is Madhya Pradesh's commercial capital, with a strong trading community, a food processing industry known for its namkeen, pharmaceutical units at Pithampur and a growing number of startups and IT firms. Businesses here are increasingly looking beyond the state, which makes a credible online presence more important.",
    sectors: [["Food and namkeen brands", "online stores and distributor enquiry pages"], ["Pharma manufacturers", "product lists and compliance information for buyers"], ["Startups and IT firms", "product sites that look ready for national customers"]],
  },
  bhopal: {
    about: "Bhopal, the capital of Madhya Pradesh, has an economy shaped by government, education and healthcare, along with industrial activity at nearby Mandideep. Institutions make up a large part of its audience, so websites here often need to be clear, accessible and easy to navigate for people of all ages.",
    sectors: [["Colleges and training institutes", "admissions and course information that's easy to navigate"], ["Healthcare providers", "clear details on services, doctors and appointments"], ["Industrial suppliers near Mandideep", "product pages and quote requests for B2B buyers"]],
  },
  chandigarh: {
    about: "Chandigarh is a planned city and a services hub for Punjab and Haryana, with an IT park, strong education and healthcare sectors, and a well-known immigration consulting market. Competition among service businesses is intense, so clear positioning and trust signals often decide who gets the enquiry.",
    sectors: [["Immigration and education consultants", "honest service details and a clear way to book a consultation"], ["IT companies in the IT Park", "service and hiring pages for national clients"], ["Clinics and wellness brands", "appointment-friendly sites that build confidence"]],
  },
  nagpur: {
    about: "Nagpur sits close to the geographic centre of India, which makes it a natural logistics hub, with the MIHAN project and multimodal connectivity at its heart. The city is also known for its oranges and for mining and power activity in the wider region. Logistics and supply businesses here serve clients well beyond Vidarbha.",
    sectors: [["Logistics and warehousing firms", "service coverage pages and quick quote requests"], ["Orange and agri-produce businesses", "product and origin pages for wholesale buyers"], ["Industrial suppliers", "catalogues and enquiries for mining and power clients"]],
  },
  coimbatore: {
    about: "Coimbatore is often called the Manchester of South India for its textile mills, and it's also a major producer of pumps, motors and engineering goods. Many of its businesses are mid-sized manufacturers selling across India and overseas, for whom a website is a sales tool that works around the clock.",
    sectors: [["Textile mills and garment units", "capability pages and sample requests for bulk buyers"], ["Pump and motor manufacturers", "searchable specifications and dealer enquiries"], ["Engineering job shops", "machine capability pages and drawing upload forms"]],
  },
  kochi: {
    about: "Kochi is Kerala's commercial capital, built around its port and long spice trade, with a major tourism sector and a growing IT presence at Infopark and SmartCity. Many businesses here deal with overseas customers, from exporters to the Gulf-connected Malayali diaspora, so their websites must work for visitors far from Kerala.",
    sectors: [["Spice and seafood exporters", "product and certification pages for international buyers"], ["Tourism and homestays", "direct enquiry journeys with strong photography"], ["IT companies at Infopark", "service and careers pages for global clients"]],
  },
  vadodara: {
    about: "Vadodara is an industrial and educational centre in Gujarat, with chemicals, petrochemicals and engineering firms around its industrial estates and a large student community at Maharaja Sayajirao University. Many companies here sell highly technical products, so buyers come to a website looking for detailed specifications rather than slogans.",
    sectors: [["Chemical and process industries", "technical data sheets and specification-led enquiries"], ["Engineering and fabrication firms", "project capability pages for industrial clients"], ["Education and training providers", "course information for students across Gujarat"]],
  },
};

const LOCATION_SERVICES = {
  "": {
    about: "We work with businesses as a single design and development partner, so you don't have to coordinate a separate designer, developer and SEO freelancer. Most projects start with a website and grow from there into branding, online selling or custom software.",
    faq: [["Which services do most businesses start with?", "Usually a website, because everything else, from ads to SEO, depends on having a good one to send people to."], ["Can you handle branding and the website together?", "Yes. Doing both together keeps the look consistent and usually costs less than hiring separately."]],
  },
  "web-development": {
    about: "We hand-code websites using modern frameworks instead of stacking plugins on a theme. That keeps pages quick on mobile data, keeps your data in your own accounts, and leaves room to add features later without starting over.",
    faq: [["Do you use templates?", "No. We build the site for your content, so you don't carry code you don't use."], ["Can I update the content myself?", "Yes, we add a simple admin panel when you expect to make regular changes."]],
  },
  "web-design": {
    about: "Web design decides whether visitors understand what you do in the first few seconds. We start with the page structure and message, then the visuals, and show you a complete design to approve before any development begins.",
    faq: [["Will I see the design before it's built?", "Yes. You review and approve the full design first, when changes are still easy."], ["Is the design mobile-friendly?", "We design for phones first, since that's where most of your visitors will be."]],
  },
  "ui-ux-design": {
    about: "UI/UX work is about removing confusion from a product. We map how people move through it, prototype the improved flow in Figma and test it before anyone writes code, which is far cheaper than fixing it after launch.",
    faq: [["What's the difference between UI and UX?", "UX is how the product works and flows. UI is how it looks. We handle both together."], ["Do I get the Figma files?", "Yes, along with the prototype and component library. You own everything."]],
  },
  "ecommerce-development": {
    about: "An online store succeeds on the small details: how quickly product pages load, how few steps checkout takes, and whether your customers' preferred payment options are there. We build around those details, including UPI, cards and cash on delivery.",
    faq: [["Which payment methods can you add?", "UPI, cards, net banking and COD through gateways such as Razorpay."], ["Can you move my store from another platform?", "Yes, with products and customer data, and redirects so old links keep working."]],
  },
  "wordpress-development": {
    about: "WordPress is ideal when your team wants to publish without a developer. We build lightweight custom themes rather than relying on heavy page builders, keeping the site quick and the editing screens simple enough that layouts don't get broken.",
    faq: [["Can you speed up my current WordPress site?", "Usually. We audit the theme, plugins and hosting and tell you what's slowing it down."], ["Will updates break the site?", "We keep plugins to a minimum and test updates, and maintenance plans cover this for you."]],
  },
  "shopify-development": {
    about: "Shopify suits businesses that want to run their own store without managing servers. We customise the theme to match your brand, set up products, shipping and payments, and train your team to run day-to-day orders on their own.",
    faq: [["How much does Shopify itself cost?", "Shopify charges a monthly plan fee directly, separate from our build. We'll help you choose the right plan."], ["Do I need Shopify Plus?", "Most businesses don't. We only recommend it when your volume actually justifies it."]],
  },
  "seo-services": {
    about: "SEO starts by fixing what stops Google from understanding your site, then improving the pages people actually search for. Nobody can honestly promise a set ranking, so we focus on audit-led fixes and clear reporting on what changes over time.",
    faq: [["Can you guarantee a first-page ranking?", "No, nobody honestly can. We remove what's holding your site back and report on the results."], ["Does local SEO need a Google Business Profile?", "Yes. It's one of the most useful steps for local searches, and we'll help you set it up correctly."]],
  },
  "brand-identity": {
    about: "A brand identity gives your business a consistent look wherever people meet it, from your website to your shop sign. We build a logo, colours and type together, with simple rules, so you stay recognisable as your team and materials grow.",
    faq: [["What files will I get?", "Logo files for print and digital, colour and font details, and a short guidelines PDF."], ["Can you work with my existing logo?", "Yes, we can refresh it or build a stronger system around it."]],
  },
  "social-media-design": {
    about: "Consistent posts make a business look active and reliable. We design a template set for your regular content, including offers, products and festival wishes, so your team can publish quickly without starting from a blank page every time.",
    faq: [["Which platforms do the templates cover?", "Instagram, Facebook, LinkedIn and WhatsApp, sized correctly for each."], ["Can my team edit them?", "Yes, in Canva or Figma, so changing text and images takes minutes."]],
  },
  "logo-design": {
    about: "A good logo is simple enough to recognise at a glance, whether it's on a phone screen or a printed sign. We explore a few distinct directions based on your business, refine the one you choose and deliver every file format you'll need.",
    faq: [["How many concepts do you show?", "A few genuinely different directions, then we refine your favourite."], ["Do I own the logo?", "Yes, with full copyright transfer and all source files."]],
  },
  "figma-design": {
    about: "Well-organised Figma files make the difference between a design developers can build and one they have to guess at. We create auto-layout components, variables and clean prototypes, so your developers and future designers can pick up the work easily.",
    faq: [["Can you convert my existing design into Figma?", "Yes, including rebuilding it with proper components so it stays easy to edit."], ["Can you also build it?", "Yes, we can turn the Figma design into a working website or app."]],
  },
  "php-development": {
    about: "A lot of useful business software runs on PHP, and it doesn't always need replacing. We build new applications in Laravel, and we also maintain, secure and modernise existing PHP systems, telling you honestly whether it's better to fix or rebuild.",
    faq: [["Can you fix an old PHP application?", "Often, yes. We review it first and tell you whether to fix, upgrade or rebuild."], ["Do you work with Laravel?", "Yes. It's our usual choice for new PHP projects."]],
  },
  "react-development": {
    about: "React is the right choice for rich, interactive interfaces such as dashboards and customer portals. We build clean, reusable components with TypeScript, so the app stays maintainable as it grows and your own developers can keep working on it later.",
    faq: [["Should I choose React or Next.js?", "For public sites that need SEO we suggest Next.js. For apps behind a login, plain React often works well."], ["Can you join my existing React project?", "Yes. We review the code first and then work within your setup."]],
  },
  "nextjs-development": {
    about: "Next.js combines fast page loads with strong SEO, which makes it a good fit for marketing sites and content-heavy applications. This website is built with it. We handle the setup, from server rendering and image handling to deployment on Vercel.",
    faq: [["Why Next.js instead of WordPress?", "It's faster and more flexible, but needs a developer for structural changes. We add an admin panel for your content."], ["Where is it hosted?", "Usually Vercel, in accounts you own, so you're never locked in with us."]],
  },
  "mobile-app-development": {
    about: "We design mobile apps in Figma and build web apps that work well on phones without an app store download. If you truly need a native app, we'll design it and work alongside your native developers, and tell you up front when a web app would do the job.",
    faq: [["Do you publish native apps yourselves?", "Our focus is app design and web apps. For native builds, we work with your developers."], ["Is a web app enough for me?", "Often. It costs less, needs no install and updates instantly. We'll advise you honestly."]],
  },
};

let n = 0;
for (const [title, s] of Object.entries(SERVICES)) {
  const r = await sql`
    UPDATE services SET slug = COALESCE(slug, ${s.slug}), tagline = COALESCE(tagline, ${s.tagline}), overview = COALESCE(overview, ${s.overview}),
      includes_json = COALESCE(includes_json, ${JSON.stringify(s.includes)}), best_for_json = COALESCE(best_for_json, ${JSON.stringify(s.bestFor)}),
      timeline = COALESCE(timeline, ${s.timeline}), faq_json = COALESCE(faq_json, ${JSON.stringify(s.faq)})
    WHERE title = ${title} RETURNING id`;
  if (!r.length) console.warn("No service:", title);
  n += r.length;
}
console.log("services", n);
n = 0;
for (const [slug, c] of Object.entries(CITIES)) {
  const r = await sql`
    UPDATE location_cities SET about = COALESCE(about, ${c.about}),
      sectors_json = COALESCE(sectors_json, ${JSON.stringify(c.sectors.map(([name, need]) => ({ name, need })))})
    WHERE slug = ${slug} RETURNING id`;
  if (!r.length) console.warn("No city:", slug);
  n += r.length;
}
console.log("cities", n);
n = 0;
for (const [slug, s] of Object.entries(LOCATION_SERVICES)) {
  const r = await sql`
    UPDATE location_services SET about = COALESCE(about, ${s.about}), faq_json = COALESCE(faq_json, ${JSON.stringify(s.faq)})
    WHERE slug = ${slug} RETURNING id`;
  if (!r.length) console.warn("No location service:", slug);
  n += r.length;
}
console.log("location services", n);
