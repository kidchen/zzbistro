# ZZBistro Supabase Setup Guide

## 🚀 Setting up Supabase for ZZBistro

### Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your ZZBistro project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 2: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important Notes:**
- Get the **Service Role Key** from Supabase Dashboard → Settings → API (keep this secret!)
- Generate a random **NEXTAUTH_SECRET** (you can use: `openssl rand -base64 32`)
- Set up Google OAuth credentials (see Step 2.1 below)

### Step 2.1: Set Up Google OAuth (Required for Authentication)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** to your `.env.local`

### Step 3: Create Database Tables

1. In your Supabase Dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to create all tables, indexes, and policies

### Step 4: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`
3. Try adding a recipe or ingredient
4. Check your Supabase Dashboard → **Table Editor** to see if data appears

### Step 5: Deploy to Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add all environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL` (set to your production URL: `https://your-domain.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Update your Google OAuth redirect URI to include your production domain
4. Redeploy your project

## 🔒 Security Features

✅ **Google OAuth Authentication** - Only authorized users can access the app
✅ **NextAuth.js Integration** - Secure session management
✅ **Row Level Security** - Database-level access control
✅ **Private Family App** - Only you and your wife can access your data

### Managing Access

To add or remove users:
1. Users sign in with their Google account
2. Check the `users` table in Supabase to see who has signed up
3. You can manually remove users from the database if needed
4. Consider adding an admin panel later for user management

## 🎯 Features Enabled

✅ **Real-time sync** - Changes appear instantly on both devices
✅ **Offline support** - localStorage fallback when offline
✅ **Data persistence** - Your recipes and ingredients are safely stored
✅ **Multi-device access** - You and your wife can use any device

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Check your environment variables are correct
- Ensure your Supabase project is active
- Verify the database tables were created successfully

### Data not syncing
- Check the browser console for error messages
- Verify your Supabase project has the correct RLS policies
- Make sure both devices are connected to the internet

### Need help?
- Check the Supabase logs in your dashboard
- Verify the SQL schema was applied correctly
- Test the connection using the Supabase API directly

## 🎉 You're All Set!

Once configured, you and your wife can:
- Add recipes from any device
- Update your pantry inventory
- See real-time changes across all devices
- Use the app offline (with sync when back online)

Happy cooking! 👨‍🍳👩‍🍳