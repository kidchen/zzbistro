export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Help & Support</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            ZZBistro is your personal family cooking companion. Here&apos;s how to get started:
          </p>
          <ul className="text-gray-700 dark:text-gray-300 mb-4">
            <li>Add your favorite recipes to build your collection</li>
            <li>Track ingredients in your pantry with expiry dates</li>
            <li>Use the &quot;I&apos;m Feeling Lucky&quot; feature for meal inspiration</li>
            <li>Plan your menu based on available ingredients</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Recipe Management</h3>
              <p className="text-gray-700 dark:text-gray-300">Create, edit, and organize your recipes with ingredients, instructions, and photos.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pantry Tracking</h3>
              <p className="text-gray-700 dark:text-gray-300">Keep track of ingredients, quantities, and expiry dates to reduce food waste.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Menu Planning</h3>
              <p className="text-gray-700 dark:text-gray-300">Discover what you can cook with your current ingredients.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Random Suggestions</h3>
              <p className="text-gray-700 dark:text-gray-300">Get inspired with random recipe suggestions when you can&apos;t decide what to cook.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Need More Help?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you need additional assistance, please contact the application administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
