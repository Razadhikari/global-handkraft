# Global Handcrafts AS: Project Scope and Product Vision

Live at [handcraftsglobal.com](https://www.handcraftsglobal.com).

## 0. Implementation Status

This section reflects what is actually built in the codebase today, as opposed to the vision/roadmap content in the rest of this document. Sections below are otherwise written as target scope; where an item is already live, it's noted inline as **(Implemented)**.

### Live today

**Storefront**

- Home, Shop with category/filter browsing, Product Detail, Cart, Checkout, Account, Contact, FAQ, About, Privacy, Terms, Shipping, Returns pages
- Product variants (price/size/stock per color and size combination) and paid add-ons
- Slide-in cart drawer and checkout flow
- Currency switcher with live exchange rates (NOK/EUR/USD)
- Zone-based international pricing: admin-configurable markup applied automatically by shipping country (`/admin/settings/pricing-zones`)
- Newsletter signup, cookie/GDPR notice, WhatsApp contact button
- Dynamic Open Graph image generation, `sitemap.xml`, `robots.txt`

**Checkout & payments**

- Stripe Checkout and Vipps ePayment API, buyer's choice at checkout, both webhook-driven order creation (Vipps needs `VIPPS_*` credentials configured before it's selectable; see Getting Started in the README)
- Live shipping rate quotes via Bring (Posten Norge) and PostNord, admin-configurable shipping zones and free-shipping thresholds
- Per-country VAT rates

**Orders & documents**

- Full order status lifecycle (Pending, Paid, Processing, Shipped, Delivered, Cancelled, Refunded) with a status-history timeline and a customer email sent on every transition
- PDF generation (`@react-pdf/renderer`) for invoices, receipts, packing lists, customs invoices, gift receipts, return cards, shipping summaries, and order summaries, with barcodes (`bwip-js`), QR codes, and sequential document numbering
- Customer-facing order history with document downloads

**Custom orders (Mandap/Temple builds)**

- Customer-submitted custom order inquiries with dimensions, material, budget range, and reference images
- Dedicated admin Custom Orders dashboard (`/admin/custom-requests`), segregated from the regular Orders view
- Threaded messaging between customer and admin with unread indicators and rich-text formatting
- Live chat layered on the thread: Supabase Realtime private channels deliver new messages instantly, plus online-presence and typing indicators (`components/mandap-inquiry-thread.tsx`), and a live new/pending count badge in the admin sidebar (`components/admin/admin-shell.tsx`, `lib/realtime-broadcast.ts`)
- Admin quoting workflow: request status (Pending/Accepted/Declined/Paid), quoted price, and a manually-entered Stripe payment link — no in-app deposit/balance split or pro forma invoicing at this time

**Accounts**

- Supabase email/password authentication; admin role via email allow-list (`ADMIN_EMAILS`) or user metadata
- Customer account area: order history, addresses, custom-request threads, profile
- GDPR self-service data export and account-deletion request flow (with admin notification and a 30-day manual-processing note for bookkeeping retention)

**Admin dashboard**

- Live overview stats
- Sales reporting dashboard (`/admin/reports`): date-range trend chart, revenue/refunds summary, country breakdown, CSV export
- Products CRUD with variant/add-on management, automatic slug generation, and image upload to Supabase Storage
- Categories CRUD
- Orders management, status control, and document generation
- Custom Orders section (`/admin/custom-requests`), segregated from the Orders dashboard: mandap/temple inquiry management with threaded messaging and payment status control
- Shipping zone and rate configuration
- Pricing zone configuration for international markup

**Transactional email (Resend)**

- Order confirmation (with optional PDF receipt attached), order status updates, custom-inquiry admin notifications and customer replies, payment-status updates, account-deletion admin alerts

**Reviews & ratings**

- Public review submission per product (name, optional email, 1-5 star rating, title, comment), held as pending until an admin approves it
- Admin moderation queue (`/admin/reviews`) with pending/approved/all filters, approve/unapprove, and delete
- Approved reviews display on the product page with an aggregate star rating and count, kept in sync automatically (`Product.rating`/`reviewCount` recompute from approved reviews on every moderation action), plus Schema.org `AggregateRating` structured data

**Testimonials**

- Admin-managed homepage testimonials (`/admin/testimonials`): create/edit/delete, star rating, drag-to-reorder, show/hide toggle, and customer photo upload to Supabase Storage
- Replaces the previously hardcoded testimonial array; the homepage now fetches active testimonials live

**Security and data access**

- Row Level Security enabled with a deny-all policy set on every Prisma-managed table (`supabase/migrations/20260813020000_enable_rls_all_tables.sql`), closing Supabase's auto-exposed PostgREST Data API to the `anon`/`authenticated` roles; the app itself is unaffected since Prisma connects with a `BYPASSRLS` role
- Realtime Authorization policies (`supabase/migrations/20260813030000_realtime_authorization_mandap_inquiries.sql`) scope the live-chat private channels so only the inquiry's own customer (matched by email) or an admin can join an `inquiry:<id>` channel, and only admins can join the `admin:custom-requests` badge channel
- Storage bucket policies audited and trimmed (`supabase/migrations/20260813040000_drop_products_bucket_open_policies.sql`) to remove unauthenticated list/upload access left on the `products` bucket; all uploads go through the service-role client, matching the other buckets

