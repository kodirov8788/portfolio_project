'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
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
  Lightbulb
} from 'lucide-react'

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const skills = [
    { name: 'Frontend', icon: Code2, level: 95, color: 'from-blue-500 to-blue-600' },
    { name: 'Backend', icon: Database, level: 90, color: 'from-green-500 to-green-600' },
    { name: 'Mobile', icon: Smartphone, level: 85, color: 'from-purple-500 to-purple-600' },
    { name: 'DevOps', icon: Globe, level: 80, color: 'from-orange-500 to-orange-600' },
    { name: 'Git', icon: GitBranch, level: 95, color: 'from-red-500 to-red-600' },
    { name: 'Security', icon: Shield, level: 75, color: 'from-yellow-500 to-yellow-600' },
  ]

  const values = [
    {
      icon: Coffee,
      title: 'Passion',
      description: 'I love what I do and bring enthusiasm to every project'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Great products are built by great teams working together'
    },
    {
      icon: Target,
      title: 'Quality',
      description: 'I focus on delivering clean, maintainable, and scalable code'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Always exploring new technologies and better ways to solve problems'
    }
  ]

  return (
    <section id="about" className="py-20 bg-white dark:bg-dark-900">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">About Me</span>
          </h2>
          <p className="text-xl text-dark-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            I'm a passionate full-stack developer with 5+ years of experience building 
            modern web applications. I love creating user-friendly interfaces and 
            robust backend systems that make a real difference.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold mb-8 text-dark-900 dark:text-white">
              Technical Skills
            </h3>
            <div className="space-y-6">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <skill.icon className="h-5 w-5 text-primary-600" />
                      <span className="font-medium text-dark-700 dark:text-gray-300">
                        {skill.name}
                      </span>
                    </div>
                    <span className="text-sm text-dark-500 dark:text-gray-400">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${skill.color}`}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${skill.level}%` } : {}}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
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
            <h3 className="text-3xl font-bold mb-8 text-dark-900 dark:text-white">
              My Values
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="p-6 bg-white dark:bg-dark-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <value.icon className="h-8 w-8 text-primary-600 mb-4" />
                  <h4 className="text-xl font-semibold mb-2 text-dark-900 dark:text-white">
                    {value.title}
                  </h4>
                  <p className="text-dark-600 dark:text-gray-300 text-sm">
                    {value.description}
                  </p>
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
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-dark-900 dark:text-white">
            Experience
          </h3>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  title: 'Senior Full-Stack Developer',
                  company: 'Tech Company Inc.',
                  period: '2022 - Present',
                  description: 'Leading development of scalable web applications using React, Node.js, and cloud technologies.',
                  technologies: ['React', 'Node.js', 'AWS', 'TypeScript', 'PostgreSQL']
                },
                {
                  title: 'Full-Stack Developer',
                  company: 'StartupXYZ',
                  period: '2020 - 2022',
                  description: 'Built and maintained multiple client projects, focusing on performance and user experience.',
                  technologies: ['Vue.js', 'Express.js', 'MongoDB', 'Docker', 'Redis']
                },
                {
                  title: 'Frontend Developer',
                  company: 'Digital Agency',
                  period: '2019 - 2020',
                  description: 'Created responsive web interfaces and collaborated with design teams to implement pixel-perfect UIs.',
                  technologies: ['React', 'Sass', 'Webpack', 'Figma', 'Jest']
                }
              ].map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="flex flex-col md:flex-row gap-6 p-6 bg-white dark:bg-dark-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="md:w-1/3">
                    <h4 className="text-xl font-semibold text-dark-900 dark:text-white mb-1">
                      {job.title}
                    </h4>
                    <p className="text-primary-600 font-medium mb-1">{job.company}</p>
                    <p className="text-sm text-dark-500 dark:text-gray-400">{job.period}</p>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-dark-600 dark:text-gray-300 mb-4">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full"
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