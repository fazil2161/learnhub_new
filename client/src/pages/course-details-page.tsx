import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { Course, Category, Section, Lesson, Review } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Star, Check, Lock, Clock, BarChart3, Award, Users, PlayCircle, File } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CourseDetailsPage = () => {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("curriculum");

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

  // Fetch category for the course
  const { 
    data: category 
  } = useQuery<Category>({
    queryKey: [`/api/categories/${course?.categoryId}`],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${course!.categoryId}`);
      if (!res.ok) throw new Error("Failed to fetch category");
      return res.json();
    },
    enabled: !!course?.categoryId,
  });

  // Fetch instructor for the course
  const {
    data: instructor
  } = useQuery({
    queryKey: [`/api/user/${course?.instructorId}`],
    queryFn: async () => {
      const res = await fetch(`/api/user/${course!.instructorId}`);
      if (!res.ok) throw new Error("Failed to fetch instructor");
      return res.json();
    },
    enabled: !!course?.instructorId,
  });

  // Fetch sections and lessons for the course
  const {
    data: sections,
    isLoading: isLoadingSections
  } = useQuery<Section[]>({
    queryKey: [`/api/courses/${course?.id}/sections`],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course!.id}/sections`);
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

  // Fetch reviews for the course
  const {
    data: reviews,
    isLoading: isLoadingReviews
  } = useQuery<Review[]>({
    queryKey: [`/api/courses/${course?.id}/reviews`],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course!.id}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!course?.id,
  });

  // Check if the user is enrolled in this course
  const {
    data: enrollment,
    isLoading: isCheckingEnrollment
  } = useQuery({
    queryKey: [`/api/enrollments/${course?.id}`],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const res = await fetch(`/api/enrollments/${course!.id}/check`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to check enrollment");
        return res.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!course?.id && !!user,
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!course) throw new Error("Course not found");
      
      return apiRequest("POST", "/api/enrollments", {
        courseId: course.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Enrollment successful",
        description: `You've been enrolled in ${course?.title}`,
      });
      
      // Invalidate queries to refetch enrollment status
      queryClient.invalidateQueries({ queryKey: [`/api/enrollments/${course?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
      
      // Navigate to the course learning page
      navigate(`/course/${slug}/learn`);
    },
    onError: (error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format price
  const formatPrice = (price?: number) => {
    if (price === undefined) return "";
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  // Handle enrollment
  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to enroll in this course",
      });
      navigate("/auth");
      return;
    }
    
    enrollMutation.mutate();
  };

  // Calculate total lessons and duration
  const calculateCourseTotals = () => {
    if (!sectionLessons || !sections) return { totalLessons: 0, totalMinutes: 0 };
    
    let totalLessons = 0;
    let totalMinutes = 0;
    
    sections.forEach(section => {
      const lessons = sectionLessons[section.id] || [];
      totalLessons += lessons.length;
      totalMinutes += lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    });
    
    return { totalLessons, totalMinutes };
  };

  const { totalLessons, totalMinutes } = calculateCourseTotals();

  if (isLoadingCourse) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Alert variant="destructive">
            <AlertDescription>
              Course not found. The requested course doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Course Header */}
      <div className="bg-primary text-white pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {category && (
                <Badge className="mb-4 bg-white/20 hover:bg-white/30">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg mb-6 text-indigo-100">{course.description}</p>
              
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm">4.8 (2,456 reviews)</span>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>1,245 students enrolled</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{course.durationHours} hours of content</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span className="capitalize">{course.level} level</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={instructor?.avatarUrl} alt={instructor?.firstName} />
                  <AvatarFallback>{instructor?.firstName?.[0]}{instructor?.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Created by</p>
                  <p>{instructor?.firstName} {instructor?.lastName}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-gray-900 lg:-mt-16 lg:mb-[-6rem]">
              <div className="relative mb-4 rounded-md overflow-hidden">
                <img 
                  src={course.thumbnailUrl || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80`} 
                  alt={course.title}
                  className="w-full object-cover aspect-video"
                />
                <Button 
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary/70 hover:bg-primary/90"
                  onClick={() => navigate(`/course/${slug}/learn`)}
                  disabled={!enrollment}
                >
                  <PlayCircle className="h-8 w-8" />
                </Button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-3xl font-bold">{formatPrice(course.price)}</span>
                  {course.price > 0 && (
                    <Badge variant="outline" className="line-through text-gray-500">
                      ${((course.price * 1.3) / 100).toFixed(2)}
                    </Badge>
                  )}
                </div>
                {course.price > 0 && (
                  <p className="text-sm text-gray-500 mb-6">
                    <span className="text-red-500 font-medium">30% off</span> • 2 days left at this price!
                  </p>
                )}
              </div>
              
              {enrollment ? (
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/course/${slug}/learn`)}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Continue Learning
                  </Button>
                  
                  <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-start">
                    <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      You're already enrolled in this course. You can access all content from your dashboard or by clicking the button above.
                    </p>
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending || isCheckingEnrollment}
                >
                  {enrollMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      {course.price === 0 ? "Enroll Now (Free)" : "Buy Now"}
                    </>
                  )}
                </Button>
              )}
              
              <div className="mt-6 space-y-4">
                <h3 className="font-bold text-lg">This course includes:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <PlayCircle className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{totalLessons} lessons</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-gray-500" />
                    <span>{totalMinutes} minutes of video content</span>
                  </li>
                  <li className="flex items-center">
                    <File className="h-5 w-5 mr-3 text-gray-500" />
                    <span>22 downloadable resources</span>
                  </li>
                  <li className="flex items-center">
                    <Award className="h-5 w-5 mr-3 text-gray-500" />
                    <span>Certificate of completion</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-8">
                <TabsTrigger value="curriculum" className="flex-1">Curriculum</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                <TabsTrigger value="instructor" className="flex-1">Instructor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curriculum">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Course Content</h2>
                    <div className="text-sm text-gray-600">
                      {sections?.length || 0} sections • {totalLessons} lessons • {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total length
                    </div>
                  </div>
                  
                  {isLoadingSections || isLoadingLessons ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sections && sections.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {sections.map((section) => (
                        <AccordionItem 
                          key={section.id} 
                          value={`section-${section.id}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex justify-between items-center w-full text-left pr-4">
                              <span className="font-medium">{section.title}</span>
                              <span className="text-sm text-gray-500">
                                {sectionLessons?.[section.id]?.length || 0} lessons
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-gray-50 border-t">
                            <ul className="divide-y divide-gray-200">
                              {sectionLessons?.[section.id]?.map((lesson) => (
                                <li key={lesson.id} className="p-4 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <PlayCircle className="h-5 w-5 mr-3 text-primary" />
                                    <span>{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center">
                                    {!enrollment && course.price > 0 ? (
                                      <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                    ) : null}
                                    <span className="text-sm text-gray-500">{lesson.durationMinutes}min</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No curriculum content available yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Student Reviews</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <div className="text-4xl font-bold mr-4">4.8</div>
                        <div>
                          <div className="flex mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                            ))}
                          </div>
                          <div className="text-sm text-gray-500">Course Rating</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center">
                            <div className="w-12 text-sm text-gray-600">{rating} stars</div>
                            <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ width: `${rating === 5 ? 78 : rating === 4 ? 15 : rating === 3 ? 5 : 2}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-sm text-right text-gray-600">
                              {rating === 5 ? '78%' : rating === 4 ? '15%' : rating === 3 ? '5%' : '2%'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Student Feedback</h3>
                      <ul className="space-y-4">
                        <li className="text-gray-600">
                          <span className="font-medium">98%</span> of students found this course helpful
                        </li>
                        <li className="text-gray-600">
                          <span className="font-medium">95%</span> would recommend this course
                        </li>
                        <li className="text-gray-600">
                          <span className="font-medium">90%</span> reported career improvement
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-6">Reviews</h3>
                    
                    {isLoadingReviews ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <ul className="space-y-6">
                        {reviews.map((review) => (
                          <li key={review.id} className="border-b pb-6">
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={review.user?.avatarUrl} alt={review.user?.firstName} />
                                <AvatarFallback>{review.user?.firstName?.[0]}{review.user?.lastName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-medium">{review.user?.firstName} {review.user?.lastName}</p>
                                    <div className="flex items-center mt-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                          fill="currentColor"
                                        />
                                      ))}
                                      <span className="ml-2 text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-3 text-gray-700">{review.comment}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No reviews available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="instructor">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">About the Instructor</h2>
                  
                  {instructor ? (
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={instructor.avatarUrl} alt={instructor.firstName} />
                        <AvatarFallback className="text-2xl">{instructor.firstName?.[0]}{instructor.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{instructor.firstName} {instructor.lastName}</h3>
                        <p className="text-gray-500 mb-4">{instructor.isInstructor ? "Instructor" : "Course Creator"}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <div className="text-gray-600 flex items-center">
                              <Star className="h-4 w-4 mr-2 text-yellow-400" fill="currentColor" />
                              <span>4.8 Instructor Rating</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>3,452 Students</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 flex items-center">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              <span>5 Courses</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span>742 Reviews</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Bio</h4>
                          <p className="text-gray-700">{instructor.bio || "No bio available for this instructor."}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Instructor information not available.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
              <ul className="space-y-3">
                <li className="flex">
                  <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <span>Master the fundamentals of the subject</span>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <span>Build real-world projects to enhance your portfolio</span>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <span>Understand advanced concepts and techniques</span>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <span>Learn industry best practices and standards</span>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <span>Gain skills that employers are looking for</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>Basic computer skills</li>
                <li>No prior experience in the subject required</li>
                <li>A computer with internet connection</li>
                <li>Enthusiasm and willingness to learn</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Who This Course is For</h2>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>Beginners with no prior experience</li>
                <li>Intermediate learners looking to enhance skills</li>
                <li>Professionals transitioning to a new field</li>
                <li>Anyone interested in mastering the subject</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseDetailsPage;

// This component is intentionally omitted from the imports to avoid circular dependencies
const MessageSquare = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);
