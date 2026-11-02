-- "Get Free Quote" on location pages links to /contact?service=<contact_param>; the value must be a real service
-- title or the contact form can't pre-select it. Map the old free-text values to the current service list.
UPDATE location_services SET contact_param = 'Custom Website Development' WHERE slug IN ('web-development', 'php-development');
UPDATE location_services SET contact_param = 'UI/UX Design' WHERE slug IN ('web-design', 'ui-ux-design', 'figma-design');
UPDATE location_services SET contact_param = 'E-Commerce & Shopify' WHERE slug IN ('ecommerce-development', 'shopify-development');
UPDATE location_services SET contact_param = 'SEO & Performance Optimisation' WHERE slug = 'seo-services';
UPDATE location_services SET contact_param = 'Brand Identity & Logo Design' WHERE slug IN ('brand-identity', 'logo-design');
UPDATE location_services SET contact_param = 'Web Application Development' WHERE slug IN ('react-development', 'nextjs-development');
UPDATE location_services SET contact_param = 'Mobile App Design' WHERE slug = 'mobile-app-development';
