import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useAuth } from "@/components/Contexts/AuthProvider";

// Import the logo image
import bsLogo from "@/assets/bslogo.png";

export default function NavBar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // List of public routes where the navbar should always be shown
  const publicRoutes = ["/", "/login", "/signup", "/eula", "/privacy-policy"];

  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If the user is authenticated and not on a public route, don't render the navbar
  if (user && !isPublicRoute) {
    return null;
  }

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-primary">
      <div className="max-w-full lg:ml-10 md:ml-10 sm:ml-16 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              {/* Replace the LiaHorseHeadSolid icon with the bslogo image */}
              <img src={bsLogo} alt="BS Logo" className="h-8 w-auto" />
            </Link>
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-white text-2xl ml-4 font-bold">
                JTE - Bobby Simms
              </h1>
            </Link>
          </div>

          {/* Center-aligned navigation links */}
          <div className="hidden md:flex flex-grow justify-center">
            <div className="flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Login/Signup buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-primary bg-primary"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMenu}
                  className="text-black border-white "
                >
                  {isOpen ? (
                    <X className="h-6 w-6 " />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[250px] sm:w-[300px] bg-primary"
              >
                <nav className="flex flex-col space-y-4 mt-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="flex flex-col space-y-4 mt-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full text-primary border-white hover:bg-primary"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-white text-red-600 hover:bg-gray-100">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
