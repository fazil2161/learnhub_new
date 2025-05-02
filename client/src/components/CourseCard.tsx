import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Course, Category } from "@shared/schema";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  // Fetch category for the course
  const { data: category } = useQuery<Category>({
    queryKey: [`/api/categories/${course.categoryId}`],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${course.categoryId}`);
      if (!res.ok) throw new Error("Failed to fetch category");
      return res.json();
    },
    enabled: !!course.categoryId,
  });

  // Fetch instructor for the course
  const { data: instructor } = useQuery({
    queryKey: [`/api/user/${course.instructorId}`],
    queryFn: async () => {
      const res = await fetch(`/api/user/${course.instructorId}`);
      if (!res.ok) throw new Error("Failed to fetch instructor");
      return res.json();
    },
    enabled: !!course.instructorId,
  });

  // Format price
  const formattedPrice = () => {
    if (course.price === 0) {
      return "Free";
    }
    return `$${(course.price / 100).toFixed(2)}`;
  };

  // Get badge type
  const getBadgeType = () => {
    if (course.isFeatured) return { text: "BESTSELLER", className: "bg-yellow-400 text-black" };
    if (course.price === 0) return { text: "FREE", className: "bg-green-500 text-white" };
    // Check if the course is new (less than 30 days old)
    const createdDate = new Date(course.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (createdDate > thirtyDaysAgo) return { text: "NEW", className: "bg-blue-500 text-white" };
    
    return null;
  };

  const badge = getBadgeType();

  return (
    <Card className="h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          className="h-48 w-full object-cover" 
          src={course.thumbnailUrl || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80`} 
          alt={course.title} 
        />
        {badge && (
          <div className={`absolute top-2 right-2 ${badge.className} text-xs font-bold px-3 py-1 rounded-full`}>
            {badge.text}
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-2">
          {category && (
            <Badge variant="outline" className={`text-xs font-semibold text-${category.colorClass} px-2 py-1 bg-${category.colorClass}/10 rounded-full`}>
              {category.name}
            </Badge>
          )}
          <span className="text-xs font-medium text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {course.durationHours} hours
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className="h-4 w-4 text-yellow-400" 
                fill="currentColor"
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">4.8 (2,456 reviews)</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {instructor?.avatarUrl ? (
                <img src={instructor.avatarUrl} alt={`${instructor.firstName} ${instructor.lastName}`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-medium">
                  {instructor?.firstName?.[0]}{instructor?.lastName?.[0]}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {instructor?.firstName} {instructor?.lastName}
            </span>
          </div>
          <span className={`font-bold ${course.price === 0 ? "text-green-500" : "text-gray-900"}`}>
            {formattedPrice()}
          </span>
        </div>
      </CardContent>
      <div className="px-6 pb-6">
        <Link href={`/courses/${course.slug}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            {course.price === 0 ? "Enroll Now" : "View Course"}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default CourseCard;
