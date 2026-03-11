"use client";

import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { compareDesc, format, parseISO } from 'date-fns'
import { Calendar, Tag, ChevronRight } from 'lucide-react'
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function BlogSection() {
  const posts = allPosts.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="blog" className="py-20 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Engineering <span className="gradient-text">Insights</span>
          </h2>
          <p className="text-xl text-dark-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Deep dives into backend architecture, AWS cost optimization, and technical leadership.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid gap-10">
          {posts.map((post, index) => (
            <motion.article 
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="group relative flex flex-col md:flex-row gap-8 p-6 md:p-8 rounded-2xl bg-white dark:bg-dark-900 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary-500" />
                    {format(parseISO(post.date), 'MMMM d, yyyy')}
                  </span>
                  {post.tags && (
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium border border-primary-100 dark:border-primary-800">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">
                  <Link href={post.url}>
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-dark-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>

                <Link 
                  href={post.url}
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:gap-3 transition-all underline-offset-4 hover:underline"
                >
                  Read Article <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              {post.image && (
                <div className="w-full md:w-64 h-48 md:h-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-800 flex-shrink-0 mt-4 md:mt-0">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
