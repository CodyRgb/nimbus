import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
      {/* Header Section */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        {/* Website Logo/Brand Name */}
        <div className="text-xl font-bold text-blue-600">
          Telegram Cloud Storage
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Login Button */}
          <Link href="/pages/login" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium">
            Login
          </Link>
          {/* Register Button */}
          <Link href="/pages/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Unlimited Free Cloud Storage
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl">
          Store your files securely using Telegram's infrastructure
        </p>
        
        {/* Call-to-Action Button */}
        <Link href="/pages/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
          Get Started Free
        </Link>
        
        {/* Hero Image/Illustration Placeholder */}
        <div className="mt-16 w-full max-w-4xl h-64 md:h-96 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
          <span className="text-gray-400 dark:text-gray-500 text-lg">Hero Image / Illustration representing cloud storage</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature Card 1 */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-300 text-2xl">
              ☁️
            </div>
            <h3 className="text-xl font-bold mb-2">Unlimited Storage</h3>
            <p className="text-gray-600 dark:text-gray-400">Store as many files as you need without limits.</p>
          </div>

          {/* Feature Card 2 */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 text-green-600 dark:text-green-300 text-2xl">
              🔒
            </div>
            <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400">Your data is encrypted and safe with us.</p>
          </div>

          {/* Feature Card 3 */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 text-purple-600 dark:text-purple-300 text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-2">Fast Upload/Download</h3>
            <p className="text-gray-600 dark:text-gray-400">Lightning fast speeds for all your transfers.</p>
          </div>

          {/* Feature Card 4 */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 text-orange-600 dark:text-orange-300 text-2xl">
              📁
            </div>
            <h3 className="text-xl font-bold mb-2">Multiple File Types</h3>
            <p className="text-gray-600 dark:text-gray-400">Support for images, videos, docs, and archives.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Telegram Cloud Storage</span>
            <p className="text-sm text-gray-500 mt-2">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left">
            <div>
              <h4 className="font-semibold mb-2">Contact</h4>
              <p className="text-sm text-gray-500">support@example.com</p>
            </div>
            <div>
               {/* Social media links (optional) */}
               <h4 className="font-semibold mb-2">Follow Us</h4>
               <div className="flex space-x-4 justify-center md:justify-start">
                 <a href="#" className="text-gray-400 hover:text-blue-500">Twitter</a>
                 <a href="#" className="text-gray-400 hover:text-blue-700">LinkedIn</a>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
