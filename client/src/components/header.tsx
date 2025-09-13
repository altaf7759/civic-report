import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Plus, LogOut, BarChart3, FileText } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMenuOptionText = () => {
    if (user?.role === "citizen") return "My Reports";
    return "Analytics";
  };

  const getMenuOptionLink = () => {
    if (user?.role === "citizen") return "/my-reports";
    return "/analytics";
  };

  if (!user) return null;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer" data-testid="link-home">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">CivicReport</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user.role === "citizen" && (
              <Link href="/add-issue">
                <Button data-testid="button-add-issue">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Issue
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0" data-testid="button-user-menu">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={getMenuOptionLink()}>
                  <DropdownMenuItem data-testid="menu-item-reports-analytics">
                    {user.role === "citizen" ? (
                      <FileText className="h-4 w-4 mr-2" />
                    ) : (
                      <BarChart3 className="h-4 w-4 mr-2" />
                    )}
                    {getMenuOptionText()}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
