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
                  title: 'Software Engineer / Tech Lead',
                  company: 'Quin Que Inc. · Full-time',
                  period: 'Jan 2025 - Present · 11 mos',
                  location: 'Kobe, Hyogo, Japan · On-site',
                  description: 'Software Engineer / Tech Lead at Quinque, a Japanese company creating high-quality websites and mobile applications. Focus on backend development—building and maintaining servers, databases, and core systems for reliability and efficiency.',
                  responsibilities: [
                    'Building and maintaining servers, databases, and core systems that ensure everything runs reliably and efficiently.',
                    'Guiding development processes and making architectural decisions as a Tech Lead.',
                    'Supporting the team in delivering clean, scalable solutions.',
                    'Solving complex problems and optimizing performance.',
                    'Ensuring a smooth user experience for every user.',
                    'Collaborating with a talented, creative team to build useful and enjoyable digital products.',
                    'Contributing to a company that values quality, continuous learning, growth, leadership, and innovation.'
                  ],
                  technologies: ['Back-End Web Development', 'Server Programming']
                },
                {
                  title: 'Back-end Developer',
                  company: 'Navana Inc. · Part-time',
                  period: 'Jan 2024 - Jan 2025 · 1 yr 1 mo',
                  location: 'Tashkent, Uzbekistan · Remote',
                  description: 'Backend Developer & CI/CD Specialist dedicated to enhancing user experiences through the development of simple, intuitive software. Ensuring applications remain accessible, reliable, and straightforward for all users.',
                  responsibilities: [
                    'Enhancing user experiences through the development of simple, intuitive software.',
                    'Managing backend development and continuous integration/continuous deployment (CI/CD) processes.',
                    'Ensuring applications remain accessible, reliable, and straightforward for all users.',
                    'Solving complex problems with clear and efficient solutions.',
                    'Contributing to the mission of making technology easy and enjoyable for everyone.'
                  ],
                  technologies: ['Web Application Development', 'NestJS', 'Server Programming', 'Test Planning', 'Web Service Development', 'CD/CI (CI/CD)', 'DevOps', 'Databases', 'Socket.io', 'Web Services', 'Design Documents', 'GitFlow', 'Competitive Programming', 'Back-End Web Development', 'MongoDB', 'Server Side Programming', 'Back-end Operations', 'Amazon Web Services (AWS)', 'Mocha', 'Swagger API']
                },
                {
                  title: 'Web Developer',
                  company: 'Binary Freelance',
                  period: 'March 2023 - December 2023 · 10 mos',
                  location: 'Tashkent, Uzbekistan · Remote',
                  description: 'Developed and maintained responsive, user-friendly web applications using modern frontend frameworks. Collaborated with cross-functional teams to deliver exceptional user experiences.',
                  responsibilities: [
                    'Developing and maintaining responsive, user-friendly web applications using modern frontend frameworks such as Javascript and React.',
                    'Collaborating with designers, product managers, and backend developers to ensure seamless integration between frontend and backend systems.',
                    'Conducting code reviews, testing, and debugging to ensure high-quality, bug-free code.',
                    'Staying up-to-date with emerging trends and technologies in frontend development and contributing to the company\'s technical knowledge base.',
                    'Ensuring that web applications meet the company\'s accessibility, security, and performance standards.',
                    'Providing technical guidance and mentorship to junior frontend developers, as needed.',
                    'Working closely with other developers, designers, and product managers to deliver exceptional user experiences.'
                  ],
                  technologies: ['React.js', 'Redis', 'JavaScript', 'Tailwind CSS', 'Databases', 'Version Control', 'Competitive Programming', 'SQL', 'HTML', 'Cascading Style Sheets (CSS)', 'NoSQL', 'Code Review', 'Mocha', 'Data Structures', 'ECMAScript']
                },
                {
                  title: 'Web Developer',
                  company: '"Algoritm" Learning Center · Part-time',
                  period: 'May 2021 - Dec 2023 · 2 yrs 8 mos',
                  location: 'Namangan Region, Uzbekistan · On-site',
                  description: 'Led a team in creating educational websites and tools at Algorithm. Built over 20 projects that make learning easier and more fun for students, resulting in doubled student usage and improved performance.',
                  responsibilities: [
                    'Led a team in creating educational websites and tools at Algorithm.',
                    'Built over 20 projects that make learning easier and more fun for students.',
                    'Developed responsive websites using React.js that respond to students\' actions.',
                    'Created data management systems using Node.js and NestJS.',
                    'Improved student performance significantly, doubling the number of students using our tools.',
                    'Made Algorithm Education Center a top choice for learning coding.'
                  ],
                  technologies: ['React.js', 'Redis', 'JavaScript', 'NestJS', 'Databases', 'Version Control', 'Competitive Programming', 'Node.js', 'NoSQL', 'Code Review', 'Mocha', 'Data Structures', 'ECMAScript']
                },
                {
                  title: 'Customer Service Manager',
                  company: 'Phobos in Japan · Full-time',
                  period: 'May 2017 - Dec 2019 · 2 yrs 8 mos',
                  location: 'Tokyo, Japan · Hybrid',
                  description: 'Customer Service Manager at Phobos Japan: Specializing in Employment Support for the Uzbek Community.',
                  responsibilities: [
                    'Developing comprehensive guides and resources tailored to the Uzbek community in Japan, outlining local employment laws, cultural norms in the workplace, and language support services.',
                    'Collaborating with local businesses to identify job opportunities suitable for Uzbek speakers, ensuring a match between employers\' needs and the skills of job seekers.',
                    'Leading a team of customer service representatives trained in cultural competency to provide personalized support to clients, improving their job search and application processes.',
                    'Initiating and maintaining partnerships with Uzbek cultural associations and community groups to reach a broader audience and understand the community\'s evolving needs.',
                    'Implementing feedback mechanisms to gauge client satisfaction and the effectiveness of the services provided, using the insights gained to improve service delivery continually.',
                    'Leveraging communication and research skills, along with a deep understanding of both Japanese business culture and the needs of the Uzbek community, to facilitate effective and supportive job placement.'
                  ],
                  technologies: ['Research', 'Communication', 'Teamwork', 'Management', 'Leadership', 'English']
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
                    {job.location && (
                      <p className="text-sm text-dark-500 dark:text-gray-400 mt-1">
                        {job.location}
                      </p>
                    )}
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-dark-600 dark:text-gray-300 mb-4">
                      {job.description}
                    </p>
                    {job.responsibilities && (
                      <ul className="list-disc list-inside space-y-2 mb-4 text-dark-600 dark:text-gray-300 text-sm">
                        {job.responsibilities.map((responsibility, idx) => (
                          <li key={idx}>{responsibility}</li>
                        ))}
                      </ul>
                    )}
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