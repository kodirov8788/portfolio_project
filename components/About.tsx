'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useEffect, useRef, useState } from 'react'
import {
  Code2,
  Database,
  Smartphone,
  Globe,
  GitBranch,
  Shield,
  Coffee,
  Users,
  Target,
  Lightbulb,
  MapPin,
  Calendar,
  Briefcase,
} from 'lucide-react'

/* ─── CountUp ─────────────────────────────────────────── */
const CountUp = ({ to, duration = 1.5, suffix = '' }: { to: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = to / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [started, to, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── About ───────────────────────────────────────────── */
const About = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 })

  const skills = [
    { name: 'Frontend',  icon: Code2,      level: 95, color: 'from-violet-500 to-purple-600' },
    { name: 'Backend',   icon: Database,   level: 90, color: 'from-cyan-500 to-blue-600' },
    { name: 'Mobile',    icon: Smartphone, level: 85, color: 'from-purple-500 to-violet-600' },
    { name: 'DevOps',    icon: Globe,      level: 80, color: 'from-cyan-400 to-teal-600' },
    { name: 'Git',       icon: GitBranch,  level: 95, color: 'from-violet-400 to-cyan-500' },
    { name: 'Security',  icon: Shield,     level: 75, color: 'from-purple-400 to-violet-500' },
  ]

  const values = [
    { icon: Coffee,    title: 'Passion',       description: 'Enthusiasm in every project, every line of code.' },
    { icon: Users,     title: 'Collaboration', description: 'Great products need great teams working as one.' },
    { icon: Target,    title: 'Quality',       description: 'Clean, maintainable, scalable code — no shortcuts.' },
    { icon: Lightbulb, title: 'Innovation',    description: 'Always exploring better ways to solve hard problems.' },
  ]

  const stats = [
    { value: 5,  suffix: '+', label: 'Years Experience' },
    { value: 20, suffix: '+', label: 'Projects Built' },
    { value: 3,  suffix: '',  label: 'Countries Worked' },
    { value: 10, suffix: '+', label: 'Tech Stack' },
  ]

  const jobs = [
    {
      title: 'Software Engineer / Tech Lead',
      company: 'Quin Que Inc.',
      type: 'Full-time',
      period: 'Jan 2025 – Present',
      location: 'Kobe, Japan · On-site',
      description: 'Tech Lead at Quinque building high-quality web & mobile products. Focus on backend architecture, reliability, and engineering leadership.',
      responsibilities: [
        'Building and maintaining servers, databases, and core systems.',
        'Making architectural decisions and guiding the dev process.',
        'Mentoring team members and reviewing code for quality.',
        'Optimizing performance and ensuring smooth user experience.',
      ],
      technologies: ['NestJS', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    },
    {
      title: 'Back-end Developer',
      company: 'Navana Inc.',
      type: 'Part-time',
      period: 'Jan 2024 – Jan 2025',
      location: 'Tashkent, Uzbekistan · Remote',
      description: 'Backend Developer & CI/CD Specialist focused on intuitive, accessible software at scale.',
      responsibilities: [
        'Managing backend development and CI/CD pipelines.',
        'Ensuring app reliability and accessibility for all users.',
        'Solving complex problems with clear, efficient solutions.',
      ],
      technologies: ['NestJS', 'MongoDB', 'Socket.io', 'AWS', 'Swagger', 'Mocha'],
    },
    {
      title: 'Web Developer',
      company: 'Binary Freelance',
      type: 'Freelance',
      period: 'Mar 2023 – Dec 2023',
      location: 'Tashkent, Uzbekistan · Remote',
      description: 'Developed responsive, user-friendly web apps using modern frameworks. Delivered high-quality code through cross-functional collaboration.',
      responsibilities: [
        'Built responsive React apps integrated with backend APIs.',
        'Conducted code reviews, testing, and debugging.',
        'Mentored junior developers as needed.',
      ],
      technologies: ['React.js', 'JavaScript', 'Tailwind CSS', 'SQL', 'NoSQL'],
    },
    {
      title: 'Web Developer',
      company: '"Algoritm" Learning Center',
      type: 'Part-time',
      period: 'May 2021 – Dec 2023',
      location: 'Namangan, Uzbekistan · On-site',
      description: 'Led a team building 20+ educational tools, doubling student usage and making Algorithm a top coding learning center.',
      responsibilities: [
        'Built 20+ projects for student learning.',
        'Created data systems with Node.js and NestJS.',
        'Doubled the number of active student users.',
      ],
      technologies: ['React.js', 'NestJS', 'Node.js', 'Redis', 'MongoDB'],
    },
    {
      title: 'Customer Service Manager',
      company: 'Phobos in Japan',
      type: 'Full-time',
      period: 'May 2017 – Dec 2019',
      location: 'Tokyo, Japan · Hybrid',
      description: 'Employment support specialist for the Uzbek community in Japan — bridging culture, language, and professional integration.',
      responsibilities: [
        'Developed guides on Japanese employment laws for Uzbek speakers.',
        'Built partnerships with local businesses for job placement.',
        'Led a culturally competent customer service team.',
      ],
      technologies: ['Communication', 'Leadership', 'Management', 'English', 'Japanese'],
    },
  ]

  return (
    <section id="about" className="py-24 bg-transparent transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-primary-500 dark:text-primary-400 font-mono text-sm tracking-widest uppercase mb-4">Who I am</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            <span className="gradient-text">About Me</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Full-stack developer with 5+ years building modern web apps across Japan and Central Asia.
            Passionate about clean architecture, performance, and developer experience.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-4xl font-bold gradient-text mb-1">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Skills + Values */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Technical Skills</h3>
            <div className="space-y-5">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
                        <skill.icon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{skill.name}</span>
                    </div>
                    <span className="text-sm font-mono text-primary-500 dark:text-primary-400">{skill.level}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 bg-gray-100 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${skill.level}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">My Values</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="glass-card-hover p-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 dark:bg-primary-500/15 dark:border-primary-500/30 flex items-center justify-center mb-4 text-primary-500 dark:text-primary-400">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{value.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Experience Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center mb-12">
            <p className="text-primary-500 dark:text-primary-400 font-mono text-sm tracking-widest uppercase mb-3">My journey</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Experience</h3>
          </div>

          <div className="max-w-4xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500 via-cyan-500 to-transparent" />

            <div className="space-y-6">
              {jobs.map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="relative pl-6 md:pl-20"
                >
                  {/* Dot */}
                  <div className="absolute left-[-4px] md:left-[28px] top-6 w-3 h-3 rounded-full border-2 border-primary-500 bg-white dark:bg-[#0a0a0f] shadow-[0_0_8px_rgba(124,58,237,0.8)]" />

                  <div className="glass-card-hover p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Briefcase className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">{job.company}</span>
                          <span className="text-gray-600 text-xs">·</span>
                          <span className="text-gray-500 text-xs">{job.type}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-mono">
                          <Calendar className="h-3 w-3" />
                          {job.period}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{job.description}</p>

                    <ul className="space-y-1.5 mb-4">
                      {job.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
                          <span className="text-primary-500 mt-1 text-xs">▸</span>
                          {r}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {job.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 text-xs rounded-lg font-mono bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300 dark:bg-primary-500/20 dark:border-primary-500/40"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
