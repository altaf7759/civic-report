import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Calendar, MapPin, User, Phone } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: { name: string } | null;
    user: { name: string } | null;
    reporterName: string;
    reporterPhone: string;
    location: string;
    state: string;
    city: string;
    mediaUrls: string[];
    upvoteCount: number;
    userUpvoted?: boolean;
    createdAt: string;
  };
  currentUserId?: string;
}

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

export function IssueCard({ issue, currentUserId }: IssueCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/issues/${issue.id}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Vote recorded",
        description: issue.userUpvoted ? "Upvote removed" : "Issue upvoted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUserId) {
      upvoteMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-issue-${issue.id}`}>
      <Link href={`/issue/${issue.id}`}>
        <div>
          {issue.mediaUrls && issue.mediaUrls.length > 0 && (
            <div className="h-48 bg-muted">
              <img
                src={issue.mediaUrls[0]}
                alt={issue.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <Badge className={cn("text-xs font-medium", getStatusColor(issue.status))} data-testid={`status-${issue.id}`}>
                {formatStatus(issue.status)}
              </Badge>
              <Badge className={cn("text-xs font-medium", getPriorityColor(issue.priority))} data-testid={`priority-${issue.id}`}>
                {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
              </Badge>
            </div>
            
            <h4 className="font-semibold text-foreground mb-2 line-clamp-2" data-testid={`title-${issue.id}`}>
              {issue.title}
            </h4>
            
            <p className="text-sm text-muted-foreground mb-2" data-testid={`category-${issue.id}`}>
              {issue.category?.name || "Other"}
            </p>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center text-sm text-foreground">
                <User className="h-3 w-3 mr-1" />
                <span data-testid={`reporter-${issue.id}`}>Reported by: {issue.reporterName}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span data-testid={`location-${issue.id}`}>{issue.location}, {issue.city}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span data-testid={`date-${issue.id}`}>{formatDate(issue.createdAt)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpvote}
                  disabled={!currentUserId || upvoteMutation.isPending}
                  className={cn(
                    "flex items-center text-sm",
                    issue.userUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                  data-testid={`button-upvote-${issue.id}`}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span data-testid={`upvote-count-${issue.id}`}>{issue.upvoteCount}</span>
                </Button>
                
                <Button size="sm" data-testid={`button-view-${issue.id}`}>
                  View Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
