// Industries we serve (Industries page and the home page). Each icon is one or more SVG path strings.
export const INDUSTRIES: { slug: string; title: string; desc: string; tags: string[]; icon: string[] }[] = [
  {
    slug: "ecommerce-retail",
    title: "E-Commerce & Retail",
    desc: "High-converting storefronts on Shopify, MedusaJS, and WooCommerce — built for speed, mobile, and repeat buyers.",
    tags: ["Shopify", "MedusaJS", "WooCommerce"],
    icon: ["M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"],
  },
  {
    slug: "saas-startups",
    title: "SaaS & Startups",
    desc: "Marketing sites, dashboards, and product UIs in React and Next.js that ship fast and scale with you.",
    tags: ["Next.js", "React", "Dashboards"],
    icon: [
      "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    ],
  },
  {
    slug: "manufacturing-industrial",
    title: "Manufacturing & Industrial",
    desc: "Spec-driven catalogs, product pages, and B2B lead capture for manufacturers, exporters, and IndiaMART sellers.",
    tags: ["Catalogs", "B2B Leads", "Spec Sheets"],
    icon: [
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    ],
  },
  {
    slug: "healthcare-wellness",
    title: "Healthcare & Wellness",
    desc: "Trustworthy, accessible sites for clinics, practitioners, and wellness brands — with booking built in.",
    tags: ["Booking", "Accessible", "Local SEO"],
    icon: ["M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"],
  },
  {
    slug: "real-estate-property",
    title: "Real Estate & Property",
    desc: "Listing sites and landing pages that turn property searches into qualified enquiries.",
    tags: ["Listings", "Maps", "Lead Forms"],
    icon: ["M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-14h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01"],
  },
  {
    slug: "education-elearning",
    title: "Education & E-Learning",
    desc: "Course platforms, school sites, and enrolment flows that students actually finish.",
    tags: ["LMS", "Enrolment", "WordPress"],
    icon: [
      "M12 14l9-5-9-5-9 5 9 5z",
      "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    ],
  },
  {
    slug: "finance-fintech",
    title: "Finance & Fintech",
    desc: "Clean, compliant interfaces for fintech products, advisories, and financial dashboards.",
    tags: ["Dashboards", "Security", "Trust UX"],
    icon: [
      "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    ],
  },
  {
    slug: "hospitality-food",
    title: "Hospitality & Food",
    desc: "Restaurant, cafe, and hotel sites with menus, reservations, and online ordering.",
    tags: ["Menus", "Reservations", "Orders"],
    icon: [
      "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.614 2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.19-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72",
    ],
  },
  {
    slug: "nonprofits-ngos",
    title: "Nonprofits & NGOs",
    desc: "Donation-ready sites and campaigns for foundations and community organisations.",
    tags: ["Donations", "Campaigns", "Reports"],
    icon: ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"],
  },
];
