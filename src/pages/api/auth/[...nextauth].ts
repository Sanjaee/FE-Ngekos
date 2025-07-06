// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { User } from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    backendUser?: any;
    backendPartner?: any;
    userType?: "user" | "partner";
  }
  interface Session {
    user: {
      id?: string;
      username?: string;
      profilePic?: string;
      backendUser?: any;
      backendPartner?: any;
      userType?: "user" | "partner";
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
      role?: string;
    };
    backendPartner?: {
      partnerId: string;
      username: string;
      email: string;
      profilePic?: string;
      phone?: string;
      businessName?: string;
      isVerified: boolean;
      subscriptionStatus: string;
      paidAmount: number;
      maxRooms: number;
    };
    userType?: "user" | "partner";
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
          // For now, we'll use a simple approach - always try partner first, then user
          // In a real implementation, you might want to use a custom provider or different approach
          let isPartnerSignIn = false;

          // Try partner sign-in first
          try {
            const partnerResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin-google-partner`,
              {
                googleId: account.providerAccountId,
                email: user.email,
                name: user.name,
                image: user.image,
              },
              {
                timeout: 5000,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (partnerResponse.data.success && partnerResponse.data.partner) {
              user.backendPartner = partnerResponse.data.partner;
              user.userType = "partner";
              return true;
            }
          } catch (partnerError) {
            // Partner sign-in failed, try user sign-in
            console.log("Partner sign-in failed, trying user sign-in");
          }

          // Try user sign-in as fallback
          const userResponse = await axios.post(
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

          if (userResponse.data.success && userResponse.data.user) {
            user.backendUser = userResponse.data.user;
            user.userType = "user";
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
        if (user.userType === "partner" && user.backendPartner) {
          token.backendPartner = user.backendPartner;
          token.userType = "partner";
        } else if (user.backendUser) {
          token.backendUser = user.backendUser;
          token.userType = "user";
        }

        // Generate JWT token from Express backend after successful Google login
        if (user.backendUser || user.backendPartner) {
          try {
            const userData = user.backendUser || user.backendPartner;
            const userType = user.userType;

            if (userData) {
              // Create a session in Express backend to get JWT token
              const sessionResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/create-session`,
                {
                  userId:
                    (userData as any).userId || (userData as any).partnerId,
                  email: userData.email,
                  userType: userType,
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
            if (token.userType === "partner" && verifyResponse.data.partner) {
              token.backendPartner = {
                ...verifyResponse.data.partner,
              };
            } else if (verifyResponse.data.user) {
              token.backendUser = {
                ...verifyResponse.data.user,
                bookings: verifyResponse.data.user.bookings || [],
                reviews: verifyResponse.data.user.reviews || [],
              };
            }
          } else {
            // Token expired, try to refresh
            if (token.backendUser || token.backendPartner) {
              try {
                const userData = token.backendUser || token.backendPartner;
                if (userData) {
                  const refreshResponse = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/create-session`,
                    {
                      userId:
                        (userData as any).userId || (userData as any).partnerId,
                      email: userData.email,
                      userType: token.userType,
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
                    } else if (refreshResponse.data.partner) {
                      token.backendPartner = {
                        ...token.backendPartner,
                        ...refreshResponse.data.partner,
                      };
                    }
                  }
                }
              } catch (refreshError) {
                console.error("Error refreshing JWT token:", refreshError);
                delete token.jwtToken;
                delete token.backendUser;
                delete token.backendPartner;
              }
            }
          }
        } catch (error) {
          console.error("Error verifying JWT token:", error);
          delete token.jwtToken;
          delete token.backendUser;
          delete token.backendPartner;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.backendPartner && session.user) {
        session.user.id = token.backendPartner.partnerId;
        session.user.username = token.backendPartner.username;
        session.user.profilePic = token.backendPartner.profilePic;
        session.user.phone = token.backendPartner.phone;
        session.user.backendPartner = {
          ...token.backendPartner,
        };
        session.user.userType = "partner";
        session.user.jwtToken = token.jwtToken;
      } else if (token.backendUser && session.user) {
        session.user.id = token.backendUser.userId;
        session.user.username = token.backendUser.username;
        session.user.profilePic = token.backendUser.profilePic;
        session.user.phone = token.backendUser.phone;
        session.user.backendUser = {
          ...token.backendUser,
        };
        session.user.bookings = token.backendUser.bookings || [];
        session.user.reviews = token.backendUser.reviews || [];
        session.user.userType = "user";
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
