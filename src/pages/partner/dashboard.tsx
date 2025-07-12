import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";

export default function PartnerDashboard() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/partner/login");
      return;
    }

    if (session.user?.userType !== "partner") {
      router.push("/partner/login");
      return;
    }

    console.log("Dashboard - Session data:", {
      userType: session.user?.userType,
      phone: session.user?.backendPartner?.phone,
      username: session.user?.backendPartner?.username,
      backendPartner: session.user?.backendPartner,
    });

    // If partner hasn't completed registration, try to refresh session first
    if (!session.user?.backendPartner?.isVerified) {
      console.log("Registration incomplete, trying to refresh session...");

      // Try to refresh session data
      const refreshSession = async () => {
        try {
          console.log("Attempting to refresh session with:", {
            userId: session?.user?.backendPartner?.partnerId,
            email: session?.user?.email,
            userType: "partner",
          });

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

          console.log("Session refresh response:", sessionResponse.data);

          if (
            sessionResponse.data.success &&
            sessionResponse.data.partner?.isVerified === true
          ) {
            console.log("Session refreshed, registration is complete");
            // Update session and stay on dashboard
            await updateSession({
              ...session,
              user: {
                ...session?.user,
                backendPartner: sessionResponse.data.partner,
              },
            });
            return; // Stay on dashboard
          } else {
            console.log(
              "Session refreshed but registration still incomplete:",
              sessionResponse.data.partner
            );
          }
        } catch (error: any) {
          console.error("Error refreshing session:", error);
          if (error.response) {
            console.error("Error response:", error.response.data);
          }
        }

        // If refresh failed or still incomplete, redirect to register
        console.log("Registration still incomplete, redirecting to register");
        router.push("/partner/register");
      };

      refreshSession();
      return;
    }

    console.log("Registration complete, staying on dashboard");
  }, [session, status, router, updateSession]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.userType !== "partner") {
    return null; // Will redirect in useEffect
  }

  const partner = session.user.backendPartner;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Partner Info Card */}
          <div className="lg:col-span-1">
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={session.user?.profilePic || ""} />
                    <AvatarFallback>
                      {session.user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  Partner Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Username
                  </label>
                  <p className="text-sm text-gray-900">{partner?.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{partner?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-sm text-gray-900">{partner?.phone}</p>
                </div>
                {partner?.businessName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Business Name
                    </label>
                    <p className="text-sm text-gray-900">
                      {partner.businessName}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        partner?.subscriptionStatus === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {partner?.subscriptionStatus === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Verification
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={partner?.isVerified ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {partner?.isVerified
                        ? "Verified"
                        : "Pending Verification"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Info */}
            <Card className="py-6">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your current account details and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {partner?.maxRooms || 10}
                    </div>
                    <div className="text-sm text-gray-500">Max Rooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      Rp {partner?.paidAmount?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-500">Active Rentals</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="py-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your rental properties and business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="plain"
                    className="h-20 flex flex-col items-center justify-center text-base"
                    onClick={() => router.push("/partner/addKosan")}
                  >
                    <Plus className="w-6 h-6 mb-2" />
                    Add New Rental
                  </Button>
                  <Button
                    variant="plain"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    View Analytics
                  </Button>
                  <Button
                    variant="plain"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => router.push("/partner/view-kosan")}
                  >
                    <svg
                      className="w-6 h-6 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    View Kosan
                  </Button>
                  <Button
                    variant="plain"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
