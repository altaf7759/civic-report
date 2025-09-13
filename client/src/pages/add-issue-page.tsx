import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, AlertCircle } from "lucide-react";
import { insertIssueSchema } from "@shared/schema";
import type { InsertIssue } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStates, getCities } from "@/lib/api";

export default function AddIssuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<InsertIssue>({
    resolver: zodResolver(insertIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      state: "",
      city: "",
      reporterName: user?.name || "",
      reporterPhone: "",
      categoryId: "",
      location: "",
      priority: "",
      mediaUrls: [],
      userId: user?.id || "",
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    const state = form.watch("state");
    if (state) {
      loadCities(state);
    } else {
      setCities([]);
      form.setValue("city", "");
    }
  }, [form.watch("state")]);

  const loadStates = async () => {
    try {
      const statesData = await getStates();
      setStates(statesData);
    } catch (error) {
      console.error("Failed to load states:", error);
    }
  };

  const loadCities = async (state: string) => {
    try {
      const citiesData = await getCities(state);
      setCities(citiesData);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: InsertIssue) => {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "mediaUrls" && value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      // Append files
      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await fetch("/api/issues", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to submit issue");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Issue submitted",
        description: "Your issue has been successfully submitted.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertIssue) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Media required",
        description: "Please upload at least one image or video.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  if (user?.role !== "citizen") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only citizens can submit issues.</p>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report New Issue</CardTitle>
                <CardDescription>
                  Provide detailed information about the civic issue you want to report
                </CardDescription>
              </div>
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-close">
                  <X className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title / Short Description *</Label>
                  <Input
                    id="title"
                    data-testid="input-title"
                    {...form.register("title")}
                    placeholder="Brief description of the issue"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    data-testid="textarea-description"
                    {...form.register("description")}
                    rows={4}
                    placeholder="Provide detailed information about the issue"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={form.watch("state")} onValueChange={(value) => form.setValue("state", value)}>
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Select value={form.watch("city")} onValueChange={(value) => form.setValue("city", value)} disabled={!form.watch("state")}>
                    <SelectTrigger data-testid="select-city">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.city && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reporterName">Reporter Name *</Label>
                  <Input
                    id="reporterName"
                    data-testid="input-reporter-name"
                    {...form.register("reporterName")}
                    placeholder="Your full name"
                  />
                  {form.formState.errors.reporterName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.reporterName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reporterPhone">Phone Number *</Label>
                  <Input
                    id="reporterPhone"
                    data-testid="input-reporter-phone"
                    {...form.register("reporterPhone")}
                    placeholder="Your phone number"
                  />
                  {form.formState.errors.reporterPhone && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.reporterPhone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select value={form.watch("categoryId") || ""} onValueChange={(value) => form.setValue("categoryId", value)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value)}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.priority && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.priority.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Location/Landmark *</Label>
                  <Input
                    id="location"
                    data-testid="input-location"
                    {...form.register("location")}
                    placeholder="Specific location or nearby landmark"
                  />
                  {form.formState.errors.location && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.location.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="media">Upload Images/Videos *</Label>
                  <div className="mt-2">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                          <label
                            htmlFor="media-upload"
                            className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80"
                          >
                            <span>Upload files</span>
                            <input
                              id="media-upload"
                              name="media"
                              type="file"
                              className="sr-only"
                              multiple
                              accept="image/*,video/*"
                              onChange={handleFileChange}
                              data-testid="input-media-upload"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Images and videos up to 10MB each (max 5 files)
                        </p>
                      </div>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Selected files:</p>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-file-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                <Link href="/">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Issue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
