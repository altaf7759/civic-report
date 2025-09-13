import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { insertAssignmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: string;
}

const assignFormSchema = z.object({
  adminIds: z.array(z.string()).min(1, "At least one admin must be selected"),
  assignmentNotes: z.string().optional(),
});

type AssignFormData = z.infer<typeof assignFormSchema>;

export function AssignModal({ isOpen, onClose, issueId }: AssignModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      adminIds: [],
      assignmentNotes: "",
    },
  });

  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["/api/admins"],
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async (data: AssignFormData) => {
      const response = await apiRequest("POST", `/api/issues/${issueId}/assign`, {
        adminIds: data.adminIds,
        assignmentNotes: data.assignmentNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Issue assigned",
        description: "The issue has been successfully assigned to the selected admin(s).",
      });
      onClose();
      form.reset();
      setSelectedAdmins([]);
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAdminToggle = (adminId: string, checked: boolean) => {
    const newSelectedAdmins = checked
      ? [...selectedAdmins, adminId]
      : selectedAdmins.filter(id => id !== adminId);
    
    setSelectedAdmins(newSelectedAdmins);
    form.setValue("adminIds", newSelectedAdmins);
  };

  const onSubmit = (data: AssignFormData) => {
    if (data.adminIds.length === 0) {
      toast({
        title: "No admins selected",
        description: "Please select at least one admin to assign the issue to.",
        variant: "destructive",
      });
      return;
    }
    
    assignMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedAdmins([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Issue to Admin</DialogTitle>
          <DialogDescription>
            Select one or more administrators to assign this issue to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Select Admin(s) *</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
              {loadingAdmins ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : (admins || []).length > 0 ? (
                (admins || []).map((admin: any) => (
                  <div key={admin.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`admin-${admin.id}`}
                      checked={selectedAdmins.includes(admin.id)}
                      onCheckedChange={(checked) => handleAdminToggle(admin.id, checked as boolean)}
                      data-testid={`checkbox-admin-${admin.id}`}
                    />
                    <Label
                      htmlFor={`admin-${admin.id}`}
                      className="text-sm text-foreground cursor-pointer"
                      data-testid={`label-admin-${admin.id}`}
                    >
                      {admin.name} ({admin.email})
                    </Label>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground" data-testid="no-admins-message">
                      No administrators available
                    </p>
                  </div>
                </div>
              )}
            </div>
            {form.formState.errors.adminIds && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.adminIds.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="assignmentNotes">Assignment Notes</Label>
            <Textarea
              id="assignmentNotes"
              data-testid="textarea-assignment-notes"
              {...form.register("assignmentNotes")}
              rows={2}
              placeholder="Additional instructions for the admin(s) (optional)"
            />
            {form.formState.errors.assignmentNotes && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.assignmentNotes.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel-assign">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignMutation.isPending || selectedAdmins.length === 0}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="button-submit-assign"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
