import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface CourseFilterProps {
  initialFilters?: {
    search?: string;
    category?: string;
    level?: string;
    free?: boolean;
    featured?: boolean;
  };
}

const CourseFilter = ({ initialFilters = {} }: CourseFilterProps) => {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || "");
  const [selectedLevel, setSelectedLevel] = useState(initialFilters.level || "");
  const [showFreeOnly, setShowFreeOnly] = useState(initialFilters.free || false);
  const [showFeatured, setShowFeatured] = useState(initialFilters.featured || false);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedLevel) params.set("level", selectedLevel);
    if (showFreeOnly) params.set("free", "true");
    if (showFeatured) params.set("featured", "true");
    
    navigate(`/courses?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedLevel("");
    setShowFreeOnly(false);
    setShowFeatured(false);
    navigate("/courses");
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
        <form onSubmit={handleSearch}>
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <Button 
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="category" className="mt-1 w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="level">Level</Label>
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
              >
                <SelectTrigger id="level" className="mt-1 w-full">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="free" 
                checked={showFreeOnly}
                onCheckedChange={(checked) => setShowFreeOnly(!!checked)}
              />
              <Label htmlFor="free" className="cursor-pointer">Free Courses Only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={showFeatured}
                onCheckedChange={(checked) => setShowFeatured(!!checked)}
              />
              <Label htmlFor="featured" className="cursor-pointer">Featured Courses</Label>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button 
              type="submit" 
              className="w-full"
            >
              Apply Filters
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseFilter;
