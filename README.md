# Portfolio Project

Personal portfolio and technical writing platform for presenting production work, case studies, and engineering thinking in a recruiter-friendly format.

**Live site:** https://www.muhammadali.pro

## What This Project Shows
- Production-oriented personal branding with SEO-friendly routing
- Content-driven pages for projects, writing, and long-form explanations
- Motion and visual polish without turning the site into a heavy client-side app

## Why This Stack / Tooling
- **Next.js** was chosen for SSR, clean routing, and strong SEO for portfolio pages that need to be discoverable.
- **Contentlayer + MDX** make project posts and technical writing maintainable as content, not hard-coded React pages.
- **Tailwind CSS** keeps iteration fast while preserving a consistent design system.
- **Framer Motion** is used selectively to improve perceived quality and page transitions without overbuilding animation.

## Stack
- Next.js 14
- React 18
- TypeScript
- Contentlayer + MDX
- Tailwind CSS
- Framer Motion

## Key Features
- Project showcase pages with structured content
- MDX-powered technical writing workflow
- Responsive layout for desktop and mobile
- Deployable as a fast static/SSR hybrid site

## Project Structure
- `app/`: route-level UI and page composition
- `components/`: reusable presentation components
- `content/`: MDX content for writing and portfolio entries
- `config/`: navigation and site configuration

## Getting Started
```bash
npm install
npm run dev
```

## Why It Matters For Hiring
This repository is the front door for the rest of the portfolio. It is designed to explain not only what was built, but also how engineering decisions are communicated to recruiters, hiring managers, and technical peers.
