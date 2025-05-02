import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import CourseForm from "@/components/admin/CourseForm";
import CourseList from "@/components/admin/CourseList";
import { Course, Lesson, Section } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Users, 
  Star, 
  Video, 
  Layers, 
  FileText,
  Loader2,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";

const AdminPage = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("courses");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Redirect if not admin or instructor
  const { isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      return user;
    },
    onSuccess: (data) => {
      if (!data || (!data.isAdmin && !data.isInstructor)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive",
        });
        navigate("/");
      }
    },
  });

  // Fetch instructor's courses count
  const { data: coursesCount, isLoading: isLoadingCoursesCount } = useQuery<number>({
    queryKey: ["/api/courses/count"],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        const res = await fetch(`/api/courses/count?instructorId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch course count");
        const data = await res.json();
        return data.count;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user && (user.isAdmin || user.isInstructor),
  });

  // Fetch sections count
  const { data: sectionsCount, isLoading: isLoadingSectionsCount } = useQuery<number>({
    queryKey: ["/api/sections/count"],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        const res = await fetch(`/api/sections/count?instructorId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch sections count");
        const data = await res.json();
        return data.count;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user && (user.isAdmin || user.isInstructor),
  });

  // Fetch lessons count
  const { data: lessonsCount, isLoading: isLoadingLessonsCount } = useQuery<number>({
    queryKey: ["/api/lessons/count"],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        const res = await fetch(`/api/lessons/count?instructorId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch lessons count");
        const data = await res.json();
        return data.count;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user && (user.isAdmin || user.isInstructor),
  });

  // Fetch enrollments count (across all instructor courses)
  const { data: enrollmentsCount, isLoading: isLoadingEnrollmentsCount } = useQuery<number>({
    queryKey: ["/api/enrollments/count"],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        const res = await fetch(`/api/enrollments/count?instructorId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch enrollments count");
        const data = await res.json();
        return data.count;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user && (user.isAdmin || user.isInstructor),
  });

  // Handle create course
  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsCreating(true);
  };

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditing(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedCourse(null);
  };

  if (isCheckingAuth) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Render the course creation/edit form
  if (isCreating || isEditing) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => {
              setIsCreating(false);
              setIsEditing(false);
              setSelectedCourse(null);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          
          <CourseForm 
            editCourse={selectedCourse || undefined} 
            onSuccess={handleFormSuccess}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your courses and content</p>
          </div>
          <Button onClick={handleCreateCourse}>
            Create New Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Courses</CardTitle>
              <CardDescription>Total courses created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary mr-3" />
                <div className="text-3xl font-bold">
                  {isLoadingCoursesCount ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    coursesCount || 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students</CardTitle>
              <CardDescription>Total enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div className="text-3xl font-bold">
                  {isLoadingEnrollmentsCount ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    enrollmentsCount || 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Sections</CardTitle>
              <CardDescription>Total course sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-orange-500 mr-3" />
                <div className="text-3xl font-bold">
                  {isLoadingSectionsCount ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    sectionsCount || 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lessons</CardTitle>
              <CardDescription>Total course lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Video className="h-8 w-8 text-purple-500 mr-3" />
                <div className="text-3xl font-bold">
                  {isLoadingLessonsCount ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    lessonsCount || 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="content">Content Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses">
            <CourseList 
              onCreateCourse={handleCreateCourse}
              onEditCourse={handleEditCourse}
            />
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  Manage your course sections, lessons, and materials
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-4 mb-8">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800">Content Management Feature</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      To manage sections and lessons for a specific course, please go to the Courses tab and select the course you'd like to edit.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">Sections</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        Organize your courses into logical sections to make them easier to navigate.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("courses")}>
                        Manage Sections
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Lessons</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        Create and organize lessons with videos, text, quizzes, and other materials.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("courses")}>
                        Manage Lessons
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg">Resources</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        Upload and manage downloadable resources for your courses.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("courses")}>
                        Manage Resources
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">Quizzes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        Create quizzes and assessments to test your students' knowledge.
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("courses")}>
                        Manage Quizzes
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track the performance of your courses and student engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isLoadingCoursesCount ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          </div>
                        ) : coursesCount && coursesCount > 0 ? (
                          <div className="text-gray-600 text-sm">
                            <p>Course analytics will appear here once you have enrollments.</p>
                            <Separator className="my-4" />
                            <ul className="space-y-2">
                              <li className="flex justify-between">
                                <span className="font-medium">Total Views:</span>
                                <span>0</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="font-medium">Completion Rate:</span>
                                <span>0%</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="font-medium">Avg. Rating:</span>
                                <span>N/A</span>
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <div className="text-gray-600 text-sm flex flex-col items-center py-4">
                            <BookOpen className="h-8 w-8 text-gray-400 mb-2" />
                            <p>No courses available</p>
                            <Button 
                              variant="link" 
                              className="mt-2" 
                              onClick={handleCreateCourse}
                            >
                              Create your first course
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Student Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isLoadingEnrollmentsCount ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          </div>
                        ) : enrollmentsCount && enrollmentsCount > 0 ? (
                          <div className="text-gray-600 text-sm">
                            <p>Student analytics will appear here once you have more data.</p>
                            <Separator className="my-4" />
                            <ul className="space-y-2">
                              <li className="flex justify-between">
                                <span className="font-medium">Active Students:</span>
                                <span>{enrollmentsCount}</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="font-medium">Avg. Watch Time:</span>
                                <span>N/A</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="font-medium">Course Completions:</span>
                                <span>0</span>
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <div className="text-gray-600 text-sm flex flex-col items-center py-4">
                            <Users className="h-8 w-8 text-gray-400 mb-2" />
                            <p>No student data available yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center bg-gray-50 rounded-lg p-8">
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-4">
                    We're working on a comprehensive analytics dashboard to help you track your course performance and student engagement.
                  </p>
                  <Button variant="outline">Get Notified</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminPage;
