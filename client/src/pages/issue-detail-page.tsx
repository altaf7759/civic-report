import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResolveModal } from "@/components/resolve-modal";
import { AssignModal } from "@/components/assign-modal";
import { ArrowLeft, ThumbsUp, Calendar, MapPin, User, Phone, Check, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

export default function IssueDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/issue/:id");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const issueId = params?.id;

  const { data: issue, isLoading } = useQuery({
    queryKey: ["/api/issues", issueId],
    queryFn: async () => {
      const response = await fetch(`/api/issues/${issueId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Issue not found");
      }
      return response.json();
    },
    enabled: !!issueId,
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/issues/${issueId}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId] });
      toast({
        title: "Vote recorded",
        description: issue?.userUpvoted ? "Upvote removed" : "Issue upvoted",
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

  const handleUpvote = () => {
    if (user?.id) {
      upvoteMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const goBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Issue not found.</p>
            <Button onClick={goBack} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="overflow-hidden">
          <CardContent className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={goBack} data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Badge className={cn("text-xs font-medium", getStatusColor(issue.status))} data-testid="status-badge">
                  {formatStatus(issue.status)}
                </Badge>
                <Badge className={cn("text-xs font-medium", getPriorityColor(issue.priority))} data-testid="priority-badge">
                  {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                </Badge>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="issue-title">
              {issue.title}
            </h1>
            <p className="text-muted-foreground" data-testid="issue-category">
              {issue.category?.name || "Other"}
            </p>
          </CardContent>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Issue Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <p className="text-foreground" data-testid="issue-description">{issue.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Reporter</label>
                    <p className="text-foreground" data-testid="issue-reporter">{issue.reporterName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
                    <p className="text-foreground" data-testid="issue-phone">{issue.reporterPhone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                    <p className="text-foreground" data-testid="issue-location">{issue.location}, {issue.city}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date Reported</label>
                    <p className="text-foreground" data-testid="issue-date">{formatDate(issue.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Uploaded Media</h3>
              <div className="space-y-4">
                {issue.mediaUrls && issue.mediaUrls.length > 0 ? (
                  issue.mediaUrls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Issue media ${index + 1}`}
                      className="w-full rounded-lg border border-border"
                      data-testid={`issue-media-${index}`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No media uploaded</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleUpvote}
                  disabled={!user?.id || upvoteMutation.isPending}
                  className={cn(
                    "flex items-center",
                    issue.userUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                  data-testid="button-upvote"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  <span data-testid="upvote-count">{issue.upvoteCount}</span> Upvotes
                </Button>
              </div>
              
              <div className="flex space-x-3">
                {user?.role === "admin" && issue.status === "assigned" && (
                  <Button
                    onClick={() => setShowResolveModal(true)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-resolve"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Resolve Issue
                  </Button>
                )}
                
                {user?.role === "superadmin" && issue.status === "not-assigned" && (
                  <Button
                    onClick={() => setShowAssignModal(true)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-assign"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign to Admin
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Resolution Details (if resolved) */}
          {issue.status === "resolved" && issue.resolutionNotes && (
            <div className="p-6 bg-muted border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Resolution Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Resolution Notes</label>
                  <p className="text-foreground" data-testid="resolution-notes">{issue.resolutionNotes}</p>
                </div>
                
                {issue.resolver && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Resolved by</label>
                    <p className="text-foreground" data-testid="resolved-by">{issue.resolver.name}</p>
                  </div>
                )}
                
                {issue.resolvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Resolution Date</label>
                    <p className="text-foreground" data-testid="resolved-at">{formatDate(issue.resolvedAt)}</p>
                  </div>
                )}
                
                {issue.resolutionImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Proof of Resolution</label>
                    <img
                      src={issue.resolutionImageUrl}
                      alt="Resolution proof"
                      className="w-full max-w-md rounded-lg border border-border"
                      data-testid="resolution-image"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <ResolveModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        issueId={issueId || ""}
      />
      
      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        issueId={issueId || ""}
      />
    </div>
  );
}
