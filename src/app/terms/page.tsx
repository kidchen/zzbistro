import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to ZZBistro</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            ZZBistro is a private family cooking companion application designed to help you manage recipes, 
            track ingredients, and discover what to cook next.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Acceptance of Terms</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            By accessing and using ZZBistro, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Use License</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This is a private family application. Access is restricted to authorized family members only.
            You agree to use this application responsibly for its intended purpose as a cooking companion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Privacy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your privacy is important to us. All recipe and ingredient data is stored securely and is only 
            accessible to authorized family members.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have any questions about these Terms of Service, please <Link href="/feedback" className="text-primary hover:underline">contact the application administrator</Link>.
          </p>
        </section>

        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
