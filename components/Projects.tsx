"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink, Github, Play, Database, Code, Globe, FileCode, Server } from "lucide-react";
import { useState } from "react";

const Projects = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [filter, setFilter] = useState("all");

  const projects = [
    {
      id: 1,
      title: "Firebase Blogs",
      description:
        "A full-stack blogging platform built with React and Firebase, featuring real-time updates, authentication, and content management.",
      gradient: "from-orange-400 via-orange-500 to-yellow-500",
      icon: Database,
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
      gradient: "from-purple-400 via-purple-500 to-pink-500",
      icon: Code,
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
      gradient: "from-blue-400 via-blue-500 to-cyan-500",
      icon: FileCode,
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
      gradient: "from-indigo-400 via-indigo-500 to-purple-500",
      icon: Globe,
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
      gradient: "from-green-400 via-green-500 to-emerald-500",
      icon: Server,
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
      gradient: "from-pink-400 via-pink-500 to-rose-500",
      icon: FileCode,
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
    <section id="projects" className="py-20 bg-gray-50 dark:bg-dark-800">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">My Projects</span>
          </h2>
          <p className="text-xl text-dark-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Here are some of my recent projects that showcase my skills and
            passion for development.
          </p>
        </motion.div>

        {/* Filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                filter === category.id
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-dark-700 text-dark-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900"
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
              className={`group relative bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                project.featured ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Project image */}
              <div className="relative h-48 overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${project.gradient} dark:opacity-90 flex items-center justify-center relative`}>
                  <project.icon className="h-20 w-20 text-white opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />

                {/* Overlay buttons */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex space-x-4">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-white dark:bg-dark-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        aria-label="View live demo"
                      >
                        <ExternalLink className="h-5 w-5 text-primary-600" />
                      </a>
                    )}
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white dark:bg-dark-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                      aria-label="View source code"
                    >
                      <Github className="h-5 w-5 text-primary-600" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Project content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors duration-200">
                    {project.title}
                  </h3>
                  {project.featured && (
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-dark-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-dark-600 dark:text-gray-300 text-xs rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-dark-600 dark:text-gray-300 mb-6">
            Want to see more of my work?
          </p>
          <a
            href="https://github.com/kodirov8788"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2"
          >
            <Github className="h-5 w-5" />
            <span>View All Projects on GitHub</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
