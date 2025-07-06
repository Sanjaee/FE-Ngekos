import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  User,
  Settings,
  LogOut,
  Home,
  Search,
  Heart,
  Bell,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <TooltipProvider>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-neutral-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo Section */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">N</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Ngekos
                    </span>
                  </div>
                </div>
              </div>

              {/* Loading state */}
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </div>
          </div>
        </nav>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-neutral-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Ngekos
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section - Profile & Notifications */}
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={session.user?.profilePic || ""}
                              alt={session.user?.username || ""}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {session.user?.username ? (
                                session.user.username.charAt(0).toUpperCase()
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click here</p>
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.username ||
                            session.user?.name ||
                            "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email || ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Pengaturan</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoading ? "Keluar..." : "Keluar"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                  <Button size="sm">Daftar</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
