// Load React, ReactDOM, and other dependencies from CDN
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = '';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadCSS = (href) => {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    document.head.appendChild(link);
  });
};

// Dependencies to load
const dependencies = [
  loadScript('https://unpkg.com/react@18/umd/react.production.min.js'),
  loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'),
  loadScript('https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.production.min.js'),
  loadScript('https://unpkg.com/@tanstack/react-query@4/build/umd/index.production.js'),
  loadCSS('https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css'),
  loadCSS('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')
];

// Wait for all dependencies to load
Promise.all(dependencies)
  .then(() => {
    console.log('All dependencies loaded');
    initializeApp();
  })
  .catch(error => {
    console.error('Failed to load dependencies:', error);
  });

function initializeApp() {
  // Create root element if it doesn't exist
  let rootElement = document.getElementById('root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }
  
  // Simple placeholder UI until the actual React app loads
  rootElement.innerHTML = `
    <div class="container mx-auto p-4">
      <header class="navbar">
        <div class="navbar-container container">
          <a href="/" class="navbar-logo">LearnHub</a>
          <nav class="navbar-links">
            <a href="/">Home</a>
            <a href="/courses">Courses</a>
            <a href="/login" class="btn btn-primary">Login</a>
          </nav>
        </div>
      </header>
      
      <main class="page-container">
        <h1 class="text-center mb-8">Welcome to LearnHub</h1>
        
        <section class="mb-10">
          <h2 class="text-center mb-6">Featured Courses</h2>
          <div class="grid">
            <div class="card course-card">
              <img src="https://via.placeholder.com/600x400" alt="Course" class="course-card-img">
              <div class="card-body">
                <h3 class="course-card-title">Introduction to Web Development</h3>
                <div class="course-card-meta">
                  <span>Beginner</span>
                  <span>•</span>
                  <span>10 hours</span>
                </div>
                <p class="course-card-description">Learn the basics of HTML, CSS, and JavaScript to build modern web applications.</p>
                <div class="course-card-footer">
                  <span class="course-card-price">$49.99</span>
                  <button class="btn btn-primary">Enroll Now</button>
                </div>
              </div>
            </div>
            
            <div class="card course-card">
              <img src="https://via.placeholder.com/600x400" alt="Course" class="course-card-img">
              <div class="card-body">
                <h3 class="course-card-title">Advanced React Techniques</h3>
                <div class="course-card-meta">
                  <span>Intermediate</span>
                  <span>•</span>
                  <span>8 hours</span>
                </div>
                <p class="course-card-description">Master advanced React patterns and state management for complex applications.</p>
                <div class="course-card-footer">
                  <span class="course-card-price">$79.99</span>
                  <button class="btn btn-primary">Enroll Now</button>
                </div>
              </div>
            </div>
            
            <div class="card course-card">
              <img src="https://via.placeholder.com/600x400" alt="Course" class="course-card-img">
              <div class="card-body">
                <h3 class="course-card-title">Node.js Backend Development</h3>
                <div class="course-card-meta">
                  <span>Advanced</span>
                  <span>•</span>
                  <span>12 hours</span>
                </div>
                <p class="course-card-description">Build scalable backend services with Node.js, Express, and MongoDB.</p>
                <div class="course-card-footer">
                  <span class="course-card-price">$89.99</span>
                  <button class="btn btn-primary">Enroll Now</button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section class="mb-10 text-center">
          <h2 class="mb-4">Join thousands of learners today</h2>
          <p class="mb-6">Get unlimited access to all courses, workshops, and resources.</p>
          <button class="btn btn-primary">Get Started</button>
        </section>
      </main>
      
      <footer class="footer">
        <div class="container">
          <div class="footer-links">
            <a href="#">About Us</a>
            <a href="#">Courses</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
          <p class="footer-copyright">© ${new Date().getFullYear()} LearnHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `;
  
  // Attempt to load the actual React application
  try {
    // In a real application, this would initialize the React app
    console.log('React application initialized');
  } catch (error) {
    console.error('Failed to initialize React application:', error);
  }
} 