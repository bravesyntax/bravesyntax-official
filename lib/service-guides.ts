// In-depth content for each service page, keyed by service slug. Each section answers one question a buyer actually
// asks, starting with the answer, so it reads well for people and can be quoted by search and AI answers.
// Keep it factual: prices come from the published tiers, and nothing here claims results for a client.

export type ServiceGuide = {
  /** Direct answer to "what is this?", in two or three sentences. */
  definition: string;
  whenToChoose: string[];
  steps: [string, string][];
  /** What the price depends on, and the published range where there is one. */
  pricing: string;
  price?: { min: number; max?: number };
  costFactors: string[];
  comparison: { title: string; headers: [string, string, string]; rows: [string, string, string][] };
  mistakes: [string, string][];
  faqs: [string, string][];
};

/** Shown on service and industry pages as the date this content last changed. */
export const GUIDES_UPDATED = "2026-11-04";

export const SERVICE_GUIDES: Record<string, ServiceGuide> = {
  "custom-website-development": {
    definition: "Custom website development means designing and coding a site specifically for your business instead of adapting a ready-made theme. You get only the pages and features you need, faster loading, and full ownership of the code.",
    whenToChoose: ["Your current site is slow or hard to change", "A theme can't do what your business needs, such as a product finder or quote form", "Your website is a main source of enquiries or sales", "You want to own your code and not depend on a builder's monthly plan"],
    steps: [
      ["Brief and quote", "We go through your goals, customers and competitors, then send a written scope, fixed price and timeline."],
      ["Structure and content", "We plan the pages and what each one must do, and work out what content is needed from you."],
      ["Design", "You see and approve designs for key pages on desktop and phone before any code is written."],
      ["Development", "We build the site and share a private staging link so you can check progress at any time."],
      ["Launch and handover", "We test it, connect the domain, submit the sitemap to Google, and train you to edit content."],
    ],
    pricing: "A 5–10 page custom website is typically ₹20,000–₹60,000. A landing page or 3-page site starts at ₹8,000. You get a fixed quote before work starts.",
    price: { min: 20000, max: 60000 },
    costFactors: ["Number of unique page designs", "Whether you need an admin panel to edit content", "Custom features such as calculators, booking or product filters", "Whether content and photos are ready or need to be created"],
    comparison: {
      title: "Custom website, theme or website builder?",
      headers: ["", "Custom website", "Theme or builder"],
      rows: [
        ["Speed", "Only the code your site uses", "Often carries unused features and scripts"],
        ["Design", "Made around your brand and customers", "Limited by the template"],
        ["Unique features", "Built to your requirements", "Depends on available plugins or apps"],
        ["Ownership", "You own the code and accounts", "Tied to the platform on many builders"],
        ["Upfront cost", "Higher", "Lower"],
        ["Best for", "Businesses that rely on their website", "Testing an idea on a small budget"],
      ],
    },
    mistakes: [
      ["Designing before planning content", "Layouts built around placeholder text often break when the real content arrives. Plan the words first."],
      ["Judging the site only on a desktop", "Most Indian visitors arrive by phone. Review every page on one, on mobile data."],
      ["Leaving SEO until after launch", "Page titles, URLs and structure are far cheaper to get right during the build."],
      ["Accounts in the agency's name", "Your domain and hosting should be registered in your name, so you can always move."],
    ],
    faqs: [
      ["How long does a custom website take?", "Most business websites take 1–3 weeks once content is ready. The biggest cause of delay is waiting for content and feedback."],
      ["Is a custom website better for SEO than WordPress?", "Not automatically. Search engines reward fast, useful, well-structured pages. A custom build makes speed easier to achieve, but a well-built WordPress site can also rank well."],
      ["What happens after the website goes live?", "You get a support window for bugs and small changes, plus training. After that, you can edit content yourself or take a monthly maintenance plan."],
    ],
  },

  "web-application-development": {
    definition: "Web application development is building software that runs in a browser, such as dashboards, customer portals and booking systems. Unlike a brochure website, users log in and work with their own data, so it needs a database, permissions and secure back-end logic.",
    whenToChoose: ["Your team runs key work on spreadsheets and WhatsApp", "Customers need to log in to track orders or documents", "Off-the-shelf software forces you to change how you work", "You are launching a software product and need a first version"],
    steps: [
      ["Map the workflow", "We document who uses the system, what they do, and which rules apply, before anything is designed."],
      ["Define a first version", "We separate what is essential from what can wait, so you launch sooner and spend less."],
      ["Design the screens and data", "You approve key screens while we plan the database and permissions."],
      ["Build in milestones", "Working features arrive in stages on a staging link, so problems surface early."],
      ["Test, launch and train", "We test roles and edge cases, move any existing data, and train your team."],
    ],
    pricing: "Web applications start at ₹60,000. The final price depends on the scope, which is why we write it down and quote it as fixed before development starts.",
    price: { min: 60000 },
    costFactors: ["Number of user roles and permissions", "Number of screens and workflows", "Integrations with payment, WhatsApp, email or accounting tools", "Moving data from existing systems"],
    comparison: {
      title: "Custom web app or off-the-shelf software?",
      headers: ["", "Custom web app", "Off-the-shelf software"],
      rows: [
        ["Fit", "Built around your workflow", "You adapt to the product"],
        ["Time to start", "Weeks", "Often the same day"],
        ["Cost pattern", "Mostly upfront", "Ongoing per-user subscription"],
        ["Integrations", "Built as required", "Limited to what the vendor offers"],
        ["Best for", "Processes that set you apart", "Standard needs like basic accounting"],
      ],
    },
    mistakes: [
      ["Building everything in version one", "Long first releases are built on assumptions. Launch the core workflow and improve it with real usage."],
      ["Treating permissions as an afterthought", "Who can see and change what affects the whole database. Plan it from day one."],
      ["No plan for backups", "A business system needs automated backups and a tested way of restoring them."],
      ["Skipping staff input", "The people who will use the software every day know where the real problems are."],
    ],
    faqs: [
      ["How long does a web application take?", "A focused first version usually takes 3–8 weeks. We split larger systems into stages, each one usable on its own."],
      ["What technology do you use for web apps?", "Usually Next.js, React and TypeScript with a PostgreSQL database. We confirm the choice and the reasons before starting."],
      ["Do I own the application?", "Yes. You receive the source code and the hosting and database accounts in your own name."],
    ],
  },

  "ecommerce-shopify": {
    definition: "E-commerce development is building an online store where customers can browse, pay and track orders. Shopify suits most businesses because hosting, security and checkout are managed for you. A custom store makes sense when your catalogue or buying process doesn't fit a standard platform.",
    whenToChoose: ["You sell on marketplaces and want your own margin and customer list", "Your current store is slow or hard to buy from on a phone", "You need Indian payment options such as UPI and cash on delivery", "You are moving to Shopify from another platform"],
    steps: [
      ["Plan the catalogue", "We organise categories, variants and filters so customers can find products quickly."],
      ["Design the buying path", "Product page, cart and checkout are planned for a phone first."],
      ["Build and connect", "We set up payments, shipping, taxes and order notifications."],
      ["Load and test products", "We import products and place real test orders, including failed payments and returns."],
      ["Launch and train", "We connect the domain, set up analytics, and show your team how to manage orders."],
    ],
    pricing: "A straightforward store is usually within our ₹20,000–₹60,000 range. Large catalogues and custom platforms start at ₹60,000 and are quoted after the brief. Platform and payment gateway fees are separate.",
    price: { min: 20000 },
    costFactors: ["Number of products and variants", "Theme customisation or fully custom design", "Integrations with shipping, inventory or accounting tools", "Moving products and customers from an old store"],
    comparison: {
      title: "Shopify, WooCommerce or a custom store?",
      headers: ["", "Shopify", "WooCommerce or custom"],
      rows: [
        ["Setup", "Fastest", "Takes longer"],
        ["Running it", "Hosting and security are managed", "You or your developer manage them"],
        ["Monthly cost", "Plan fee plus any paid apps", "Hosting, plus maintenance"],
        ["Flexibility", "Good, within platform limits", "Very high"],
        ["Best for", "Most small and mid-size stores", "Unusual catalogues or buying flows"],
      ],
    },
    mistakes: [
      ["Hiding shipping costs until checkout", "Surprise charges are a common reason for abandoned carts. Show them early."],
      ["Too many apps", "Each app can add scripts that slow the store. Install only what earns its place."],
      ["Weak product photos and descriptions", "Online buyers can't touch the product, so these do the job of a salesperson."],
      ["No test of the full order", "Place real orders before launch, including a refund, to find what breaks."],
    ],
    faqs: [
      ["Which is better for India, Shopify or WooCommerce?", "Shopify is usually better if you want less technical upkeep. WooCommerce suits businesses already on WordPress or those who want full control. Both support Indian payment gateways."],
      ["Can you accept UPI and cash on delivery?", "Yes. Most stores use an Indian payment gateway for UPI, cards and netbanking, and cash on delivery can be turned on for selected orders."],
      ["How long does an online store take?", "Usually 2–6 weeks, mainly depending on catalogue size and how ready your product content is."],
    ],
  },

  "wordpress-development": {
    definition: "WordPress development is building or improving a website on WordPress, the content management system. It suits businesses that publish often and want to edit pages without a developer. Good WordPress work uses few plugins, so the site stays fast and secure.",
    whenToChoose: ["You publish blogs or news regularly", "Your team wants to edit pages without help", "You already have a WordPress site that is slow or broken", "You need a capable site on a modest budget"],
    steps: [
      ["Review what you have", "We check your existing site, plugins and content, or plan from scratch for a new one."],
      ["Design and structure", "We plan the pages and design them around your brand."],
      ["Build with few plugins", "We add only the plugins that are needed, and set up easy editing."],
      ["Secure and speed up", "Caching, image compression, backups and login protection are set up."],
      ["Train and hand over", "We show your team how to publish and update safely."],
    ],
    pricing: "Most WordPress websites fall within our ₹20,000–₹60,000 range, and a small site can start at ₹8,000. Repairs and speed fixes are quoted after a review.",
    price: { min: 8000, max: 60000 },
    costFactors: ["Custom design or an adapted theme", "Number of page types", "WooCommerce or other complex functionality", "Condition of an existing site"],
    comparison: {
      title: "WordPress or a custom-coded website?",
      headers: ["", "WordPress", "Custom-coded"],
      rows: [
        ["Editing", "Mature, familiar editor", "Admin panel built to your needs"],
        ["Upkeep", "Regular plugin and core updates", "Fewer moving parts"],
        ["Speed", "Good when built with care", "Easier to keep very fast"],
        ["Best for", "Content-heavy sites", "Custom features and top performance"],
      ],
    },
    mistakes: [
      ["Installing a plugin for everything", "Each one is another thing to slow the site or need security updates."],
      ["Never updating", "Most WordPress hacks use known holes in out-of-date software. Keep it updated."],
      ["No backups", "Automatic off-site backups make a bad update or hack recoverable."],
      ["Using an admin account for everything", "Give each person their own login, with only the access they need."],
    ],
    faqs: [
      ["Why is my WordPress site slow?", "Common causes are too many plugins, a heavy theme, uncompressed images, no caching and poor hosting. An audit shows which ones matter on your site."],
      ["Can you fix a hacked WordPress site?", "Yes. We clean the site, close the entry point, update everything and set up backups and login protection."],
      ["Is WordPress secure?", "It can be. Security depends mostly on keeping software updated, using few trusted plugins, strong logins and reliable hosting."],
    ],
  },

  "landing-page-design": {
    definition: "A landing page is a single web page built for one action, such as an enquiry, a sign-up or a purchase. It usually receives traffic from ads or a campaign, so it removes menus and distractions to keep the visitor focused.",
    whenToChoose: ["You run Google or Meta ads and send them to your home page", "You are launching one product, offer or event", "You want to test demand before building a full website", "Your campaign needs a page live within days"],
    steps: [
      ["Agree the goal", "We define the one action the page exists for and who it is aimed at."],
      ["Write the message", "The headline, proof and objections are written before the layout."],
      ["Design for phones", "The layout is designed mobile-first, with the action always easy to reach."],
      ["Build and connect", "We connect forms, WhatsApp and your analytics and ad tracking."],
      ["Launch and improve", "We check speed and tracking, then adjust from real visitor data."],
    ],
    pricing: "Landing pages start at ₹8,000, within our ₹8,000–₹20,000 Starter range. The price depends on length, copywriting and integrations.",
    price: { min: 8000, max: 20000 },
    costFactors: ["Who writes the copy", "Length and number of sections", "Custom graphics or video", "CRM, WhatsApp or ad-platform integrations"],
    comparison: {
      title: "Landing page or home page for your ads?",
      headers: ["", "Landing page", "Home page"],
      rows: [
        ["Goal", "One action", "Many visitors, many goals"],
        ["Navigation", "Removed or minimal", "Full menu"],
        ["Message", "Matches the ad", "General"],
        ["Tracking", "Clear per campaign", "Mixed with other traffic"],
      ],
    },
    mistakes: [
      ["Headline doesn't match the ad", "People should see the promise they clicked on within seconds."],
      ["Asking for too much on the form", "Ask only what you need for the first conversation."],
      ["A slow page on mobile", "You pay for every ad click, including visitors who leave before it loads."],
      ["No conversion tracking", "Without it, you can't tell which ads or changes are working."],
    ],
    faqs: [
      ["How long does a landing page take?", "Usually 3–5 days once the message and materials are agreed."],
      ["Do landing pages help SEO?", "They're built mainly for campaigns, not search. A page meant to rank needs more depth and should be planned for that purpose."],
      ["Can I edit the page after launch?", "Yes. We can set up easy editing, or make changes for you."],
    ],
  },

  "ui-ux-design": {
    definition: "UI/UX design plans how a product works and how it looks. UX (user experience) covers structure and flow, so people can finish their task. UI (user interface) covers the visual layer, such as layout, type, colour and buttons. The usual output is a tested Figma prototype that developers can build from.",
    whenToChoose: ["Users get stuck or leave partway through a process", "You are building an app and want to get it right before coding", "Your product has grown messy and inconsistent", "You need investor or stakeholder-ready prototypes"],
    steps: [
      ["Understand users and goals", "We review your product, analytics and competitors and speak to your team."],
      ["Map flows and wireframes", "Plain layouts settle the structure before visual design starts."],
      ["Create the visual design", "We apply your brand across key screens in Figma."],
      ["Prototype and test", "A clickable prototype lets people try it, so problems are found early."],
      ["Hand over to developers", "You get organised files, components and specs."],
    ],
    pricing: "UI/UX design is quoted after the brief, because the price depends mostly on the number of screens and flows.",
    costFactors: ["Number of screens and states", "Research and user testing required", "Whether a design system is included", "Web, mobile or both"],
    comparison: {
      title: "UX or UI: what's the difference?",
      headers: ["", "UX design", "UI design"],
      rows: [
        ["Question it answers", "Does this work for the user?", "Does this look clear and consistent?"],
        ["Typical output", "User flows, wireframes", "Screens, components, styles"],
        ["When it matters most", "Before visuals", "After structure is settled"],
      ],
    },
    mistakes: [
      ["Starting with visuals", "Polishing a poor flow makes it look better, but it won't work better."],
      ["Designing only the ideal case", "Empty, error and loading states are part of the product."],
      ["Testing only with your team", "People who built it can't see it fresh. Even a few outside users can reveal major problems."],
      ["No shared components", "Without them, every new screen drifts and development slows down."],
    ],
    faqs: [
      ["How long does UI/UX design take?", "Usually 1–3 weeks, depending on the number of screens."],
      ["Do I get the Figma files?", "Yes. You receive the editable files along with the components and styles."],
      ["Can you also build what you design?", "Yes. Having design and development in one team reduces handover mistakes."],
    ],
  },

  "brand-identity-logo-design": {
    definition: "Brand identity design creates the visual system that makes a business recognisable: its logo, colours, typography and how they're used. A logo is one part of it. The full identity keeps your website, packaging, social posts and print looking like one business.",
    whenToChoose: ["You are starting a new business", "Your logo looks poor when it's small or printed", "Your materials all look different", "You have changed direction and your look no longer fits"],
    steps: [
      ["Discovery", "We learn your business, customers, competitors and what you want to be known for."],
      ["Concepts", "We present distinct directions with examples of how each looks in real use."],
      ["Refinement", "We develop your chosen direction through agreed revision rounds."],
      ["System", "We set the colours, fonts and logo variations."],
      ["Delivery", "You receive all final files and short brand guidelines."],
    ],
    pricing: "Brand identity is quoted after the brief, based on how many concepts and applications you need.",
    costFactors: ["Logo only or full identity", "Number of concepts and revision rounds", "Applications, such as stationery or packaging", "Depth of the brand guidelines"],
    comparison: {
      title: "Logo or full brand identity?",
      headers: ["", "Logo only", "Full identity"],
      rows: [
        ["Includes", "Logo files", "Logo, colours, type and usage rules"],
        ["Consistency", "Depends on who uses it next", "Built in"],
        ["Best for", "Very early-stage businesses", "Businesses investing in growth"],
      ],
    },
    mistakes: [
      ["Following trends", "A logo should still work years from now."],
      ["Testing only at large size", "It must stay readable as a small favicon and on a phone."],
      ["Too many colours or details", "They cost more to print and are harder to reproduce."],
      ["Not getting vector files", "SVG or AI files are what let the logo scale without quality loss."],
    ],
    faqs: [
      ["What files will I receive?", "Vector files (SVG, AI or PDF) and web-ready PNG files, in colour, black and white."],
      ["How long does logo design take?", "Usually 1–2 weeks, including concepts and revisions."],
      ["Do I own the logo?", "Yes. All rights transfer to you once the final payment is made."],
    ],
  },

  "graphic-design-print": {
    definition: "Graphic design for print and marketing covers materials such as brochures, business cards, catalogues, flyers and presentations. Good print design adds correct bleed, colour settings and resolution to good looks, so the printed piece matches what you approved.",
    whenToChoose: ["You need a product catalogue or company brochure", "You have an exhibition or event coming up", "Your sales team uses inconsistent decks", "You want cards and stationery that match your brand"],
    steps: [
      ["Brief", "We confirm the purpose, size, quantity and where it will be used."],
      ["Content", "You provide text and photos, or we help organise them."],
      ["Design", "We share a first version, and refine it with your feedback."],
      ["Print check", "We set bleed, CMYK colour and image resolution."],
      ["Delivery", "You get print-ready PDFs and editable files where agreed."],
    ],
    pricing: "Priced per item after the brief, depending on the page count and how much content needs preparing.",
    costFactors: ["Page count", "Readiness of text and photos", "Custom illustrations or icons", "Number of size or language versions"],
    comparison: {
      title: "Print or digital brochure?",
      headers: ["", "Print", "Digital PDF"],
      rows: [
        ["Best for", "Meetings and exhibitions", "WhatsApp and email"],
        ["Colour setup", "CMYK", "RGB"],
        ["Updating", "Reprint", "Send a new file"],
        ["File size", "Large is fine", "Keep small for sharing"],
      ],
    },
    mistakes: [
      ["Using images from the web", "They're often too low in resolution for print, and you may not have the rights."],
      ["No bleed", "Without it, trimming can leave white edges."],
      ["Designing in RGB only", "Colours can shift noticeably when printed."],
      ["Skipping a printed proof", "Screens can't show exactly how paper and ink will look."],
    ],
    faqs: [
      ["What file do printers need?", "Usually a press-ready PDF in CMYK, with bleed and crop marks. We confirm your printer's exact requirements."],
      ["How long does it take?", "Usually 2–7 days per item, once the content is ready."],
      ["Can you make a WhatsApp-friendly version?", "Yes. We can export a smaller PDF for sharing, alongside the print file."],
    ],
  },

  "seo-performance-optimisation": {
    definition: "SEO and performance optimisation helps people find your website and helps it load quickly once they arrive. It covers technical fixes, content and structure, and speed. Results build over months, and no honest provider can guarantee a specific ranking.",
    whenToChoose: ["Your site gets little traffic from Google", "Pages are slow, especially on phones", "Google Search Console shows indexing errors", "Your site was recently redesigned and traffic fell"],
    steps: [
      ["Audit", "We check indexing, Search Console data, speed and content."],
      ["Prioritise", "You get a plain-language list of fixes, ordered by likely impact."],
      ["Fix technical issues", "We correct crawl, redirect, sitemap, structured data and speed problems."],
      ["Improve content", "Key pages get clearer answers, better headings and useful internal links."],
      ["Measure", "We track rankings, clicks and Core Web Vitals, and adjust."],
    ],
    pricing: "The audit and first fixes are quoted after we see the site. Ongoing work is usually added to a monthly plan, which starts at ₹5,000.",
    costFactors: ["Site size and age", "Depth of technical problems", "Amount of content to improve", "Competition in your market"],
    comparison: {
      title: "Traditional SEO and AI search: what changes?",
      headers: ["", "Traditional search", "AI answers"],
      rows: [
        ["Result", "A list of links", "A written answer citing sources"],
        ["What helps", "Relevance, links, page experience", "The same, plus clear, quotable answers"],
        ["Content style", "Covers the topic in depth", "Direct answer first, then the detail"],
        ["Foundation", "Crawlable, indexed pages", "The same: pages must be crawlable and indexed"],
      ],
    },
    mistakes: [
      ["Chasing rankings for words nobody buys from", "Target searches from people who need what you sell."],
      ["Publishing thin AI text in bulk", "Google's spam policies target mass-produced pages made mainly to rank, however they're written."],
      ["Ignoring page experience on phones", "Core Web Vitals look at real loading, responsiveness and layout stability."],
      ["Buying links", "Paid link schemes break Google's policies and can harm you."],
    ],
    faqs: [
      ["How long does SEO take to work?", "Technical fixes can show up within weeks. Meaningful growth usually takes several months, depending on competition and your site's starting point."],
      ["What are good Core Web Vitals scores?", "Google's 'good' thresholds are Largest Contentful Paint within 2.5 seconds, Interaction to Next Paint within 200 milliseconds, and Cumulative Layout Shift of 0.1 or less."],
      ["How do I appear in Google's AI Overviews?", "Google says there are no special requirements beyond normal SEO. Pages must be indexed and eligible to show a snippet, so the best approach is helpful, accurate, well-structured content that answers questions directly."],
      ["Can you guarantee first position on Google?", "No, and be careful of anyone who does. Google decides rankings. We can improve the things that influence them and report honestly."],
    ],
  },

  "api-backend-development": {
    definition: "Backend development builds the parts of software that users don't see: servers, databases and business rules. An API (application programming interface) is how separate systems talk to each other, such as your website sending an order to your accounting software.",
    whenToChoose: ["Staff copy data between systems by hand", "Your website needs to connect with a CRM, ERP or payment gateway", "A mobile app needs a backend", "An old system has become slow or unreliable"],
    steps: [
      ["Map data and systems", "We list what connects to what, and what must happen when things fail."],
      ["Design the API and database", "We agree endpoints, data structures and access rules."],
      ["Build with security in mind", "We add authentication, validation and rate limits."],
      ["Test failures, not just success", "We test bad data, timeouts and repeated requests."],
      ["Deploy and document", "You get monitoring and documentation for future developers."],
    ],
    pricing: "Custom backend projects start at ₹60,000 for larger systems. Smaller integrations are quoted individually after we review the systems involved.",
    costFactors: ["Number of systems connected", "Quality of third-party APIs and their documentation", "Data volume and speed requirements", "Security and audit requirements"],
    comparison: {
      title: "Direct integration or automation tool?",
      headers: ["", "Custom API", "Tools like Zapier"],
      rows: [
        ["Setup", "Longer", "Fast"],
        ["Cost at volume", "Stays stable", "Can grow per task"],
        ["Complex logic", "Handles it", "Limited"],
        ["Best for", "Core business processes", "Simple, low-volume tasks"],
      ],
    },
    mistakes: [
      ["Assuming the other system is always up", "Plan retries and alerts for when calls fail."],
      ["Storing secrets in code", "Keys belong in protected environment settings."],
      ["No logging", "Without logs, you can't tell why an order or payment failed."],
      ["Trusting incoming data", "Every input must be validated on the server."],
    ],
    faqs: [
      ["What is the difference between frontend and backend?", "The frontend is what users see and click. The backend stores data and applies the rules behind it."],
      ["Can you connect our website with our existing software?", "Usually, if that software has an API or a way to export data. We check this before quoting."],
      ["How long does an integration take?", "Usually 1–4 weeks per integration or API, depending on its quality and complexity."],
    ],
  },

  "mobile-app-design": {
    definition: "Mobile app design plans the screens, navigation and interactions of an iOS or Android app, and delivers a clickable prototype and specs for developers. It follows platform conventions, so the app feels familiar and works comfortably with one hand. This service covers design, not app development.",
    whenToChoose: ["You are planning an app and want to validate it before coding", "Your app works but is confusing", "You need a prototype to show investors", "Your developers need clear designs"],
    steps: [
      ["Define the core tasks", "We pick the few tasks the app must do really well."],
      ["Map flows", "We map sign-up, the core action, and error and empty states."],
      ["Design screens", "We follow iOS and Android conventions, adapted to your brand."],
      ["Prototype", "A clickable Figma prototype lets you try the app on a phone."],
      ["Developer handover", "You get components, specs and assets."],
    ],
    pricing: "Quoted after the brief, mainly based on the number of screens and whether iOS and Android need separate treatment.",
    costFactors: ["Number of screens and flows", "iOS, Android or both", "Custom animation and illustration", "Whether user testing is included"],
    comparison: {
      title: "Mobile app or mobile-friendly website?",
      headers: ["", "App", "Mobile website"],
      rows: [
        ["Reach", "Must be installed", "Opens from any link"],
        ["Device features", "Full access", "More limited"],
        ["Best for", "Frequent, repeat use", "Discovery and occasional use"],
        ["Cost", "Higher", "Lower"],
      ],
    },
    mistakes: [
      ["Forcing sign-up first", "Let people see the value before asking them to register."],
      ["Copying the website", "Phone screens and touch need their own patterns."],
      ["Small tap targets", "Apple recommends at least 44 points, and Android 48dp."],
      ["Ignoring slow connections", "Design clear loading and offline states."],
    ],
    faqs: [
      ["Do you build the app as well?", "This service covers design. We can build web apps, and we'll tell you honestly if your project needs a dedicated mobile development partner."],
      ["Do I need different designs for iOS and Android?", "Not entirely. A shared design with small platform-specific changes is usually enough."],
      ["How long does it take?", "Usually 2–4 weeks, depending on the number of screens."],
    ],
  },

  "social-media-design": {
    definition: "Social media design creates branded post, story and ad templates, so your feed looks consistent and is quick to produce. Instead of designing from scratch each week, your team changes the text and photo in a ready-made template, often in Canva or Figma.",
    whenToChoose: ["Your feed looks different every week", "Making each post takes too long", "You are launching a brand or campaign", "You run ads and need several sizes"],
    steps: [
      ["Review", "We look at your brand, audience and the kinds of posts you publish."],
      ["Choose post types", "Typically offers, tips, testimonials and announcements."],
      ["Design templates", "We create them in the right sizes for each platform."],
      ["Set up for editing", "We organise them in Canva or Figma."],
      ["Hand over", "We show your team how to reuse them while staying on brand."],
    ],
    pricing: "Quoted per template set after the brief, based on the number of templates and platforms.",
    costFactors: ["Number of templates", "Number of platforms and sizes", "Custom illustration or animation", "Whether we also produce the posts each month"],
    comparison: {
      title: "Templates or one-off posts?",
      headers: ["", "Template set", "One-off designs"],
      rows: [
        ["Consistency", "High", "Varies"],
        ["Speed per post", "Minutes", "Hours"],
        ["Best for", "Regular posting", "Big, unique campaigns"],
      ],
    },
    mistakes: [
      ["Too much text", "Posts are scanned quickly on small screens."],
      ["Using the wrong size", "Key content can get cropped in the feed or grid."],
      ["Low-contrast text", "It's hard to read in sunlight on a phone."],
      ["Copying competitors", "Your feed should be recognised as yours."],
    ],
    faqs: [
      ["Do you do monthly social media posts?", "Yes, as a separate arrangement. Many clients start with templates, then decide."],
      ["Which tool will I edit in?", "Usually Canva for ease of use, or Figma if your team prefers it."],
      ["How long does it take?", "A template set usually takes 3–7 days."],
    ],
  },

  "website-maintenance-support": {
    definition: "Website maintenance keeps a site secure, backed up, updated and working after launch. It includes software updates, monitoring, fixes and small content changes. Without it, sites gradually become slower, break, and become easier to hack.",
    whenToChoose: ["You have nobody responsible for your website", "Your site runs on WordPress or uses plugins", "You lose money when the site goes down", "You frequently need small changes"],
    steps: [
      ["Check the current state", "We review the site, hosting, backups and access."],
      ["Fix urgent issues", "Security holes and broken features come first."],
      ["Set up backups and monitoring", "Automatic backups, plus alerts for downtime."],
      ["Regular updates", "Updates are tested and applied on a schedule."],
      ["Monthly requests", "You send changes, and we handle them within the plan."],
    ],
    pricing: "Monthly plans start at ₹5,000, depending on the size of the site and how much change it needs.",
    price: { min: 5000 },
    costFactors: ["Site size and platform", "Number of plugins or integrations", "Hours of changes each month", "Response time you need"],
    comparison: {
      title: "Monthly plan or pay when it breaks?",
      headers: ["", "Monthly plan", "Pay when it breaks"],
      rows: [
        ["Cost pattern", "Predictable", "Unpredictable"],
        ["Backups and updates", "Regular", "Often forgotten"],
        ["Response", "Agreed in advance", "Depends on who's available"],
        ["Best for", "Sites that bring in business", "Small, rarely changed sites"],
      ],
    },
    mistakes: [
      ["Keeping backups only on the same server", "If the server fails, you lose both."],
      ["Never testing a restore", "A backup is only useful if it can be restored."],
      ["Updating directly on the live site", "Risky updates should be tried on a copy first."],
      ["Losing access details", "Keep your domain and hosting logins in your own name."],
    ],
    faqs: [
      ["What does website maintenance include?", "Typically updates, backups, security and uptime monitoring, bug fixes and a set amount of small changes. The exact list is in your plan."],
      ["Can you maintain a site you didn't build?", "Yes. We review it first and tell you about any problems before you commit."],
      ["Is maintenance necessary for a small website?", "If it runs on WordPress or takes enquiries, yes. A simple static site needs far less."],
    ],
  },

  "document-pdf-solutions": {
    definition: "Document and PDF solutions automate how a business creates files such as quotes, invoices, certificates and reports. Instead of copying data by hand, a system fills a branded template and produces the PDF, reducing mistakes and saving staff time.",
    whenToChoose: ["Staff build quotes or invoices by hand in Word or Excel", "Documents contain repeated errors", "You issue many certificates or reports", "You need branded documents sent automatically"],
    steps: [
      ["Collect examples", "We review your current documents and the data behind them."],
      ["Design templates", "We build clean, branded templates, including GST fields where needed."],
      ["Connect the data", "Forms, spreadsheets or your existing software feed the documents."],
      ["Test real cases", "We test long tables, page breaks, tax rules and Hindi text if needed."],
      ["Train your team", "Your team learns to create, send and store documents."],
    ],
    pricing: "Quoted after we review your documents. Small generators are cheaper than larger systems, and full web apps start at ₹60,000.",
    costFactors: ["Number of document types", "Where the data comes from", "Approval steps and user roles", "Email or WhatsApp delivery"],
    comparison: {
      title: "Custom generator or free online tools?",
      headers: ["", "Custom system", "Free tools"],
      rows: [
        ["Your branding", "Exact", "Limited"],
        ["Connects to your data", "Yes", "Usually manual"],
        ["Volume", "High", "One at a time"],
        ["Best for", "Regular business documents", "Occasional single files"],
      ],
    },
    mistakes: [
      ["Designing only for short data", "Test long item lists and page breaks."],
      ["Reusing invoice numbers", "Numbering must be sequential and controlled by the system."],
      ["Not checking tax rules", "GST invoice fields should be reviewed with your accountant."],
      ["Storing files without access control", "Business documents shouldn't sit at public links."],
    ],
    faqs: [
      ["Can you create GST invoices?", "Yes. We build the required fields and calculations, and recommend your accountant reviews the format."],
      ["Can documents go out automatically?", "Yes, by email or through a WhatsApp provider, once the document is generated."],
      ["Do you have a free tool I can try?", "Yes. Our free tools include a GST invoice maker and PDF tools, which run in your browser."],
    ],
  },
};
