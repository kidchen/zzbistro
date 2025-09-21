# ZZBistro - Your Personal Cooking Companion 🍳

A modern Next.js web application designed as a private family cooking companion for managing recipes, tracking ingredients, and discovering what to cook next.

## Features

### 🔐 Authentication
- **Google OAuth Integration** - Secure sign-in with Google accounts
- **JWT Session Management** - Stateless authentication for reliable access
- **Private Family App** - Restricted access for authorized users only

### 🍽️ Recipe Management
- **Create & Edit Recipes** - Add detailed recipes with ingredients, instructions, and metadata
- **Recipe Categories** - Organize recipes by type, difficulty, and tags
- **Cooking Time & Servings** - Track preparation time, cooking time, and serving sizes
- **Image Support** - Add photos to your recipes

### 🥫 Ingredient Tracking
- **Pantry Management** - Keep track of ingredients you have in stock
- **Expiry Date Tracking** - Monitor ingredient freshness
- **Quantity & Units** - Track amounts and measurements
- **Category Organization** - Group ingredients by type

### 🎲 Smart Features
- **"I'm Feeling Lucky"** - Get random meal suggestions when you need inspiration
- **Menu Planning** - See what you can cook with current ingredients
- **Recipe Discovery** - Browse and filter your recipe collection

### 📱 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface with Tailwind CSS
- **Real-time Updates** - Instant synchronization across devices
- **Offline Fallback** - LocalStorage backup when offline

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React features

### Authentication
- **NextAuth.js v4** - Authentication library
- **Google OAuth Provider** - Social login integration
- **JWT Strategy** - Stateless session management

### Database & Storage
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Database-level access control
- **LocalStorage Fallback** - Offline data persistence

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Database Schema

### Users (NextAuth)
- Authentication and session management
- Google OAuth profile data

### Recipes
- Recipe details, ingredients, instructions
- Cooking metadata (time, servings, difficulty)
- Tags and categorization

### Ingredients
- Pantry inventory tracking
- Quantity, units, and categories
- Expiry date monitoring

## Environment Setup

### Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zzbistro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase and Google OAuth credentials

4. **Set up database**
   - Run the SQL scripts in your Supabase SQL Editor:
     - `setup-nextauth-tables.sql` - NextAuth authentication tables
     - `create-app-tables.sql` - Application data tables

5. **Configure Google OAuth**
   - Add authorized JavaScript origins: `http://localhost:3000`
   - Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Deployment

The app is configured for deployment on Vercel with automatic builds from the main branch.

### Production Environment Variables
- Update `NEXTAUTH_URL` to your production domain
- Add production Google OAuth redirect URIs
- Ensure Supabase environment variables are set

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── recipes/           # Recipe management
│   ├── ingredients/       # Ingredient tracking
│   ├── menu/              # Menu planning
│   ├── lucky/             # Random recipe suggestions
│   └── api/auth/          # NextAuth API routes
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── supabase.ts       # Supabase client
│   └── storage.ts        # Data layer abstraction
└── types/                # TypeScript type definitions
```

## Contributing

This is a private family application. For feature requests or bug reports, please create an issue in the repository.

## License

Private family project - All rights reserved.
