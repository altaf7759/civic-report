import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  Cog, 
  CheckCircle, 
  TrendingUp,
  Users,
  Target,
  Award
} from "lucide-react";
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

const formatStatus = (status: string) => {
  return status.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: user?.role === "admin" || user?.role === "superadmin",
  });

  if (user?.role === "citizen") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only admins can access analytics.</p>
            <Link href="/">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">System Analytics</h2>
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {/* Analytics Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-2 w-24" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="total-issues">
                        {analytics?.totalIssues || 0}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Not Assigned</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="not-assigned-count">
                        {analytics?.notAssigned || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="assigned-count">
                        {analytics?.assigned || 0}
                      </p>
                    </div>
                    <Cog className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="resolved-count">
                        {analytics?.resolved || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Category</CardTitle>
                  <CardDescription>
                    Distribution of issues across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.categoryBreakdown || []).map((category: any, index: number) => {
                      const percentage = (analytics?.totalIssues || 0) > 0 
                        ? Math.round((category.count / (analytics?.totalIssues || 1)) * 100) 
                        : 0;
                      
                      return (
                        <div key={category.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground" data-testid={`category-name-${index}`}>
                              {category.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground" data-testid={`category-percentage-${index}`}>
                                {percentage}%
                              </span>
                              <span className="text-sm text-muted-foreground" data-testid={`category-count-${index}`}>
                                ({category.count})
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2" 
                            data-testid={`category-progress-${index}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>
                    Important system performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">Resolution Rate</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground" data-testid="resolution-rate">
                        {(analytics?.totalIssues || 0) > 0 
                          ? Math.round(((analytics?.resolved || 0) / (analytics?.totalIssues || 1)) * 100)
                          : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-foreground">Pending Issues</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground" data-testid="pending-issues">
                        {(analytics?.notAssigned || 0) + (analytics?.assigned || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-foreground">Assignment Rate</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground" data-testid="assignment-rate">
                        {(analytics?.totalIssues || 0) > 0 
                          ? Math.round((((analytics?.assigned || 0) + (analytics?.resolved || 0)) / (analytics?.totalIssues || 1)) * 100)
                          : 0}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-foreground">Active Issues</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground" data-testid="active-issues">
                        {analytics?.assigned || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Most Upvoted Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Most Upvoted Issues</CardTitle>
                <CardDescription>
                  Issues with the highest community engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.mostUpvotedIssues || []).length > 0 ? (
                    (analytics?.mostUpvotedIssues || []).map((issue: any, index: number) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        data-testid={`upvoted-issue-${index}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1" data-testid={`upvoted-issue-title-${index}`}>
                            {issue.title}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`upvoted-issue-category-${index}`}>
                            {issue.category?.name || "Other"} • {issue.location}, {issue.city}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            className={cn("text-xs font-medium", getStatusColor(issue.status))}
                            data-testid={`upvoted-issue-status-${index}`}
                          >
                            {formatStatus(issue.status)}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground" data-testid={`upvoted-issue-count-${index}`}>
                              {issue.upvoteCount} upvotes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground" data-testid="no-upvoted-issues">
                        No upvoted issues found.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="analytics-error">
              Failed to load analytics data. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