### Not yet implemented

- Wishlist, product comparison, recently viewed, quick view, voice/advanced search, 360° image view
- Additional payment methods: Klarna, PayPal, Apple Pay, Google Pay
- Blog, searchable FAQ knowledge base (a static FAQ page is live; article search/categorization is not), CMS-managed homepage/content blocks (the `SiteSettings` model exists but is not yet wired into any admin UI or page)
- Multilingual (EN/NO/NE/HI) support
- Loyalty/rewards, referrals, gift cards, subscription kits, multi-vendor marketplace, 3D custom temple builder, AI recommendations
- shadcn/ui, Framer Motion, Zustand, TanStack Query, and React Hook Form + Zod are installed as dependencies but not yet integrated into the UI

## 1. Brand and Business Context

Global Handcrafts AS is a Norway-based brand importing and selling authentic handcrafted products from Nepal and South Asia for customers across Norway and Europe.

Primary brand values:

- Authentic craftsmanship
- Cultural continuity
- Fair trade and ethical sourcing
- Premium quality and trust
- Global delivery reliability

Primary visual direction:

- Premium Scandinavian minimalism blended with South Asian craftsmanship
- Elegant, trustworthy, culturally rich presentation
- Logo-inspired gradients and motifs without clutter

## 2. Brand Identity Guidelines

Use these as design tokens across UI components.

- Primary Green: `#4CAF50`
- Primary Orange: `#F7931E`
- Dark Navy: `#1B365D`
- Light Background: `#FAFAF7`
- Accent Gold: `#D4AF37`
- White: `#FFFFFF`

Design and motion language:

- Rounded cards, soft shadows, clean white space
- Premium typography hierarchy
- Fade-in on scroll, hover lift, smooth transitions
- Glassmorphism only in selective highlight surfaces
- Mobile-first responsive design with high readability

Typography targets:

- Headings: Playfair Display
- Body: Inter
- Buttons: Semibold weight

## 3. Target Markets and Customer Segments

Geographic focus:

- Norway
- Sweden
- Denmark
- Finland
- Germany
-Belgium


Primary audience segments:

- Hindu families
- Nepali and Indian communities
- Temple organizations and religious institutions
- Interior decorators
- Gift buyers
- Spiritual lifestyle customers

## 4. Product Universe

### 4.1 Handcrafted Wooden Temples

Core offering groups:

- Small Temple
- Medium Temple
- Premium Temple
- Wall Mounted Temple
- Teak Wood Temple
- Rosewood Temple
- Custom Temple

Per-product content requirements:

- Multiple images
- Description and handcrafted process story
- Material details
- Dimensions and weight
- Shipping information
- Reviews and rating
- Price and stock by variant

### 4.2 Traditional Clothes

Men:

- Daura Suruwal
- Kurta
- Dhaka Topi
- Sherwani

Women:

- Saree
- Lehenga
- Kurti
- Salwar Suit

Accessories:

- Shawls
- Handmade bags
- Jewelry

### 4.3 Pooja Items

Brass:

- Diya
- Bell
- Kalash
- Aarti lamp

Copper:

- Lota
- Plate
- Spoon

Wood/Stone/Decor:

- Incense holder
- Pooja chowki
- Shivling
- Decorative lamps

Accessories:

- Incense
- Camphor
- Kumkum
- Sindoor
- Rudraksha
- Mala

### 4.4 Pooja Mandap

- Indoor mandap
- Outdoor mandap
- Wedding mandap
- Festival mandap
- Temple decoration solutions
- Custom designs

## 5. Website Information Architecture

Primary pages:

- Home
- About Us
- Shop
- Product Details
- Categories
- Cart
- Checkout
- Account
- Contact
- Blog
- FAQ

Support pages:

- Privacy Policy
- Terms
- Shipping Policy
- Returns Policy
- Cookie/GDPR

## 6. Homepage Composition

Hero section:

- Headline: "Authentic Handcrafted Treasures Delivered Across Europe"
- Subheadline: Premium handcrafted temples, pooja items, traditional clothing, and cultural products sourced directly from skilled artisans.
- CTA: Shop Now
- Secondary CTA: Explore Temples

Planned sections:

- Featured Categories
- Best Sellers
- New Arrivals
- Featured Collections
- Why Choose Us
- Artisan Story and Craftsmanship
- Testimonials
- Statistics
- Instagram Gallery/Feed
- Newsletter

Suggested KPI counters:

- 1000+ Happy Customers
- 500+ Handmade Products
- 20+ Skilled Artisans
- 10+ Countries Served

## 7. Shop and Discovery Experience

Filtering requirements:

- Category
- Price range
- Material
- Wood type
- Size
- Color
- Availability

Sorting requirements:

- Newest
- Popularity
- Highest price
- Lowest price
- Best rated

Discovery enhancements:

- Live search
- Advanced search
- Voice search
- Infinite scroll
- Grid/List toggle
- Quick view
- Product comparison
- Recently viewed

