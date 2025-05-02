import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertCourseSchema, 
  insertSectionSchema, 
  insertLessonSchema,
  insertEnrollmentSchema,
  insertReviewSchema
} from "@shared/schema";

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

function isInstructor(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && (req.user?.isInstructor || req.user?.isAdmin)) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Courses routes
  app.get("/api/courses", async (req, res) => {
    try {
      const { categoryId, featured, search } = req.query;
      const filters: {
        categoryId?: number;
        featured?: boolean;
        search?: string;
      } = {};

      if (categoryId) filters.categoryId = Number(categoryId);
      if (featured === "true") filters.featured = true;
      if (search) filters.search = search.toString();

      const courses = await storage.getCourses(filters);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:slug", async (req, res) => {
    try {
      const course = await storage.getCourseBySlug(req.params.slug);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isInstructor, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", isInstructor, async (req, res) => {
    try {
      const courseId = Number(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is the instructor of the course or an admin
      if (course.instructorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const courseData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isInstructor, async (req, res) => {
    try {
      const courseId = Number(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is the instructor of the course or an admin
      if (course.instructorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCourse(courseId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Sections routes
  app.get("/api/courses/:courseId/sections", async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      const sections = await storage.getSectionsByCourse(courseId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  app.post("/api/sections", isInstructor, async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      
      // Check if user is the instructor of the course or an admin
      const course = await storage.getCourseById(sectionData.courseId);
      if (!course || (course.instructorId !== req.user?.id && !req.user?.isAdmin)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const section = await storage.createSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  // Lessons routes
  app.get("/api/sections/:sectionId/lessons", async (req, res) => {
    try {
      const sectionId = Number(req.params.sectionId);
      const lessons = await storage.getLessonsBySection(sectionId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons", isInstructor, async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      
      // Check if user is the instructor of the course or an admin
      const section = await storage.getSectionsByCourse(lessonData.sectionId);
      if (!section.length) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      const course = await storage.getCourseById(section[0].courseId);
      if (!course || (course.instructorId !== req.user?.id && !req.user?.isAdmin)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const lesson = await storage.createLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Enrollment routes
  app.get("/api/user/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      
      // Get the course details for each enrollment
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourseById(enrollment.courseId);
          return {
            enrollment,
            course
          };
        })
      );
      
      res.json(enrolledCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getEnrollmentByCourseAndUser(
        enrollmentData.courseId, 
        enrollmentData.userId
      );
      
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Check if the course exists
      const course = await storage.getCourseById(enrollmentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // For now, we'll allow enrollment in both free and paid courses
      // In a real app, this would handle payment processing for paid courses
      
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.put("/api/enrollments/:courseId/progress", isAuthenticated, async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      const { lessonId, completed } = req.body;
      
      if (typeof lessonId !== 'number' || typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      // Get the enrollment
      const enrollment = await storage.getEnrollmentByCourseAndUser(courseId, req.user!.id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Update progress
      const updatedEnrollment = await storage.updateEnrollmentProgress(
        enrollment.id, 
        lessonId, 
        completed
      );
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Reviews routes
  app.get("/api/courses/:courseId/reviews", async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      const reviews = await storage.getReviewsByCourse(courseId);
      
      // Get user details for each review
      const reviewsWithUser = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatarUrl: user.avatarUrl
            } : null
          };
        })
      );
      
      res.json(reviewsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if user is enrolled in the course
      const enrollment = await storage.getEnrollmentByCourseAndUser(
        reviewData.courseId,
        reviewData.userId
      );
      
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled to review this course" });
      }
      
      // Check if user already reviewed this course
      const courseReviews = await storage.getReviewsByCourse(reviewData.courseId);
      const userReview = courseReviews.find(review => review.userId === reviewData.userId);
      
      if (userReview) {
        return res.status(400).json({ message: "You have already reviewed this course" });
      }
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Need to implement a getAllUsers method in storage
      // For now, just return the current user
      if (req.user) {
        res.json([req.user]);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { isAdmin, isInstructor } = req.body;
      
      if (typeof isAdmin !== 'boolean' && typeof isInstructor !== 'boolean') {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      // Update user roles
      // Need to implement an updateUser method in storage
      // For now, just return the user with updated roles
      const updatedUser = { 
        ...user,
        isAdmin: typeof isAdmin === 'boolean' ? isAdmin : user.isAdmin,
        isInstructor: typeof isInstructor === 'boolean' ? isInstructor : user.isInstructor
      };
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
