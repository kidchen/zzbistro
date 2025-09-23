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
- **Image Support** - Add photos to your recipes with transparent logo processing

### 🥫 Ingredient Tracking
- **Pantry Management** - Keep track of ingredients you have in stock
- **Expiry Date Tracking** - Monitor ingredient freshness
- **Quantity & Units** - Track amounts and measurements
- **Category Organization** - Group ingredients by type
- **Batch Operations** - Update multiple ingredients efficiently

### 🎲 Smart Features
- **"I'm Feeling Lucky"** - Get random meal suggestions when you need inspiration
- **Menu Planning** - See what you can cook with current ingredients
- **Recipe Discovery** - Browse and filter your recipe collection
- **Smart Filtering** - Filter by cooking time, tags, and ingredient availability
- **Partial Recipe Matching** - Find recipes you can almost make (missing 1-3 ingredients)

### 🎨 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support** - Full dark/light theme with system preference detection
- **Modern UI** - Clean, intuitive interface with professional color palette
- **Expert Color System** - Carefully designed color scheme with proper contrast ratios
- **Real-time Updates** - Instant synchronization across devices
- **Offline Fallback** - LocalStorage backup when offline
- **Loading States** - Smooth transitions without content flashes

### 💬 Community Features
- **Feedback System** - Integrated GitHub Issues for bug reports and feature requests
- **Auto-redirect Feedback** - Streamlined feedback submission process
- **Help & Support** - Comprehensive help documentation
- **Privacy Policy** - Clear privacy and data usage policies

### ⚡ Performance Optimizations
- **Advanced Caching** - Multi-layer caching with TTL and stale-while-revalidate
- **Connection Pooling** - Optimized Supabase client configuration
- **Selective Loading** - Load only required fields for better performance
- **Batch Operations** - Efficient database operations with RPC fallback
- **Background Refresh** - Seamless data updates without blocking UI

## Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router and Turbopack
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework with custom color system
- **React 19.1** - Latest React features

### Authentication
- **NextAuth.js v4.24** - Authentication library
- **Google OAuth Provider** - Social login integration
- **JWT Strategy** - Stateless session management

### Database & Storage
- **Supabase 2.57** - PostgreSQL database with real-time features
- **Row Level Security** - Database-level access control
- **LocalStorage Fallback** - Offline data persistence
- **Advanced Caching Layer** - In-memory cache with TTL and background refresh

### Development Tools
- **ESLint 9** - Code linting and quality
- **TypeScript** - Static type checking
- **Turbopack** - Fast bundler for development and production

## Design System

### Color Palette
- **Primary** - #C63721 (Brand red for main actions)
- **Secondary** - #1A2F50 (Deep blue for secondary elements)
- **Tertiary** - #7B1B1C (Dark red for accents)
- **Accent** - #E2B210 (Gold for highlights and tags)
- **Success** - #16A34A (Green for positive actions)
- **Warning** - #F59E0B (Amber for warnings)
- **Error** - #DC2626 (Red for errors)

### Dark Mode
- Full dark mode implementation across all components
- System preference detection with manual toggle
- Proper contrast ratios for accessibility
- Consistent theming for all UI elements

## Database Schema

### Users (NextAuth)
- Authentication and session management
- Google OAuth profile data

### Recipes
- Recipe details, ingredients, instructions
- Cooking metadata (time, servings, difficulty)
- Tags and categorization
- Image support with optimized storage

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
   git clone https://github.com/kidchen/zzbistro.git
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
│   ├── feedback/          # GitHub Issues integration
│   ├── help/              # Help and support
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   └── api/auth/          # NextAuth API routes
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── supabase.ts       # Supabase client with optimizations
│   ├── storage.ts        # Data layer abstraction with caching
│   └── cache.ts          # Advanced caching system
├── styles/               # CSS and styling
│   └── colors.css        # Custom color system
└── types/                # TypeScript type definitions
```

## Performance Features

### Database Optimizations
- **Connection Pooling** - Optimized Supabase client configuration
- **Selective Field Loading** - Reduce payload size with targeted queries
- **Batch Operations** - Efficient multi-record updates with RPC fallback
- **Query Optimization** - Smart caching and background refresh

### Caching Strategy
- **Multi-layer Cache** - In-memory cache with localStorage fallback
- **TTL Management** - Automatic cache expiration (5-10 minutes)
- **Stale-while-revalidate** - Serve cached data while refreshing in background
- **Cache Statistics** - Monitor cache performance and hit rates

### Expected Performance Gains
- **~40% faster** list views with selective loading
- **~60% fewer** database calls with smart caching
- **~30% faster** batch operations
- **Better offline** experience with enhanced fallbacks

## Contributing

### Bug Reports & Feature Requests
- **GitHub Issues** - [Report bugs or request features](https://github.com/kidchen/zzbistro/issues)
- **Auto-redirect Feedback** - Use the in-app feedback system for quick reporting

### Issue Templates
We provide structured templates for:
- 🐛 **Bug Reports** - Help us fix issues quickly
- 💡 **Feature Requests** - Suggest new functionality
- ❓ **Questions** - Get help with the application

### Development
This is a private family application, but we welcome feedback and suggestions through our GitHub repository.

## Recent Updates

### Performance Enhancements (Latest)
- Advanced caching system with stale-while-revalidate
- Optimized Supabase client with connection pooling
- Selective field loading for faster list views
- Batch operations with RPC fallback for better efficiency

### User Experience Improvements
- Enhanced feedback system with auto-redirect
- Comprehensive help and support documentation
- Privacy policy and terms of service pages
- Improved mobile responsiveness and accessibility

### Technical Improvements
- Upgraded to Next.js 15.5.3 with Turbopack
- React 19.1 with latest features
- Tailwind CSS 4 for better performance
- Enhanced TypeScript configuration

## License

Private family project - All rights reserved.
