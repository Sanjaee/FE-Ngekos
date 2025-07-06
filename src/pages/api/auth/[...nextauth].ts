// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { User } from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    backendUser?: any;
  }
  interface Session {
    user: {
      id?: string;
      username?: string;
      profilePic?: string;
      backendUser?: any;
      bookings?: any[];
      reviews?: any[];
      phone?: string;
      jwtToken?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendUser?: {
      userId: string;
      username: string;
      email: string;
      profilePic?: string;
      phone?: string;
      bookings?: any[];
      reviews?: any[];
    };
    jwtToken?: string;
  }
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false;

      if (account.provider === "google") {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin-google`,
            {
              googleId: account.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            {
              timeout: 10000,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.success && response.data.user) {
            user.backendUser = response.data.user;
            return true;
          } else {
            console.error("Backend did not return success or user data");
            return false;
          }
        } catch (error) {
          console.error("Error signing in with backend:", error);
          if (axios.isAxiosError(error)) {
            console.error("Axios error details:", {
              message: error.message,
              code: error.code,
              response: error.response?.data,
              status: error.response?.status,
            });
          }
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        // Simpan data dari signin-google langsung
        token.backendUser = user.backendUser;

        // Generate JWT token from Express backend after successful Google login
        if (user.backendUser) {
          try {
            // Create a session in Express backend to get JWT token
            const sessionResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/create-session`,
              {
                userId: user.backendUser.userId,
                email: user.backendUser.email,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (sessionResponse.data.success && sessionResponse.data.token) {
              token.jwtToken = sessionResponse.data.token;
            }
          } catch (error) {
            console.error("Error generating JWT token:", error);
          }
        }
      }

      // Verify and refresh JWT token if needed
      if (token.jwtToken) {
        try {
          const verifyResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`,
            {
              token: token.jwtToken,
            }
          );

          if (verifyResponse.data.valid) {
            // Update dengan data terbaru dari database
            token.backendUser = {
              ...verifyResponse.data.user,
              bookings: verifyResponse.data.user.bookings || [],
              reviews: verifyResponse.data.user.reviews || [],
            };
          } else {
            // Token expired, try to refresh
            if (token.backendUser) {
              try {
                const refreshResponse = await axios.post(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/create-session`,
                  {
                    userId: token.backendUser.userId,
                    email: token.backendUser.email,
                  }
                );

                if (
                  refreshResponse.data.success &&
                  refreshResponse.data.token
                ) {
                  token.jwtToken = refreshResponse.data.token;
                  // Update dengan data terbaru dari database
                  if (refreshResponse.data.user) {
                    token.backendUser = {
                      ...token.backendUser,
                      ...refreshResponse.data.user,
                    };
                  }
                }
              } catch (refreshError) {
                console.error("Error refreshing JWT token:", refreshError);
                delete token.jwtToken;
                delete token.backendUser;
              }
            }
          }
        } catch (error) {
          console.error("Error verifying JWT token:", error);
          delete token.jwtToken;
          delete token.backendUser;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.backendUser && session.user) {
        session.user.id = token.backendUser.userId;
        session.user.username = token.backendUser.username;
        session.user.profilePic = token.backendUser.profilePic;
        session.user.phone = token.backendUser.phone;
        session.user.backendUser = {
          ...token.backendUser,
        };
        session.user.bookings = token.backendUser.bookings || [];
        session.user.reviews = token.backendUser.reviews || [];
        session.user.jwtToken = token.jwtToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});
