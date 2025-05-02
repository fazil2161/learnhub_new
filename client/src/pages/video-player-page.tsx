import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { Course, Section, Lesson, Enrollment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutList,
  ChevronLeft,
  CheckCircle,
  Circle,
  PlayCircle,
  Lock,
  Menu,
  Loader2,
  ListChecks,
  Home,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VideoPlayerPage = () => {
  const { slug, lessonId: lessonIdParam } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(
    lessonIdParam ? parseInt(lessonIdParam) : null
  );

  // Fetch course details
  const { 
    data: course, 
    isLoading: isLoadingCourse 
  } = useQuery<Course>({
    queryKey: [`/api/courses/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    }
  });

  // Check if the user is enrolled
  const {
    data: enrollment,
    isLoading: isCheckingEnrollment
  } = useQuery<Enrollment>({
    queryKey: [`/api/enrollments/${course?.id}`],
    queryFn: async () => {
      if (!user || !course) throw new Error("User not authenticated or course not found");
      
      const res = await fetch(`/api/enrollments/${course.id}/check`);
      if (res.status === 404) {
        throw new Error("Not enrolled");
      }
      if (!res.ok) throw new Error("Failed to check enrollment");
      return res.json();
    },
    enabled: !!course?.id && !!user,
  });

  // Fetch sections for the course
  const {
    data: sections,
    isLoading: isLoadingSections
  } = useQuery<Section[]>({
    queryKey: [`/api/courses/${course?.id}/sections`],
    queryFn: async () => {
      if (!course) throw new Error("Course not found");
      
      const res = await fetch(`/api/courses/${course.id}/sections`);
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
    enabled: !!course?.id,
  });

  // Fetch lessons for each section
  const {
    data: sectionLessons,
    isLoading: isLoadingLessons
  } = useQuery<Record<number, Lesson[]>>({
    queryKey: [`/api/courses/${course?.id}/lessons`],
    queryFn: async () => {
      if (!sections) return {};
      
      const lessonsMap: Record<number, Lesson[]> = {};
      
      for (const section of sections) {
        const res = await fetch(`/api/sections/${section.id}/lessons`);
        if (res.ok) {
          lessonsMap[section.id] = await res.json();
        }
      }
      
      return lessonsMap;
    },
    enabled: !!sections && sections.length > 0,
  });

  // Find the first lesson if no lesson ID is provided
  useEffect(() => {
    if (!currentLessonId && sections && sectionLessons) {
      // Find the first section that has lessons
      for (const section of sections) {
        const lessons = sectionLessons[section.id];
        if (lessons && lessons.length > 0) {
          setCurrentLessonId(lessons[0].id);
          break;
        }
      }
    }
  }, [currentLessonId, sections, sectionLessons]);

  // Fetch the current lesson details
  const {
    data: currentLesson,
    isLoading: isLoadingLesson
  } = useQuery<Lesson>({
    queryKey: [`/api/lessons/${currentLessonId}`],
    queryFn: async () => {
      if (!currentLessonId) throw new Error("No lesson selected");
      
      const res = await fetch(`/api/lessons/${currentLessonId}`);
      if (!res.ok) throw new Error("Failed to fetch lesson");
      return res.json();
    },
    enabled: !!currentLessonId,
  });

  // Update active lesson when currentLesson changes
  useEffect(() => {
    if (currentLesson) {
      setActiveLesson(currentLesson);
    }
  }, [currentLesson]);

  // Calculate course progress
  const calculateProgress = () => {
    if (!enrollment || !enrollment.progress) return 0;
    
    const completedLessons = Object.values(enrollment.progress).filter(value => value).length;
    const totalLessons = getAllLessons().length;
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Get all lessons across all sections
  const getAllLessons = () => {
    if (!sections || !sectionLessons) return [];
    
    let allLessons: Lesson[] = [];
    sections.forEach(section => {
      const lessons = sectionLessons[section.id] || [];
      allLessons = [...allLessons, ...lessons];
    });
    
    return allLessons;
  };

  // Find the previous and next lessons for navigation
  const findAdjacentLessons = () => {
    if (!sections || !sectionLessons || !currentLessonId) {
      return { prevLesson: null, nextLesson: null };
    }
    
    let allLessons: Lesson[] = [];
    sections.sort((a, b) => a.order - b.order).forEach(section => {
      const lessons = sectionLessons[section.id] || [];
      const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
      allLessons = [...allLessons, ...sortedLessons];
    });
    
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentIndex === -1) return { prevLesson: null, nextLesson: null };
    
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    
    return { prevLesson, nextLesson };
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: number) => {
    if (!enrollment || !enrollment.progress) return false;
    return !!enrollment.progress[lessonId];
  };

  // Handle changing lessons
  const handleLessonChange = (lessonId: number) => {
    setCurrentLessonId(lessonId);
    setSheetOpen(false);
    
    // Update URL without full page reload
    navigate(`/course/${slug}/learn/${lessonId}`, { replace: true });
  };

  const { prevLesson, nextLesson } = findAdjacentLessons();
  const progress = calculateProgress();

  // Redirect to the course details page if not enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        if (!isCheckingEnrollment && !enrollment && course) {
          toast({
            title: "Access Denied",
            description: "You need to enroll in this course to access its content.",
            variant: "destructive",
          });
          navigate(`/courses/${slug}`);
        }
      } catch (error) {
        // Error is already handled by the query
      }
    };
    
    checkEnrollment();
  }, [enrollment, isCheckingEnrollment, course, navigate, slug, toast]);

  if (isLoadingCourse || isCheckingEnrollment) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Course not found. The requested course doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate("/courses")}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="md:mr-2"
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="hidden md:flex"
                onClick={() => navigate(`/courses/${slug}`)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 md:hidden">
                    <Menu className="h-4 w-4 mr-2" />
                    Contents
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[540px] p-0">
                  <SheetHeader className="p-6 border-b">
                    <SheetTitle>Course Contents</SheetTitle>
                  </SheetHeader>
                  <div className="p-6">
                    <div className="mb-6">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>Progress: {progress}%</span>
                        <span>
                          {enrollment && enrollment.progress
                            ? Object.values(enrollment.progress).filter(Boolean).length
                            : 0} / {getAllLessons().length} lessons
                        </span>
                      </div>
                    </div>
                    {renderCourseCurriculum(true)}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="flex items-center">
              <h1 className="text-lg font-medium text-gray-900 truncate max-w-[200px] md:max-w-md">
                {course.title}
              </h1>
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex"
                onClick={() => navigate("/dashboard")}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="ml-2 hidden md:flex"
                onClick={() => setSheetOpen(true)}
              >
                <LayoutList className="h-4 w-4 mr-2" />
                Contents
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 min-h-[calc(100vh-64px)]">
        {/* Main content area - video player */}
        <div className="md:col-span-4 bg-white">
          {isLoadingLesson || !activeLesson ? (
            <div className="flex justify-center items-center h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <VideoPlayer 
              lesson={activeLesson}
              courseId={course.id}
              nextLesson={nextLesson}
              previousLesson={prevLesson}
              onLessonChange={handleLessonChange}
            />
          )}
        </div>

        {/* Sidebar - course curriculum (hidden on mobile) */}
        <div className="hidden md:block border-l bg-white overflow-y-auto h-[calc(100vh-64px)]">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Course Progress</h2>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{progress}% complete</span>
                <span>
                  {enrollment && enrollment.progress
                    ? Object.values(enrollment.progress).filter(Boolean).length
                    : 0} / {getAllLessons().length} lessons
                </span>
              </div>
            </div>
            
            {renderCourseCurriculum(false)}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to render the course curriculum
  function renderCourseCurriculum(isMobile: boolean) {
    if (isLoadingSections || isLoadingLessons) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!sections || sections.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No content available for this course.</p>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Course Content</h2>
        <Accordion 
          type="multiple" 
          defaultValue={sections.map(section => `section-${section.id}`)}
          className="w-full space-y-2"
        >
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <AccordionItem
                key={section.id}
                value={`section-${section.id}`}
                className="border rounded-md overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center w-full text-left pr-4">
                    <span className="font-medium">{section.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {sectionLessons?.[section.id]?.length || 0} lessons
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50 border-t">
                  <ul className="divide-y divide-gray-200">
                    {sectionLessons?.[section.id]
                      ?.sort((a, b) => a.order - b.order)
                      .map((lesson) => (
                        <li
                          key={lesson.id}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${
                            currentLessonId === lesson.id ? "bg-primary/10" : ""
                          }`}
                          onClick={() => handleLessonChange(lesson.id)}
                        >
                          <div className="flex items-center">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            ) : currentLessonId === lesson.id ? (
                              <PlayCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                            )}
                            <span className={`${currentLessonId === lesson.id ? "font-medium" : ""}`}>
                              {lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">
                              {lesson.durationMinutes} min
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
        
        {isMobile && (
          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline"
              onClick={() => navigate(`/courses/${slug}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        )}
      </div>
    );
  }
};

export default VideoPlayerPage;