## 8. Product Detail Experience

Required sections:

- Large image gallery
- Zoom and optional 360 view
- Description and specifications
- Materials, dimensions, and weight
- Handcrafted story
- Care instructions
- Shipping and delivery details
- Reviews
- Related products
- Recently viewed
- Wishlist and share actions

## 9. Commerce and Checkout

Cart capabilities:

- Slide-in cart drawer
- Quantity updates
- Gift message
- Shipping estimate

Checkout capabilities:

- Guest and account checkout
- Address and delivery method
- Payment methods
- Order summary
- Confirmation and tracking details

Payment methods:

- Stripe (Implemented — cards, Visa/Mastercard via Stripe Checkout)
- Vipps (Implemented — Vipps ePayment API, webhook-driven order creation)

Roadmap:

- Apple Pay
- Google Pay
- PayPal
- Klarna

## 10. Shipping and Operations

Primary service countries:

- Norway
- Sweden
- Denmark
- Finland
- Germany

Customer logistics requirements:

- Estimated delivery: 3-10 days
- Real-time shipping calculator
- Tracking number generation
- Order tracking UI

## 11. Customer Account and Support

Account modules:

- Orders
- Wishlist
- Addresses
- Profile
- Returns
- Password management

Contact and support:

- Contact form
- Map/location
- Phone and email
- WhatsApp
- Business hours
- FAQ knowledge base

## 12. Content and SEO Strategy

Blog categories:

- Culture
- Temple decoration
- Pooja guides
- Festival guides
- Home decor
- Traditional clothing

SEO requirements:

- Structured data (Schema.org)
- Dynamic titles and descriptions
- Open Graph metadata
- Canonical URLs
- XML sitemap
- robots.txt
- Semantic HTML
- Optimized image alt text
- Core Web Vitals focus

## 13. Admin Dashboard Scope

Admin modules:

- Dashboard overview
- Orders
- Customers
- Products
- Inventory
- Analytics and sales graph
- Product reviews moderation
- Shipping settings
- Global settings
- Content management
- Blog manager
- Media library
- Role management

## 14. Technical Architecture Plan

Current stack in repository (Implemented):

- Next.js + TypeScript, Tailwind CSS
- Prisma ORM + PostgreSQL (Supabase-hosted)
- Supabase Authentication for account flows and admin role gating
- Supabase Storage for product image delivery
- Stripe and Vipps for checkout and webhook lifecycle
- Resend for transactional email (order confirmations, status updates, custom-inquiry and payment notifications)
- Bring (Posten Norge) and PostNord for live shipping rates
- `@react-pdf/renderer`, `bwip-js`, and `qrcode` for the order document system (invoices, receipts, packing lists, etc.)

Target architecture additions (installed but not yet integrated, or not yet started):

- shadcn/ui for composable UI primitives
- Framer Motion for interactions and transitions
- Zustand for local state (cart, UI state)
- TanStack Query for async caching
- React Hook Form + Zod for robust form validation (Zod is currently used only for document-data validation, not forms)
- Vercel deployment pipeline

Data and extensibility principles:

- Product schema supports variants, add-ons, and rich metadata
- CMS-friendly content blocks for homepage and blog
- API contracts for future multi-vendor and personalization support
- Modular service layer for payment/shipping providers

## 15. Accessibility, Privacy, and Compliance

Accessibility:

- Keyboard navigation compatibility
- Sufficient contrast and readable typography scales
- ARIA semantics for interactive controls
- Focus state visibility

Compliance and trust:

- Cookie consent
- GDPR data handling
- Transparent returns and shipping policies
- Secure payment and privacy pages

## 16. Future Enhancements (Architecture-Ready)

Planned expansion capabilities:

- Multi-vendor marketplace support
- Custom temple builder with 3D preview
- AI-powered recommendations
- Product personalization (engraving/custom sizing)
- Loyalty and rewards
- Referral system
- Gift cards
- Subscription pooja kits
- Multilingual support (EN/NO/NE/HI)
- Multi-currency support (NOK/EUR/USD)
- ERP and shipping integrations
- iOS and Android mobile apps

## 17. Delivery Roadmap (Recommended)

Phase 1: Brand and storefront foundation

- Finalize design system and brand tokens
- Complete homepage, shop, product detail, and cart UX
- Seed complete product categories and variants

Phase 2: Commerce and trust systems

- Checkout hardening and payment integrations
- Shipping calculator and tracking workflow
- SEO, content, and policy pages

Phase 3: Admin and operational maturity

- Dashboard modules and content management
- Review moderation and analytics
- Campaign tools (featured collections)

Phase 4: Growth and advanced capabilities

- Localization and currencies
- Recommendation engine and personalization
- Multi-vendor and 3D custom builder readiness

## 18. Immediate Implementation Priorities

1. Align global brand naming to "Global Handcrafts AS" across metadata and UI.
2. Introduce full category taxonomy and filtering schema in shop UI.
3. Expand product model for richer specifications and review content.
4. Implement homepage section framework matching this scope.
5. Prepare integrations for authentication, Cloudinary, and multi-payment roadmap.
