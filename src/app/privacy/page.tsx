import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Privacy Matters</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            ZZBistro is a private family cooking companion application. We are committed to protecting your privacy and ensuring your data remains secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            ZZBistro collects and stores the following information:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 mb-4">
            <li>Google account information (name, email, profile picture) for authentication</li>
            <li>Recipe data you create and manage</li>
            <li>Ingredient and pantry information you track</li>
            <li>Usage data to improve the application experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your information is used solely to:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 mb-4">
            <li>Provide and maintain the ZZBistro service</li>
            <li>Authenticate your access to the application</li>
            <li>Store and manage your recipes and ingredient data</li>
            <li>Improve the application&apos;s functionality and user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Security</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 mb-4">
            <li>Secure authentication through Google OAuth</li>
            <li>Encrypted data transmission</li>
            <li>Access restricted to authorized family members only</li>
            <li>Regular security updates and monitoring</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Sharing</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            As a private family application, we do not share your personal information with third parties. Your data is only accessible to authorized family members who have been granted access to the application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have any questions about this Privacy Policy or your data, please <Link href="/feedback" className="text-primary underline hover:no-underline">contact the application administrator</Link>.
          </p>
        </section>

        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
