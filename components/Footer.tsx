import { Code, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-dark-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Code className="h-6 w-6 text-primary-400" />
            <span className="text-lg font-semibold">Portfolio</span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-400 mb-2">
              Made with <Heart className="inline h-4 w-4 text-red-500" /> using Next.js & Tailwind CSS
            </p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Your Name. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer