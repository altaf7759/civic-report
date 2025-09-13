import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Filters } from "@/components/filters";
import { IssueCard } from "@/components/issue-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<{
    state?: string;
    city?: string;
    status?: string;
  }>({});

  const { data: issues, isLoading } = useQuery({
    queryKey: ["/api/issues", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.state) params.append("state", filters.state);
      if (filters.city) params.append("city", filters.city);
      if (filters.status) params.append("status", filters.status);
      
      // For admin users, show only assigned issues
      if (user?.role === "admin") {
        const response = await fetch("/api/admin/issues", {
          credentials: "include",
        });
        return response.json();
      }
      
      const response = await fetch(`/api/issues?${params.toString()}`, {
        credentials: "include",
      });
      return response.json();
    },
  });

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show filters only for citizens and super admins */}
        {user?.role !== "admin" && (
          <div className="mb-8">
            <Filters onFiltersChange={handleFiltersChange} />
          </div>
        )}

        {/* Issues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : issues?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-issues">
                No issues found. {user?.role === "citizen" ? "Be the first to report an issue!" : ""}
              </p>
            </div>
          ) : (
            issues?.map((issue: any) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
