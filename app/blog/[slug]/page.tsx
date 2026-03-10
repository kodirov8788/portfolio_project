import { notFound } from 'next/navigation'
import { allPosts } from 'contentlayer/generated'
import { useMDXComponent } from 'next-contentlayer/hooks'
import { format, parseISO } from 'date-fns'
import { Calendar, Tag, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = allPosts.find((p) => p.slug === params.slug)
  if (!post) return {}
  return { 
    title: `${post.title} - ${siteConfig.name}`,
    description: post.summary
  }
}

const mdxComponents = {
  // Add custom components here (e.g., Mermaid, CodeBlocks, Callouts)
  h1: (props: any) => <h1 className="text-3xl font-bold mt-8 mb-4 lg:text-4xl" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-8 mb-4 lg:text-3xl" {...props} />,
  p: (props: any) => <p className="leading-relaxed mb-6" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-6 space-y-2" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = allPosts.find((p) => p.slug === params.slug)

  if (!post) notFound()

  const MDXContent = useMDXComponent(post.body.code)

  return (
    <article className="max-w-4xl mx-auto px-6 py-20">
      <Link 
        href="/blog"
        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium mb-12 hover:gap-3 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Back to insights
      </Link>

      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-gray-400 mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary-500" />
            {format(parseISO(post.date), 'MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary-500" />
            5 min read
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

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-dark-900 dark:text-white leading-tight mb-8">
          {post.title}
        </h1>
        
        {post.image && (
          <div className="rounded-2xl overflow-hidden shadow-2xl mb-12 bg-gray-100 dark:bg-dark-800 aspect-video">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-dark-900 dark:prose-headings:text-white prose-a:text-primary-600 prose-strong:text-dark-900 dark:prose-strong:text-white prose-img:rounded-2xl">
        <MDXContent components={mdxComponents} />
      </div>

      <footer className="mt-20 pt-10 border-t border-gray-100 dark:border-dark-700">
        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-dark-800 text-center">
          <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-3">
            Was this helpful?
          </h3>
          <p className="text-dark-600 dark:text-gray-400 mb-6">
            I regularly share insights on technical leadership and backend performance on LinkedIn.
          </p>
          <a 
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
          >
            Connect on LinkedIn
          </a>
        </div>
      </footer>
    </article>
  )
}
