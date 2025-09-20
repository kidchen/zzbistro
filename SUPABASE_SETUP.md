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
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
```

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
2. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy your project

## 🔒 Security Notes

- The current setup allows public read/write access for simplicity
- For production use, consider implementing user authentication
- You can restrict access by modifying the Row Level Security policies

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