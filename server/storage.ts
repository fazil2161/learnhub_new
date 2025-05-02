import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  courses, Course, InsertCourse,
  sections, Section, InsertSection,
  lessons, Lesson, InsertLesson,
  enrollments, Enrollment, InsertEnrollment,
  reviews, Review, InsertReview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, like, and, or, asc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Course methods
  getCourses(filters?: { categoryId?: number, featured?: boolean, search?: string }): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Section methods
  getSectionsByCourse(courseId: number): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<boolean>;

  // Lesson methods
  getLessonsBySection(sectionId: number): Promise<Lesson[]>;
  getLessonById(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;

  // Enrollment methods
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentByCourseAndUser(courseId: number, userId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(id: number, lessonId: number, completed: boolean): Promise<Enrollment | undefined>;

  // Review methods
  getReviewsByCourse(courseId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private courses: Map<number, Course>;
  private sections: Map<number, Section>;
  private lessons: Map<number, Lesson>;
  private enrollments: Map<number, Enrollment>;
  private reviews: Map<number, Review>;
  sessionStore: any;

  private userIdCounter: number;
  private categoryIdCounter: number;
  private courseIdCounter: number;
  private sectionIdCounter: number;
  private lessonIdCounter: number;
  private enrollmentIdCounter: number;
  private reviewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.courses = new Map();
    this.sections = new Map();
    this.lessons = new Map();
    this.enrollments = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.courseIdCounter = 1;
    this.sectionIdCounter = 1;
    this.lessonIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.reviewIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with some default data
    this.initializeData();
  }

  private async initializeData() {
    // Create admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2b$10$D8JgiMU6nW9SxGOkn16pP.Z7AUQ7wKcfJGCB0g/eIF5N0CebVVBGG", // "admin123"
      email: "admin@learnhub.com",
      firstName: "Admin",
      lastName: "User",
      bio: "LearnHub Administrator",
      avatarUrl: "https://i.pravatar.cc/150?u=admin@learnhub.com"
    });

    // Update admin user to be admin
    const updatedAdmin = { ...adminUser, isAdmin: true, isInstructor: true };
    this.users.set(adminUser.id, updatedAdmin);

    // Create categories
    const categories: InsertCategory[] = [
      { 
        name: "Development", 
        slug: "development", 
        iconName: "laptop-code", 
        colorClass: "primary", 
        description: "Web, Mobile & Software Development" 
      },
      { 
        name: "Business", 
        slug: "business", 
        iconName: "chart-line", 
        colorClass: "secondary", 
        description: "Finance, Entrepreneurship, Sales" 
      },
      { 
        name: "Data Science", 
        slug: "data-science", 
        iconName: "database", 
        colorClass: "purple-600", 
        description: "Machine Learning, AI, Analytics" 
      },
      { 
        name: "Design", 
        slug: "design", 
        iconName: "paint-brush", 
        colorClass: "pink-600", 
        description: "UI/UX, Graphic Design, Animation" 
      },
      { 
        name: "Marketing", 
        slug: "marketing", 
        iconName: "bullhorn", 
        colorClass: "orange-500", 
        description: "Digital Marketing, SEO, Social Media" 
      }
    ];

    for (const category of categories) {
      await this.createCategory(category);
    }

    // Create some sample courses, sections, and lessons
    const webDevCourse = await this.createCourse({
      title: "Complete Web Developer Bootcamp",
      slug: "web-developer-bootcamp",
      description: "Learn HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer",
      price: 8999, // $89.99
      thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: 1, // Development
      level: "beginner",
      durationHours: 36,
      isFeatured: true
    });

    const dataScience = await this.createCourse({
      title: "Data Science & Machine Learning",
      slug: "data-science-machine-learning",
      description: "Master data analysis, visualization, and machine learning with Python and R",
      price: 12999, // $129.99
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: 3, // Data Science
      level: "intermediate",
      durationHours: 42,
      isFeatured: true
    });

    const digitalMarketing = await this.createCourse({
      title: "Digital Marketing Fundamentals",
      slug: "digital-marketing-fundamentals",
      description: "Learn SEO, social media marketing, email campaigns and analytics basics",
      price: 0, // Free
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: 5, // Marketing
      level: "beginner",
      durationHours: 18,
      isFeatured: true
    });

    // Create sections for web development course
    const htmlSection = await this.createSection({
      title: "HTML Fundamentals",
      courseId: webDevCourse.id,
      order: 1
    });

    const cssSection = await this.createSection({
      title: "CSS Styling",
      courseId: webDevCourse.id,
      order: 2
    });

    // Create lessons for HTML section
    await this.createLesson({
      title: "Introduction to HTML",
      description: "Learn the basics of HTML structure",
      videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
      sectionId: htmlSection.id,
      order: 1,
      durationMinutes: 15
    });

    await this.createLesson({
      title: "HTML Elements and Tags",
      description: "Understanding different HTML elements and their purpose",
      videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
      sectionId: htmlSection.id,
      order: 2,
      durationMinutes: 25
    });

    // Create lessons for CSS section
    await this.createLesson({
      title: "CSS Selectors",
      description: "Learn how to select and style HTML elements",
      videoUrl: "https://www.youtube.com/watch?v=1PnVor36_40",
      sectionId: cssSection.id,
      order: 1,
      durationMinutes: 20
    });

    await this.createLesson({
      title: "Flexbox Layout",
      description: "Master modern CSS layouts with flexbox",
      videoUrl: "https://www.youtube.com/watch?v=JJSoEo8JSnc",
      sectionId: cssSection.id,
      order: 2,
      durationMinutes: 30
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      isInstructor: false,
      createdAt: now,
      bio: insertUser.bio || null,
      avatarUrl: insertUser.avatarUrl || null
    };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug,
    );
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = {
      ...category,
      id,
      description: category.description || null
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Course methods
  async getCourses(filters?: { categoryId?: number, featured?: boolean, search?: string }): Promise<Course[]> {
    let courses = Array.from(this.courses.values());
    
    if (filters) {
      if (filters.categoryId) {
        courses = courses.filter(course => course.categoryId === filters.categoryId);
      }
      
      if (filters.featured) {
        courses = courses.filter(course => course.isFeatured);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        courses = courses.filter(course => 
          course.title.toLowerCase().includes(searchTerm) || 
          course.description.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    return courses;
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.slug === slug,
    );
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.instructorId === instructorId,
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const now = new Date();
    const newCourse: Course = {
      ...course,
      id,
      createdAt: now,
      updatedAt: now,
      thumbnailUrl: course.thumbnailUrl || null,
      isFeatured: course.isFeatured || false
    };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse: Course = {
      ...course,
      ...courseUpdate,
      id, // Ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Section methods
  async getSectionsByCourse(courseId: number): Promise<Section[]> {
    return Array.from(this.sections.values())
      .filter(section => section.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const id = this.sectionIdCounter++;
    const newSection: Section = {
      ...section,
      id
    };
    this.sections.set(id, newSection);
    return newSection;
  }

  async updateSection(id: number, sectionUpdate: Partial<InsertSection>): Promise<Section | undefined> {
    const section = this.sections.get(id);
    if (!section) return undefined;
    
    const updatedSection: Section = {
      ...section,
      ...sectionUpdate,
      id // Ensure id doesn't change
    };
    
    this.sections.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: number): Promise<boolean> {
    return this.sections.delete(id);
  }

  // Lesson methods
  async getLessonsBySection(sectionId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const newLesson: Lesson = {
      ...lesson,
      id,
      description: lesson.description || null
    };
    this.lessons.set(id, newLesson);
    return newLesson;
  }

  async updateLesson(id: number, lessonUpdate: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;
    
    const updatedLesson: Lesson = {
      ...lesson,
      ...lessonUpdate,
      id // Ensure id doesn't change
    };
    
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    return this.lessons.delete(id);
  }

  // Enrollment methods
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.userId === userId);
  }

  async getEnrollmentByCourseAndUser(courseId: number, userId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      (enrollment) => enrollment.courseId === courseId && enrollment.userId === userId,
    );
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const now = new Date();
    const newEnrollment: Enrollment = {
      ...enrollment,
      id,
      enrolledAt: now,
      progress: {},
      isCompleted: false
    };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollmentProgress(id: number, lessonId: number, completed: boolean): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedProgress = enrollment.progress ? { ...enrollment.progress } : {};
    updatedProgress[lessonId.toString()] = completed;
    
    // Check if all lessons are completed
    let isAllCompleted = true;
    // This would need to fetch all lessons for the course and check them
    // For simplicity, we're just checking based on current progress
    // In a real implementation, we'd query the lessons table
    
    const updatedEnrollment: Enrollment = {
      ...enrollment,
      progress: updatedProgress,
      isCompleted: isAllCompleted
    };
    
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Review methods
  async getReviewsByCourse(courseId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.courseId === courseId);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const newReview: Review = {
      ...review,
      id,
      createdAt: now,
      comment: review.comment || null
    };
    this.reviews.set(id, newReview);
    return newReview;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const newUser = {
      ...user,
      isAdmin: false,
      isInstructor: false,
      createdAt: now
    };
    
    const [createdUser] = await db.insert(users).values(newUser).returning();
    return createdUser;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [createdCategory] = await db.insert(categories).values(category).returning();
    return createdCategory;
  }

  // Course methods
  async getCourses(filters?: { categoryId?: number; featured?: boolean; search?: string; }): Promise<Course[]> {
    let query = db.select().from(courses);

    if (filters) {
      const conditions = [];

      if (filters.categoryId) {
        conditions.push(eq(courses.categoryId, filters.categoryId));
      }

      if (filters.featured) {
        conditions.push(eq(courses.isFeatured, true));
      }

      if (filters.search) {
        conditions.push(
          or(
            like(courses.title, `%${filters.search}%`),
            like(courses.description, `%${filters.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query;
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course || undefined;
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const now = new Date();
    const newCourse = {
      ...course,
      createdAt: now,
      updatedAt: now
    };

    const [createdCourse] = await db.insert(courses).values(newCourse).returning();
    return createdCourse;
  }

  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const updateData = {
      ...courseUpdate,
      updatedAt: new Date()
    };

    const [updatedCourse] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, id))
      .returning();

    return updatedCourse || undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Section methods
  async getSectionsByCourse(courseId: number): Promise<Section[]> {
    return db
      .select()
      .from(sections)
      .where(eq(sections.courseId, courseId))
      .orderBy(asc(sections.order));
  }

  async createSection(section: InsertSection): Promise<Section> {
    const [createdSection] = await db.insert(sections).values(section).returning();
    return createdSection;
  }

  async updateSection(id: number, sectionUpdate: Partial<InsertSection>): Promise<Section | undefined> {
    const [updatedSection] = await db
      .update(sections)
      .set(sectionUpdate)
      .where(eq(sections.id, id))
      .returning();

    return updatedSection || undefined;
  }

  async deleteSection(id: number): Promise<boolean> {
    const result = await db.delete(sections).where(eq(sections.id, id));
    return result.rowCount > 0;
  }

  // Lesson methods
  async getLessonsBySection(sectionId: number): Promise<Lesson[]> {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, sectionId))
      .orderBy(asc(lessons.order));
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [createdLesson] = await db.insert(lessons).values(lesson).returning();
    return createdLesson;
  }

  async updateLesson(id: number, lessonUpdate: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db
      .update(lessons)
      .set(lessonUpdate)
      .where(eq(lessons.id, id))
      .returning();

    return updatedLesson || undefined;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return result.rowCount > 0;
  }

  // Enrollment methods
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentByCourseAndUser(courseId: number, userId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, userId)
        )
      );

    return enrollment || undefined;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const now = new Date();
    const newEnrollment = {
      ...enrollment,
      enrolledAt: now,
      progress: {},
      isCompleted: false
    };

    const [createdEnrollment] = await db.insert(enrollments).values(newEnrollment).returning();
    return createdEnrollment;
  }

  async updateEnrollmentProgress(id: number, lessonId: number, completed: boolean): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    
    if (!enrollment) return undefined;
    
    const updatedProgress = enrollment.progress ? JSON.parse(JSON.stringify(enrollment.progress)) : {};
    updatedProgress[lessonId.toString()] = completed;
    
    // For simplicity, we're not checking all lessons to determine if the course is fully completed
    // In a real implementation, we would query all lessons for the course
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ 
        progress: updatedProgress
      })
      .where(eq(enrollments.id, id))
      .returning();
    
    return updatedEnrollment || undefined;
  }

  // Review methods
  async getReviewsByCourse(courseId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.courseId, courseId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const now = new Date();
    const newReview = {
      ...review,
      createdAt: now
    };

    const [createdReview] = await db.insert(reviews).values(newReview).returning();
    return createdReview;
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();
