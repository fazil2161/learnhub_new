import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Course, Enrollment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Book, PlayCircle, Award, Clock, CheckCircle } from "lucide-react";

interface EnrolledCourse {
  enrollment: Enrollment;
  course: Course;
}

const DashboardPage = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("in-progress");

  // Fetch user enrollments
  const { 
    data: enrolledCourses, 
    isLoading 
  } = useQuery<EnrolledCourse[]>({
    queryKey: ["/api/user/enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/user/enrollments");
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return res.json();
    }
  });

  // Filter courses based on active tab
  const filteredCourses = enrolledCourses?.filter(item => {
    if (activeTab === "in-progress") {
      return !item.enrollment.isCompleted;
    } else if (activeTab === "completed") {
      return item.enrollment.isCompleted;
    }
    return true;
  });

  // Calculate progress percentage
  const calculateProgress = (enrollment: Enrollment) => {
    if (!enrollment.progress) return 0;
    
    const completedLessons = Object.values(enrollment.progress).filter(value => value).length;
    const totalLessons = Object.keys(enrollment.progress).length;
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your progress and continue learning</p>
          </div>
          <Button onClick={() => navigate("/courses")}>
            Browse More Courses
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">In Progress</CardTitle>
              <CardDescription>Courses you're currently taking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {enrolledCourses?.filter(item => !item.enrollment.isCompleted).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completed</CardTitle>
              <CardDescription>Courses you've finished</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {enrolledCourses?.filter(item => item.enrollment.isCompleted).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Enrolled</CardTitle>
              <CardDescription>All your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">
                {enrolledCourses?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCourses && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(({ enrollment, course }) => (
                  <Card key={enrollment.id} className="overflow-hidden">
                    <div className="relative">
                      <img 
                        src={course.thumbnailUrl || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80`} 
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      {enrollment.isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          COMPLETED
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="capitalize">
                          {course.level}
                        </Badge>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.durationHours} hours
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-xl line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Progress</span>
                        <span className="text-sm text-gray-600">
                          {calculateProgress(enrollment)}%
                        </span>
                      </div>
                      <Progress value={calculateProgress(enrollment)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-2">
                        Enrolled on {formatDate(enrollment.enrolledAt)}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/course/${course.slug}/learn`)}
                      >
                        {enrollment.isCompleted ? (
                          <>
                            <Book className="h-4 w-4 mr-2" />
                            Review Course
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Continue Learning
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {activeTab === "in-progress" ? 
                    "You don't have any courses in progress." : 
                    activeTab === "completed" ? 
                      "You haven't completed any courses yet." : 
                      "You haven't enrolled in any courses yet."}
                </p>
                <Button onClick={() => navigate("/courses")}>
                  Browse Courses
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 bg-primary/5 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Learning Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Paths</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Follow curated learning paths to master a specific skill set.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Explore Paths</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">View and download certificates for completed courses.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Certificates</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Set and track your personal learning goals and milestones.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Set Goals</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
