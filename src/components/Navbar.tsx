import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, User, LogOut, Pill } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const { cartItems } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg md:text-xl text-primary">
          <Pill className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden sm:inline">MediCare</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <Link to="/products" className="hidden md:inline">
                <Button variant="ghost" size="sm">Products</Button>
              </Link>
              
              {userRole === "user" && (
                <>
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                      {cartItems.length > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[10px] md:text-xs"
                          variant="destructive"
                        >
                          {cartItems.length}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </>
              )}

              {/* Unified role-aware dashboard link */}
              <Link to={userRole === "admin" ? "/admin" : userRole === "pharmacist" ? "/pharmacist" : "/dashboard"} className="hidden sm:inline">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to={userRole === "admin" ? "/admin" : userRole === "pharmacist" ? "/pharmacist" : "/dashboard"}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/products">Products</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth" className="w-auto">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup" className="w-auto">
                <Button variant="hero" size="sm" className="hidden sm:inline-flex">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
