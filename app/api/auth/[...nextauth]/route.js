import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import mongoose from 'mongoose';
import User from '@/models/user'; // Ensure `User` is imported correctly
import connectDb from '@/db/connectDb'; // Ensure your `connectDb` function is correct

// NextAuth configuration
export const authoptions = NextAuth({
  providers: [
    // GitHub authentication provider
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  callbacks: {
    // Handle sign-in
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (account.provider === 'github') {
          // Connect to the database
          await connectDb('mongodb://localhost:27017/saffron');

          // Check if the user already exists in the database
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create a new user
            await User.create({
              email: user.email,
              username: user.email.split('@')[0],
            });
          }

          return true; // Allow sign-in
        }
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false; // Prevent sign-in on error
      }
    },

    // Customize session
    async session({ session, token }) {
      try {
        // Connect to the database
        await connectDb('mongodb://localhost:27017/saffron');

        // Fetch user from the database
        const dbUser = await User.findOne({ email: session.user.email });

        if (dbUser) {
          session.user.name = dbUser.username; // Attach username to the session
        }

        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session; // Return the session even if there’s an error
      }
    },
  },

  // Enable debugging (optional for development)
  debug: true,

  // Optional: specify session strategy
  session: {
    strategy: 'jwt', // Use JWT instead of default database-based sessions
  },

  // Configure pages (optional)
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
});

// Export the configuration for Next.js API routes
export { authoptions as GET, authoptions as POST };
