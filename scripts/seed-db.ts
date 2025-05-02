import { db } from "../server/db";
import { 
  users, categories, courses, sections, lessons,
  User, Category, Course, Section, Lesson
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Create admin user
  const existingAdminUsers = await db.select().from(users).where(eq(users.username, "admin"));
  
  let adminUser: User;
  
  if (existingAdminUsers.length === 0) {
    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin123");
    
    const [admin] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@learnhub.com",
      firstName: "Admin",
      lastName: "User",
      bio: "LearnHub Administrator",
      avatarUrl: "https://i.pravatar.cc/150?u=admin@learnhub.com",
      isAdmin: true,
      isInstructor: true
    }).returning();
    
    adminUser = admin;
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
    adminUser = existingAdminUsers[0];
  }

  // Create categories
  const existingCategories = await db.select().from(categories);
  
  if (existingCategories.length === 0) {
    console.log("Creating categories...");
    
    await db.insert(categories).values([
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
    ]);
    
    console.log("Categories created.");
  } else {
    console.log("Categories already exist.");
  }

  // Get categories for reference
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, Category>();
  allCategories.forEach(category => categoryMap.set(category.slug, category));

  // Create some sample courses
  const existingCourses = await db.select().from(courses);
  
  if (existingCourses.length === 0) {
    console.log("Creating sample courses...");
    
    // Web Developer Course
    const [webDevCourse] = await db.insert(courses).values({
      title: "Complete Web Developer Bootcamp",
      slug: "web-developer-bootcamp",
      description: "Learn HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer",
      price: 8999, // $89.99
      thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: categoryMap.get("development")!.id,
      level: "beginner",
      durationHours: 36,
      isFeatured: true
    }).returning();

    // Data Science Course
    await db.insert(courses).values({
      title: "Data Science & Machine Learning",
      slug: "data-science-machine-learning",
      description: "Master data analysis, visualization, and machine learning with Python and R",
      price: 12999, // $129.99
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: categoryMap.get("data-science")!.id,
      level: "intermediate",
      durationHours: 42,
      isFeatured: true
    });

    // Marketing Course (Free)
    await db.insert(courses).values({
      title: "Digital Marketing Fundamentals",
      slug: "digital-marketing-fundamentals",
      description: "Learn SEO, social media marketing, email campaigns and analytics basics",
      price: 0, // Free
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      instructorId: adminUser.id,
      categoryId: categoryMap.get("marketing")!.id,
      level: "beginner",
      durationHours: 18,
      isFeatured: true
    });

    console.log("Sample courses created.");

    // Create sections and lessons for web development course
    console.log("Creating sections and lessons...");
    
    // HTML Section
    const [htmlSection] = await db.insert(sections).values({
      title: "HTML Fundamentals",
      courseId: webDevCourse.id,
      order: 1
    }).returning();

    // CSS Section
    const [cssSection] = await db.insert(sections).values({
      title: "CSS Styling",
      courseId: webDevCourse.id,
      order: 2
    }).returning();

    // Lessons for HTML section
    await db.insert(lessons).values([
      {
        title: "Introduction to HTML",
        description: "Learn the basics of HTML structure",
        videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
        sectionId: htmlSection.id,
        order: 1,
        durationMinutes: 15
      },
      {
        title: "HTML Elements and Tags",
        description: "Understanding different HTML elements and their purpose",
        videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
        sectionId: htmlSection.id,
        order: 2,
        durationMinutes: 25
      }
    ]);

    // Lessons for CSS section
    await db.insert(lessons).values([
      {
        title: "CSS Selectors",
        description: "Learn how to select and style HTML elements",
        videoUrl: "https://www.youtube.com/watch?v=1PnVor36_40",
        sectionId: cssSection.id,
        order: 1,
        durationMinutes: 20
      },
      {
        title: "Flexbox Layout",
        description: "Master modern CSS layouts with flexbox",
        videoUrl: "https://www.youtube.com/watch?v=JJSoEo8JSnc",
        sectionId: cssSection.id,
        order: 2,
        durationMinutes: 30
      }
    ]);

    console.log("Sections and lessons created.");
  } else {
    console.log("Courses already exist, skipping sample course creation.");
  }

  console.log("Database seeding completed!");
}

// Run the seeding function
seedDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });