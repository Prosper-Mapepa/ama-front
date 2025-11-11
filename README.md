# AMA at CMU Website

Official website for the American Marketing Association chapter at Central Michigan University.

## Overview

This website serves as the primary digital presence for AMA at CMU, providing information about our chapter, events, leadership team, and membership opportunities.

## Features

- **Home Page**: Compelling hero section, benefits overview, photo slider, upcoming events preview, and member testimonials
- **About Page**: Mission, vision, chapter activities, and membership benefits
- **Events Page**: Comprehensive event listings with upcoming and past events
- **Team Page**: Executive board profiles with contact information
- **Gallery Page**: Interactive photo gallery with category filtering and lightbox view
- **Membership Page**: Detailed membership tiers, joining process, and FAQs
- **Contact Page**: Contact form and chapter information
- **Admin Dashboard**: Full CMS for managing all website content
- **Responsive Design**: Fully mobile-optimized across all pages
- **Stunning Animations**: Smooth scroll effects, hover animations, and micro-interactions
- **Accessible**: WCAG compliant with proper semantic HTML and ARIA labels

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui with Radix UI
- **Animations**: Framer Motion for smooth transitions
- **Typography**: Geist font family
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

## Color Scheme

The website uses official CMU branding colors:
- **Primary**: CMU Maroon (#6A0032)
- **Primary Dark**: Darker Maroon (#510026)
- **Accent**: CMU Gold
- **Neutrals**: White, grays, and off-whites for balance

## Admin Dashboard

Access the admin dashboard at `/admin` to manage all website content.

**Demo Credentials:**
- Password: `admin123`

### Admin Features:

- **Home Page Editor**: Edit hero section, stats, benefits, and testimonials
- **Events Manager**: Add, edit, and remove events with full details (date, time, location, description, category, spots)
- **Team Manager**: Manage executive board members and advisor information with photos, bios, and contact details
- **Gallery Manager**: Upload and organize photos with category tagging and captions
- **About Page Editor**: Update mission, vision, and chapter information
- **Settings**: Configure site-wide settings and social media links

All content can be managed without touching code through the intuitive admin interface.

## Getting Started

### Development

1. Clone the repository
2. Install frontend dependencies: `pnpm install`
3. Install backend dependencies: `cd backend && pnpm install`
4. (Optional) start Postgres locally: `docker compose up -d` from `backend/`
5. Seed the database with the starter AMA content: `pnpm seed`
6. Start the backend API: `pnpm run start:dev`
7. In another terminal, run the frontend from the repo root: `pnpm dev`
8. Visit [http://localhost:3000](http://localhost:3000)

> Ensure `NEXT_PUBLIC_API_BASE_URL` points to your backend (`http://localhost:4000/api` during development).

### Deployment

This site is optimized for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically on push

## Content Management

### Using the Admin Dashboard (Recommended)

The admin dashboard at `/admin` writes directly to the NestJS backend. Changes are reflected across the public site instantly thanks to server-side rendering.  
Default admin credentials (seeded locally):

- Email: `admin@ama-cmu.org`
- Password: `Letmein@99x!`

### Manual Updates (Advanced)

All content shown publicly is sourced from the backend API. If you edit the React pages directly you should also persist matching records via:

- `/api/page-sections` for home/about content blocks
- `/api/events` for event listings
- `/api/team` for leadership profiles
- `/api/gallery` for gallery images
- `/api/settings` for contact info, socials, etc.

Direct code edits should generally only adjust layout or presentation.

### Reseeding / Resetting Data

To wipe the current content and re-import the baseline AMA dataset:

```bash
cd backend
pnpm seed
```

The script skips tables that already contain data; drop the existing records (or reset the database) if you want a clean slate.

## Customization

### Colors

Update the color tokens in `app/globals.css` to customize the theme. The current design uses CMU's official maroon and gold colors.

### Animations

All animations are defined in `app/globals.css`. Modify the keyframes and animation utilities to adjust timing and effects.

## Performance

- Optimized images with lazy loading
- Server components for improved performance
- Fast page loads with Next.js optimizations
- Framer Motion for smooth 60fps animations

## Accessibility

- Semantic HTML throughout
- Proper heading hierarchy
- Alt text on all images
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios for readability
- WCAG AA compliant

## SEO

- Optimized metadata on all pages
- Open Graph tags for social sharing
- Clean URL structure
- Sitemap generation

## Support

For questions or support, contact:
- Email: ama@cmich.edu
- Website: Visit the contact page

## License

© 2025 American Marketing Association at Central Michigan University. All rights reserved.
