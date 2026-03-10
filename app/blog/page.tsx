import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { compareDesc, format, parseISO } from 'date-fns'
import { Calendar, Tag, ChevronRight } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Blog - ${siteConfig.name}`,
  description: siteConfig.description,
}

export default function BlogPage() {
  const posts = allPosts.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-16 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-dark-900 dark:text-white mb-4">
          Engineering <span className="text-primary-600">Insights</span>
        </h1>
        <p className="text-lg text-dark-600 dark:text-gray-400 max-w-2xl">
          Deep dives into backend architecture, AWS cost optimization, and technical leadership.
        </p>
      </div>

      <div className="grid gap-10">
        {posts.map((post) => (
          <article 
            key={post._id}
            className="group relative flex flex-col md:flex-row gap-8 p-6 rounded-2xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-xl transition-all duration-300"
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
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">
                <Link href={post.url}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-dark-600 dark:text-gray-400 mb-6 line-clamp-2">
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
              <div className="hidden md:block w-48 h-32 rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-dark-700">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
