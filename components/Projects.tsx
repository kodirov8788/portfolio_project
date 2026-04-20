"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink, Github, Play, Database, Code, Globe, FileCode, Server } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const Projects = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [filter, setFilter] = useState("all");
  const { resolvedTheme } = useTheme();

  // Spotlight effect handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--x", `${x}%`);
    card.style.setProperty("--y", `${y}%`);
  };

  const projects = [
    {
      id: 1,
      title: "Firebase Blogs",
      description:
        "A full-stack blogging platform built with React and Firebase, featuring real-time updates, authentication, and content management.",
      image: "/projects/firebase-blogs.png",
      technologies: [
        "React",
        "Firebase",
        "JavaScript",
        "CSS",
        "HTML",
      ],
      category: "fullstack",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788/firebase-blogs",
      featured: true,
    },
    {
      id: 2,
      title: "Redux Project",
      description:
        "A React application demonstrating advanced Redux state management patterns, including async actions and middleware integration.",
      image: "/projects/redux-project.png",
      technologies: ["React", "Redux", "JavaScript", "CSS", "HTML"],
      category: "frontend",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788/redux-project",
      featured: true,
    },
    {
      id: 3,
      title: "React Lesson",
      description:
        "An educational React project showcasing fundamental concepts and best practices in modern React development.",
      image: "/projects/react-lesson.png",
      technologies: ["React", "JavaScript", "CSS", "HTML"],
      category: "frontend",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788/react-lesson",
      featured: false,
    },
    {
      id: 4,
      title: "Portfolio Website",
      description:
        "A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS, featuring dark mode and smooth animations.",
      image: "/projects/portfolio-website.png",
      technologies: [
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
        "React",
        "Framer Motion",
      ],
      category: "frontend",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788/kodirov8788",
      featured: false,
    },
    {
      id: 5,
      title: "Backend API Service",
      description:
        "A scalable REST API built with NestJS and Node.js, featuring authentication, WebSocket support, and MongoDB integration.",
      image: "/projects/backend-api-service.png",
      technologies: [
        "NestJS",
        "Node.js",
        "MongoDB",
        "TypeScript",
        "WebSocket",
        "Express.js",
      ],
      category: "backend",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788",
      featured: false,
    },
    {
      id: 6,
      title: "Ali's First Project",
      description:
        "A foundational web development project showcasing HTML, CSS, and JavaScript fundamentals with responsive design.",
      image: "/projects/first-web-project.png",
      technologies: ["HTML", "CSS", "JavaScript"],
      category: "frontend",
      liveUrl: undefined,
      githubUrl: "https://github.com/kodirov8788/Ali-s-first-project",
      featured: false,
    },
  ];

  const categories = [
    { id: "all", name: "All Projects" },
    { id: "fullstack", name: "Full Stack" },
    { id: "frontend", name: "Frontend" },
    { id: "backend", name: "Backend" },
    { id: "mobile", name: "Mobile" },
  ];

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((project) => project.category === filter);

  return (
    <section id="projects" className="py-24 bg-gray-50/50 dark:bg-[#060609] transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary-500 dark:text-primary-400 font-mono text-sm tracking-widest uppercase mb-4">What I&apos;ve built</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            <span className="gradient-text">My Projects</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Projects that showcase real-world skills across the full stack.
          </p>
        </motion.div>

        {/* Filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 font-mono border ${
                filter === category.id
                  ? "bg-gradient-to-r from-primary-600 to-cyan-600 text-white border-transparent shadow-lg shadow-primary-500/25"
                  : "bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-black/10 dark:hover:border-white/20"
              }`}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseMove={handleMouseMove}
              className={`group relative spotlight-card glass-card-hover overflow-hidden ${
                project.featured ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Project image */}
              <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-white/5">
                <div className="w-full h-full flex items-center justify-center relative">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                </div>

                {/* Overlay buttons */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="flex gap-3">
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="p-3 rounded-full bg-primary-600/90 dark:bg-primary-500/80 backdrop-blur-md transition-all duration-200 hover:scale-110 shadow-lg shadow-primary-500/20"
                        aria-label="View live demo">
                        <ExternalLink className="h-5 w-5 text-white" />
                      </a>
                    )}
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="p-3 rounded-full bg-primary-600/90 dark:bg-primary-500/80 backdrop-blur-md transition-all duration-200 hover:scale-110 shadow-lg shadow-primary-500/20"
                      aria-label="View source code">
                      <Github className="h-5 w-5 text-white" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Project content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-200">
                    {project.title}
                  </h3>
                  {project.featured && (
                    <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:bg-primary-500/20 dark:border-primary-500/40 dark:text-primary-300">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* GitHub Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <p className="text-primary-500 dark:text-primary-400 font-mono text-sm tracking-widest uppercase mb-3">Activity</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              <span className="gradient-text">GitHub Contributions</span>
            </h3>
          </div>
          <div className="glass-card p-6 overflow-hidden mb-6 bg-white dark:bg-white/[0.02]">
            <div className="flex justify-center items-center">
              <img
                src={`https://github-readme-activity-graph.vercel.app/graph?username=kodirov8788&theme=${resolvedTheme === 'dark' ? 'github-dark' : 'flat'}&hide_border=true&area=true&bg_color=${resolvedTheme === 'dark' ? '0a0a0f' : 'ffffff'}&color=7c3aed&line=06b6d4&point=a78bfa`}
                alt="GitHub Activity Graph"
                className="w-full max-w-6xl h-auto rounded-lg"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
          <div className="glass-card p-6 overflow-hidden bg-white dark:bg-white/[0.02]">
            <div className="flex justify-center flex-wrap gap-4">
              <img
                src={`https://github-readme-stats.vercel.app/api?username=kodirov8788&show_icons=true&theme=${resolvedTheme === 'dark' ? 'dark' : 'default'}&hide_border=true&bg_color=${resolvedTheme === 'dark' ? '0a0a0f' : 'ffffff'}&title_color=7c3aed&icon_color=06b6d4&text_color=${resolvedTheme === 'dark' ? '94a3b8' : '475569'}&count_private=true`}
                alt="GitHub Stats"
                className="w-full md:w-auto h-auto"
              />
              <img
                src={`https://github-readme-stats.vercel.app/api/top-langs/?username=kodirov8788&layout=compact&theme=${resolvedTheme === 'dark' ? 'dark' : 'default'}&hide_border=true&bg_color=${resolvedTheme === 'dark' ? '0a0a0f' : 'ffffff'}&title_color=7c3aed&text_color=${resolvedTheme === 'dark' ? '94a3b8' : '475569'}&hide=html`}
                alt="Top Languages"
                className="w-full md:w-auto h-auto"
              />
            </div>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">Want to see more of my work?</p>
          <a
            href="https://github.com/kodirov8788"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2 rounded-xl"
          >
            <Github className="h-5 w-5" />
            View All on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
