import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, X, Search, User } from "lucide-react";

const NavBar = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  return (
    <>
      {user && (
        <UserProfileDialog 
          user={user} 
          open={profileDialogOpen} 
          onClose={() => setProfileDialogOpen(false)} 
        />
      )}
      <nav className="bg-secondary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary font-bold text-3xl cursor-pointer">LearnHub</span>
              </Link>
            </div>
            <div className="hidden sm:flex sm:justify-center sm:flex-1 sm:space-x-8">
              <Link href="/">
                <a className={`${location === "/" ? "border-primary text-primary" : "border-transparent text-primary/80 hover:border-primary/30 hover:text-primary"} inline-flex items-center px-3 pt-1 border-b-2 text-base font-medium`}>
                  Home
                </a>
              </Link>
              <Link href="/courses">
                <a className={`${location === "/courses" || location.startsWith("/courses/") ? "border-primary text-primary" : "border-transparent text-primary/80 hover:border-primary/30 hover:text-primary"} inline-flex items-center px-3 pt-1 border-b-2 text-base font-medium`}>
                  Courses
                </a>
              </Link>
              {user && (
                <Link href="/dashboard">
                  <a className={`${location === "/dashboard" ? "border-primary text-primary" : "border-transparent text-primary/80 hover:border-primary/30 hover:text-primary"} inline-flex items-center px-3 pt-1 border-b-2 text-base font-medium`}>
                    Dashboard
                  </a>
                </Link>
              )}
              {user?.isAdmin && (
                <Link href="/admin">
                  <a className={`${location === "/admin" ? "border-primary text-primary" : "border-transparent text-primary/80 hover:border-primary/30 hover:text-primary"} inline-flex items-center px-3 pt-1 border-b-2 text-base font-medium`}>
                    Admin
                  </a>
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <form onSubmit={handleSearch} className="relative mr-4">
              <Input
                type="text"
                placeholder="Search courses..."
                className="rounded-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setProfileDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer"
                  >
                    Dashboard
                  </DropdownMenuItem>
                  {user.isInstructor && (
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="cursor-pointer"
                    >
                      Create Courses
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 focus:text-red-500"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="ml-4 flex items-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/auth")}
                  className="mr-2"
                >
                  Log in
                </Button>
                <Button 
                  onClick={() => navigate("/auth?tab=register")}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-primary/80 hover:bg-primary-foreground/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a 
                className={`${location === "/" ? "bg-primary text-primary-foreground border-primary" : "border-transparent text-primary/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
            </Link>
            <Link href="/courses">
              <a 
                className={`${location === "/courses" || location.startsWith("/courses/") ? "bg-primary text-primary-foreground border-primary" : "border-transparent text-primary/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </a>
            </Link>
            {user && (
              <Link href="/dashboard">
                <a 
                  className={`${location === "/dashboard" ? "bg-primary text-primary-foreground border-primary" : "border-transparent text-primary/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
              </Link>
            )}
            {user?.isAdmin && (
              <Link href="/admin">
                <a 
                  className={`${location === "/admin" ? "bg-primary text-primary-foreground border-primary" : "border-transparent text-primary/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </a>
              </Link>
            )}
          </div>
          
          <form onSubmit={handleSearch} className="px-4 pt-2 pb-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search courses..."
                className="w-full rounded-md pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          
          {user ? (
            <div className="pt-4 pb-3 border-t border-primary/20">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-primary">{user.firstName} {user.lastName}</div>
                  <div className="text-sm font-medium text-primary/70">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link href="/dashboard">
                  <a 
                    className="block px-4 py-2 text-base font-medium text-primary/80 hover:text-primary hover:bg-primary/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                </Link>
                {user.isInstructor && (
                  <Link href="/admin">
                    <a 
                      className="block px-4 py-2 text-base font-medium text-primary/80 hover:text-primary hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Courses
                    </a>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:text-red-700 hover:bg-primary/10"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-primary/20 px-4 flex flex-col space-y-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate("/auth");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Log in
              </Button>
              <Button 
                onClick={() => {
                  navigate("/auth?tab=register");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
    </>
  );
};

// Add profile dialog component
function UserProfileDialog({ user, open, onClose }: { user: any, open: boolean, onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Your account information and learning stats
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatarUrl || ""} alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback>
                {user?.firstName?.[0] || ""}{user?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-md border p-3 text-center">
              <div className="text-2xl font-semibold">{user?.enrollments?.length || 0}</div>
              <div className="text-sm text-gray-500">Enrolled Courses</div>
            </div>
            <div className="rounded-md border p-3 text-center">
              <div className="text-2xl font-semibold">{user?.isInstructor ? "Yes" : "No"}</div>
              <div className="text-sm text-gray-500">Instructor Status</div>
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">Account Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Username:</div>
              <div>{user?.username}</div>
              <div className="text-gray-500">Member Since:</div>
              <div>{new Date(user?.createdAt).toLocaleDateString()}</div>
              <div className="text-gray-500">Role:</div>
              <div>{user?.isAdmin ? "Admin" : user?.isInstructor ? "Instructor" : "Student"}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NavBar;
