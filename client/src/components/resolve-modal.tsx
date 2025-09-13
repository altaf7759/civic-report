import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, AlertCircle } from "lucide-react";
import { resolveIssueSchema } from "@shared/schema";
import type { ResolveIssue } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: string;
}

export function ResolveModal({ isOpen, onClose, issueId }: ResolveModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ResolveIssue>({
    resolver: zodResolver(resolveIssueSchema),
    defaultValues: {
      resolutionNotes: "",
      resolutionImageUrl: "",
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (data: ResolveIssue) => {
      const formData = new FormData();
      formData.append("resolutionNotes", data.resolutionNotes);
      
      if (selectedFile) {
        formData.append("resolutionImage", selectedFile);
      }

      const response = await fetch(`/api/issues/${issueId}/resolve`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to resolve issue");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Issue resolved",
        description: "The issue has been marked as resolved.",
      });
      onClose();
      form.reset();
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Resolution failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onSubmit = (data: ResolveIssue) => {
    if (!selectedFile) {
      toast({
        title: "Proof image required",
        description: "Please upload a proof image.",
        variant: "destructive",
      });
      return;
    }
    
    resolveMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Issue</DialogTitle>
          <DialogDescription>
            Provide resolution details and upload proof of completion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="resolutionNotes">Resolution Notes *</Label>
            <Textarea
              id="resolutionNotes"
              data-testid="textarea-resolution-notes"
              {...form.register("resolutionNotes")}
              rows={3}
              placeholder="Describe how the issue was resolved"
            />
            {form.formState.errors.resolutionNotes && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.resolutionNotes.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="proof-upload">Upload Proof Image *</Label>
            <div className="mt-2">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label
                      htmlFor="proof-upload"
                      className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80"
                    >
                      <span>Upload proof image</span>
                      <input
                        id="proof-upload"
                        name="proofImage"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                        data-testid="input-proof-upload"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      data-testid="button-remove-proof"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel-resolve">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={resolveMutation.isPending}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="button-submit-resolve"
            >
              {resolveMutation.isPending ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
