import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { JWT as DefaultJWT } from "next-auth/jwt";

interface JWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
}

export const authOptions = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.MS_CLIENT_ID!,
      clientSecret: process.env.MS_CLIENT_SECRET!,
      issuer: process.env.MS_ISSUER!,
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: { token: JWT; account?: any }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

// Handler NextAuth
const handler = NextAuth(authOptions);

// Export pour App Router
export { handler as GET, handler as POST };
