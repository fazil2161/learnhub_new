import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Course, Category, insertCourseSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extend the course schema to make it more user-friendly
const courseFormSchema = insertCourseSchema.extend({
  price: z.string().transform((val) => {
    const price = parseFloat(val);
    return Math.round(price * 100); // Convert to cents
  }),
  durationHours: z.string().transform((val) => {
    return parseInt(val);
  }),
}).omit({ instructorId: true });

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  editCourse?: Course;
  onSuccess?: () => void;
}

const CourseForm = ({ editCourse, onSuccess }: CourseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(editCourse?.thumbnailUrl || null);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  // Initialize form with default values or edit values
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: editCourse?.title || "",
      slug: editCourse?.slug || "",
      description: editCourse?.description || "",
      price: editCourse ? String(editCourse.price / 100) : "0",
      thumbnailUrl: editCourse?.thumbnailUrl || "",
      categoryId: editCourse?.categoryId.toString() || "",
      level: editCourse?.level || "beginner",
      durationHours: editCourse ? String(editCourse.durationHours) : "1",
      isFeatured: editCourse?.isFeatured || false,
    },
  });

  // Create or update course mutation
  const courseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      // Add instructor ID to the data
      const courseData = { ...data, instructorId: user.id };
      
      if (editCourse) {
        // Update existing course
        return apiRequest("PUT", `/api/courses/${editCourse.id}`, courseData);
      } else {
        // Create new course
        return apiRequest("POST", "/api/courses", courseData);
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: `Course ${editCourse ? "updated" : "created"} successfully`,
        description: `Your course has been ${editCourse ? "updated" : "created"}.`,
      });
      
      // Invalidate queries to refetch the course list
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form if creating a new course
      if (!editCourse) {
        form.reset();
        setThumbnailPreview(null);
      }
    },
    onError: (error) => {
      toast({
        title: `Failed to ${editCourse ? "update" : "create"} course`,
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: CourseFormValues) => {
    courseMutation.mutate(data);
  };

  // Handle thumbnail file change
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      
      // For now, we'll update the form value with a placeholder until we implement file uploads
      // In a real implementation, you would upload the file to a server and get a URL back
      form.setValue("thumbnailUrl", `https://example.com/thumbnails/${file.name}`);
    }
  };

  // Generate a slug from the title
  const generateSlug = () => {
    const title = form.getValues("title");
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
      
      form.setValue("slug", slug);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{editCourse ? "Edit Course" : "Create New Course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Complete Web Developer Bootcamp" 
                        {...field} 
                        onBlur={(e) => {
                          field.onBlur();
                          if (!form.getValues("slug")) {
                            generateSlug();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Slug</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="e.g. web-developer-bootcamp" {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateSlug}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      Used in the course URL. Must be unique.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a detailed description of your course..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Set to 0 for free courses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={isLoadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="durationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 10"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/thumbnail.jpg"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a URL or upload an image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Thumbnail
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="mb-2"
              />
              {thumbnailPreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Preview:</p>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-40 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Feature this course</FormLabel>
                    <FormDescription>
                      Featured courses appear on the homepage and are highlighted in search results.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={courseMutation.isPending}
            >
              {courseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editCourse ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editCourse ? "Update Course" : "Create Course"}</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CourseForm;
