import './globals.css'
import Navbar from '@/components/Navbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className="h-full">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
        <Navbar />
        <main className="min-w-screen mx-auto px-0 py-0">
          {children}
        </main>
      </body>
    </html>
  )
}


