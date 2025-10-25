# Portfolio Website

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS. Features smooth animations, dark mode support, and a clean, professional design.

## Features

- 🎨 **Modern Design** - Clean, professional layout with smooth animations
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Optimized for all device sizes
- ⚡ **Fast** - Built with Next.js for optimal performance
- 🎯 **Accessible** - WCAG compliant with proper ARIA labels
- 🔧 **TypeScript** - Type-safe development experience
- 🎭 **Animations** - Smooth transitions using Framer Motion

## Sections

- **Hero** - Introduction with call-to-action buttons
- **About** - Skills showcase and experience timeline
- **Projects** - Interactive project gallery with filtering
- **Contact** - Contact form and social links

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd portfolio
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

### Personal Information

Update the following files with your information:

1. **Header.tsx** - Update social media links and contact information
2. **Hero.tsx** - Change name, title, and description
3. **About.tsx** - Update skills, experience, and personal values
4. **Projects.tsx** - Replace with your actual projects
5. **Contact.tsx** - Update contact details and social links
6. **layout.tsx** - Update metadata (title, description, etc.)

### Styling

The project uses Tailwind CSS for styling. You can customize:

- Colors in `tailwind.config.js`
- Global styles in `app/globals.css`
- Component-specific styles in individual component files

### Adding Projects

To add your projects, update the `projects` array in `components/Projects.tsx`:

```typescript
const projects = [
  {
    id: 1,
    title: "Your Project Name",
    description: "Project description",
    image: "/path/to/image.jpg",
    technologies: ["React", "TypeScript", "Tailwind"],
    category: "fullstack", // or 'frontend', 'backend', 'mobile'
    liveUrl: "https://your-project.com",
    githubUrl: "https://github.com/kodirov8788/project",
    featured: true, // or false
  },
];
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

The project can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Intersection Observer** - Scroll animations

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or need help customizing the portfolio, please open an issue on GitHub.
