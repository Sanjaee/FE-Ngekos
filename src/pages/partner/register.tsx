import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function PartnerRegister() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    businessName: "",
  });
  const hasRefreshedSession = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Redirect to partner login if not authenticated
      router.push("/partner/login");
      return;
    }

    console.log("Register page - Session data:", {
      userType: session.user?.userType,
      isVerified: session.user?.backendPartner?.isVerified,
      phone: session.user?.backendPartner?.phone,
      username: session.user?.backendPartner?.username,
      backendPartner: session.user?.backendPartner,
    });

    // If user is not a partner, redirect to partner login
    if (session.user?.userType !== "partner") {
      router.push("/partner/login");
      return;
    }

    // Check if partner is already verified
    if (session.user?.backendPartner?.isVerified === true) {
      console.log("Partner is already verified, redirecting to dashboard");
      router.push("/partner/dashboard");
      return;
    }

    // Only refresh session once to get latest verification status
    if (!hasRefreshedSession.current) {
      const refreshSessionData = async () => {
        try {
          console.log(
            "Refreshing session to get latest verification status..."
          );
          hasRefreshedSession.current = true;

          const sessionResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/create-session`,
            {
              userId: session?.user?.backendPartner?.partnerId,
              email: session?.user?.email,
              userType: "partner",
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.user?.jwtToken}`,
              },
            }
          );

          console.log(
            "Register page - Session refresh response:",
            sessionResponse.data
          );

          if (sessionResponse.data.success) {
            // Update session with fresh data
            await update({
              ...session,
              user: {
                ...session?.user,
                backendPartner: sessionResponse.data.partner,
              },
            });

            // Check if partner is verified after refresh
            if (sessionResponse.data.partner?.isVerified === true) {
              console.log(
                "Partner is verified after session refresh, redirecting to dashboard"
              );
              router.push("/partner/dashboard");
              return;
            }
          }
        } catch (error: any) {
          console.error("Error refreshing session in register page:", error);
          // Reset the flag on error so we can try again
          hasRefreshedSession.current = false;
        }
      };

      // Refresh session data
      refreshSessionData();
    }

    // Pre-fill form with existing data
    if (session.user?.backendPartner) {
      setFormData({
        username: session.user.backendPartner.username || "",
        phone: session.user.backendPartner.phone || "",
        businessName: session.user.backendPartner.businessName || "",
      });
    }
  }, [session, status, router, update]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const requestData = {
        partnerId: session?.user?.backendPartner?.partnerId,
        username: formData.username,
        phone: formData.phone,
        businessName: formData.businessName,
      };

      console.log("Sending registration data:", requestData);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register-partner`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      );

      if (response.data.success) {
        console.log("Registration successful:", response.data);

        // Redirect to dashboard - let dashboard handle session refresh
        router.push("/partner/dashboard");
      } else {
        console.log("Registration failed:", response.data);
        setError(response.data.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <LoadingScreen text="Loading..." />;
  }

  if (!session || session.user?.userType !== "partner") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={session.user?.profilePic || ""} />
                <AvatarFallback>
                  {session.user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl font-bold">
              Complete Your Partner Profile
            </CardTitle>
            <CardDescription>
              Please provide your business information to complete your partner
              registration
            </CardDescription>
            <div className="mt-2">
              <Badge variant="secondary" className="text-sm">
                {session.user?.backendPartner?.subscriptionStatus === "active"
                  ? "Active Partner"
                  : "Pending Verification"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username *
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Name
                </label>
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name (optional)"
                  className="w-full"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Account Information
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Email:</strong> {session.user?.email}
                  </p>
                  <p>
                    <strong>Subscription:</strong>{" "}
                    {session.user?.backendPartner?.subscriptionStatus}
                  </p>
                  <p>
                    <strong>Max Rooms:</strong>{" "}
                    {session.user?.backendPartner?.maxRooms || 0}
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? "Completing Registration..."
                  : "Complete Registration"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut()}
                  className="text-sm"
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
