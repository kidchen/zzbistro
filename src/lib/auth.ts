/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import GoogleProvider from 'next-auth/providers/google'

// Allowed email addresses for family access
const ALLOWED_EMAILS = ['zhch1990@gmail.com', 'victoria.zhaoup@gmail.com']

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: { email?: string | null } }) {
      // Check if email is in allowed list
      if (user.email && ALLOWED_EMAILS.includes(user.email)) {
        return true
      }

      return false // Deny access
    },
    // @ts-ignore
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).id = user.id
      }
      return token
    },
    // @ts-ignore
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect unauthorized users back to sign-in
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days (in seconds)
    updateAge: 24 * 60 * 60, // Extend session every 24 hours of activity
  },
  debug: process.env.NODE_ENV === 'development',
}
