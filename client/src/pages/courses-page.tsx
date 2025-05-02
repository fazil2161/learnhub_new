import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import CourseCard from "@/components/CourseCard";
import CourseFilter from "@/components/CourseFilter";
import { Course, Category } from "@shared/schema";
import { Loader2 } from "lucide-react";

const CoursesPage = () => {
  const [location] = useLocation();
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    level?: string;
    free?: boolean;
    featured?: boolean;
  }>({});

  // Parse query params from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const level = searchParams.get("level") || undefined;
    const free = searchParams.get("free") === "true";
    const featured = searchParams.get("featured") === "true";
    
    setFilters({ search, category, level, free, featured });
  }, [location]);

  // Fetch category if specified
  const { 
    data: category,
    isLoading: isLoadingCategory 
  } = useQuery<Category>({
    queryKey: [`/api/categories/${filters.category}`],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${filters.category}`);
      if (!res.ok) throw new Error("Failed to fetch category");
      return res.json();
    },
    enabled: !!filters.category,
  });

  // Fetch courses based on filters
  const { 
    data: courses,
    isLoading: isLoadingCourses 
  } = useQuery<Course[]>({
    queryKey: ["/api/courses", filters],
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.level) params.append("level", filters.level);
      if (filters.free) params.append("free", "true");
      if (filters.featured) params.append("featured", "true");
      
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
    enabled: true,
  });

  // Helper to get page title
  const getPageTitle = () => {
    if (filters.search) return `Search Results: "${filters.search}"`;
    if (category) return `${category.name} Courses`;
    if (filters.level) return `${filters.level.charAt(0).toUpperCase() + filters.level.slice(1)} Level Courses`;
    if (filters.free) return "Free Courses";
    if (filters.featured) return "Featured Courses";
    return "All Courses";
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          {category && (
            <p className="mt-2 text-lg text-gray-600">{category.description}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <CourseFilter initialFilters={filters} />
          </div>
          
          <div className="lg:col-span-3">
            {isLoadingCourses ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : courses && courses.length > 0 ? (
              <>
                <p className="text-gray-600 mb-6">{courses.length} courses found</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.search 
                    ? "We couldn't find any courses matching your search criteria." 
                    : "There are no courses available in this category."}
                </p>
                <p className="text-gray-600">
                  Try adjusting your filters or search for something else.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CoursesPage;
