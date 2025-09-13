import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, ThumbsUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
  switch (status) {
    case "not-assigned":
      return "bg-red-500 text-white";
    case "assigned":
      return "bg-yellow-500 text-white";
    case "resolved":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const formatStatus = (status: string) => {
  return status.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

export default function MyReportsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { data: issues, isLoading } = useQuery({
    queryKey: ["/api/issues", { userId: user?.id }],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: user?.id || "" });
      const response = await fetch(`/api/issues?${params.toString()}`, {
        credentials: "include",
      });
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const filteredIssues = issues?.filter((issue: any) => {
    if (statusFilter && statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (categoryFilter && categoryFilter !== "all" && issue.category?.id !== categoryFilter) return false;
    if (priorityFilter && priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">My Reports</h2>
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filter Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter My Reports</CardTitle>
            <CardDescription>
              Filter your submitted reports by status, category, and priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="not-assigned">Not Assigned</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(categories || []).map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-filter">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredIssues?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-reports">
                {issues?.length === 0 
                  ? "You haven't submitted any reports yet." 
                  : "No reports match your current filters."
                }
              </p>
              {issues?.length === 0 && (
                <Link href="/add-issue">
                  <Button className="mt-4">Submit Your First Report</Button>
                </Link>
              )}
            </div>
          ) : (
            filteredIssues?.map((issue: any) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow" data-testid={`card-report-${issue.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={cn("text-xs font-medium", getStatusColor(issue.status))} data-testid={`status-${issue.id}`}>
                          {formatStatus(issue.status)}
                        </Badge>
                        <Badge className={cn("text-xs font-medium", getPriorityColor(issue.priority))} data-testid={`priority-${issue.id}`}>
                          {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground" data-testid={`category-${issue.id}`}>
                          {issue.category?.name || "Other"}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`title-${issue.id}`}>
                        {issue.title}
                      </h3>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span data-testid={`location-${issue.id}`}>{issue.location}, {issue.city}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span data-testid={`date-${issue.id}`}>{formatDate(issue.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span data-testid={`upvotes-${issue.id}`}>{issue.upvoteCount} upvotes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <Link href={`/issue/${issue.id}`}>
                        <Button data-testid={`button-view-details-${issue.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
