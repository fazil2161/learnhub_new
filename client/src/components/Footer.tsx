import { Link } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  HelpCircle, 
  Shield, 
  FileText 
} from "lucide-react";

const Footer = () => {
  // Define modals handler functions
  const showAboutModal = () => {
    alert("About LearnHub: We're an educational platform dedicated to providing high-quality courses across multiple disciplines. Founded in 2024, we've helped thousands of learners worldwide achieve their educational goals.");
  };

  const showTermsModal = () => {
    alert("Terms of Service: By using LearnHub, you agree to our terms which include respecting intellectual property rights, maintaining appropriate conduct, and understanding our refund policies. Full terms available upon request.");
  };

  const showPrivacyModal = () => {
    alert("Privacy Policy: LearnHub is committed to protecting your personal information. We collect minimal data necessary to provide our services and never share your information with third parties without consent.");
  };

  const showHelpModal = () => {
    alert("Help Center: For assistance with courses, technical issues, or account questions, please contact our support team at support@learnhub.com or call 1-800-LEARN-HUB.");
  };

  const showContactModal = () => {
    alert("Contact Us: Have questions or feedback? Email us at info@learnhub.com or call 1-800-LEARN-HUB. Our office hours are Monday-Friday, 9am-5pm EST.");
  };

  const showCareersModal = () => {
    alert("Careers at LearnHub: Join our growing team of educators, developers, and content creators. We offer competitive benefits and a flexible work environment. Current openings available upon request.");
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="text-2xl font-bold mb-4">LearnHub</div>
            <p className="text-primary-foreground/80 mb-6">
              Expand your skills, advance your career, and connect with a global community of learners.
            </p>
            <div className="flex flex-col space-y-2 mb-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>info@learnhub.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>1-800-LEARN-HUB</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>123 Education Ave, Knowledge City</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); alert("Facebook page would open here");}}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); alert("Twitter page would open here");}}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); alert("Instagram page would open here");}}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); alert("LinkedIn page would open here");}}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {e.preventDefault(); alert("YouTube channel would open here");}}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/courses">
                  <a className="text-primary-foreground/80 hover:text-primary-foreground">Browse Courses</a>
                </Link>
              </li>
              <li>
                <Link href="/courses">
                  <a className="text-primary-foreground/80 hover:text-primary-foreground">Categories</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?featured=true">
                  <a className="text-primary-foreground/80 hover:text-primary-foreground">Popular Courses</a>
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Instructor Directory: Our platform features expert instructors from around the world, specializing in various fields including technology, business, arts, and more.");
                  }}
                >
                  Instructors
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Become an Instructor: Share your expertise with our global community. Instructors can create courses, build their audience, and earn revenue through our platform.");
                  }}
                >
                  Become a Teacher
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showAboutModal();
                  }}
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showCareersModal();
                  }}
                >
                  Careers
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Blog: Our blog features articles on education trends, learning tips, career advice, and success stories from our students and instructors.");
                  }}
                >
                  Blog
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Press: LearnHub has been featured in Forbes, TechCrunch, and Education Weekly for our innovative approach to online learning.");
                  }}
                >
                  Press
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showContactModal();
                  }}
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showHelpModal();
                  }}
                >
                  <div className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    <span>Help Center</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showTermsModal();
                  }}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Terms of Service</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    showPrivacyModal();
                  }}
                >
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Privacy Policy</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Cookie Settings: Manage your cookie preferences. We use cookies to enhance your browsing experience and analyze site traffic.");
                  }}
                >
                  Cookie Settings
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Accessibility: We're committed to making our platform accessible to all users. Learn about our accessibility features and how to report accessibility issues.");
                  }}
                >
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/80 text-sm">© {new Date().getFullYear()} LearnHub, Inc. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a 
              href="#" 
              className="text-primary-foreground/80 hover:text-primary-foreground text-sm"
              onClick={(e) => {
                e.preventDefault();
                showTermsModal();
              }}
            >
              Terms
            </a>
            <a 
              href="#" 
              className="text-primary-foreground/80 hover:text-primary-foreground text-sm"
              onClick={(e) => {
                e.preventDefault();
                showPrivacyModal();
              }}
            >
              Privacy
            </a>
            <a 
              href="#" 
              className="text-primary-foreground/80 hover:text-primary-foreground text-sm"
              onClick={(e) => {
                e.preventDefault();
                alert("Cookie Policy: Learn how we use cookies, what types of cookies we use, and how you can control them.");
              }}
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
