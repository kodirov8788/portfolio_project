# Portfolio Website

A modern, full-stack portfolio website built with Next.js, TypeScript, Supabase, and Tailwind CSS. Features a complete content management system, blog, project showcase, and contact management.

## Features

### 🎨 **Modern Design**

- Clean, responsive design with Tailwind CSS
- Professional UI components
- Mobile-first approach
- Smooth animations and transitions

### 📝 **Content Management**

- Blog system with categories and tags
- Project portfolio with detailed case studies
- Rich text editor for content creation
- Image optimization and management

### 🔐 **User Management**

- Role-based access control (Admin, Editor, Viewer)
- User authentication with Supabase Auth
- Profile management
- Session tracking

### 📊 **Analytics & Engagement**

- Page view tracking
- Reading time calculation
- Popular content analytics
- Search functionality

### 💬 **Interactive Features**

- Contact form with validation
- Newsletter subscription
- Social media integration
- File upload capabilities

### 🛠 **Admin Dashboard**

- Content statistics
- Contact message management
- SEO performance tracking
- User management

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Custom components with Headless UI
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Rich Text**: TipTap editor
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd portfolio_project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new Supabase project
   - Run the SQL schema from `database-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key

4. **Environment variables**

   ```bash
   cp env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The project includes a comprehensive database schema with:

- **User Management**: Roles, profiles, sessions
- **Blog System**: Posts, categories, tags, comments
- **Projects**: Portfolio items with skills and collaborators
- **Contact Management**: Messages, categories, status tracking
- **Analytics**: Event tracking and engagement metrics
- **Media Library**: File uploads and management

## Project Structure

```
portfolio_project/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (admin)/           # Admin routes (protected)
│   │   ├── blog/              # Blog pages
│   │   ├── projects/          # Project pages
│   │   ├── contact/           # Contact page
│   │   └── about/             # About page
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── blog/             # Blog-specific components
│   │   └── projects/         # Project-specific components
│   ├── lib/                  # Utility functions
│   │   ├── supabase/         # Supabase client config
│   │   ├── utils/            # Helper functions
│   │   └── validations/      # Zod schemas
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── database-schema.sql       # Complete database schema
```

## Key Components

### UI Components

- `Button`: Versatile button with variants
- `Input`: Form input with validation states
- `Card`: Content containers
- `Navigation`: Responsive navigation bar

### Forms

- `ContactForm`: Contact form with Supabase integration
- Form validation with Zod schemas
- Error handling and success states

### Pages

- **Home**: Hero section, services, featured projects
- **About**: Personal story, skills, experience
- **Projects**: Project showcase with filtering
- **Blog**: Blog posts with categories
- **Contact**: Contact form and information

## Deployment

### Vercel (Recommended)

1. **Connect your repository**

   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Environment variables**

   - Add your Supabase environment variables in Vercel dashboard

3. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Customization

### Styling

- Modify `tailwind.config.ts` for theme customization
- Update `src/app/globals.css` for global styles
- Component styles are in their respective files

### Content

- Update personal information in pages
- Modify skills and experience in About page
- Add your own projects and blog posts

### Database

- Customize the schema in `database-schema.sql`
- Add new tables or modify existing ones
- Update TypeScript types accordingly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code comments

## Roadmap

- [ ] Dark mode support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Advanced search functionality
- [ ] Performance optimizations
- [ ] PWA features
- [ ] Advanced admin features

---

Built with ❤️ using Next.js, TypeScript, and Supabase
