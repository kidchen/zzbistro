'use client';

import Link from 'next/link';

export default function FeedbackPage() {
  const githubIssuesUrl = 'https://github.com/kidchen/zzbistro/issues';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Feedback & Bug Reports 💬
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="text-6xl mb-4">🐛</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Found a bug or have a suggestion?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We&apos;d love to hear from you! Report issues or suggest new features on our GitHub repository.
          </p>
          
          <div className="space-y-4">
            <a
              href={githubIssuesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary transition-colors font-medium"
            >
              Open GitHub Issues 🚀
            </a>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What to include in your report:
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-300 space-y-2">
            <li>• 🐛 <strong>Bug reports:</strong> Steps to reproduce, expected vs actual behavior</li>
            <li>• 💡 <strong>Feature requests:</strong> Describe the feature and why it would be useful</li>
            <li>• 🔧 <strong>Improvements:</strong> Suggestions for existing features</li>
            <li>• 📱 <strong>Device info:</strong> Browser, device type if relevant</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-primary hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
