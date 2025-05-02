import { useLocation } from "wouter";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use window.history.pushState to ensure back button works properly
    window.history.pushState(null, "", `/courses?category=${category.slug}`);
    navigate(`/courses?category=${category.slug}`);
  };
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "laptop-code":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>
            <path d="m9 10 2 2 4-4"></path>
          </svg>
        );
      case "chart-line":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
        );
      case "database":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        );
      case "paint-brush":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.37 2.63 14 7l-1.87-1.87"></path>
            <path d="M12.13 5.13 6.2 11.06a1 1 0 0 0 0 1.42l2.61 2.61c.39.39 1.02.39 1.41 0l5.93-5.93"></path>
            <path d="M15.5 13.5 19 17c.55.55.54 1.43-.02 1.97a1.82 1.82 0 0 1-1.14.39c-.23.06-.46.09-.7.09-.7 0-1.32-.44-2.52-1.19M18 3l3 3"></path>
            <path d="M8.83 16.22 4.83 19a2.83 2.83 0 0 0 4.1 4.1l2.78-4"></path>
          </svg>
        );
      case "bullhorn":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 18-5v12L3 13"></path>
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
          </svg>
        );
      case "camera":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
        );
      case "heartbeat":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path>
          </svg>
        );
      case "language":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 8 6 6"></path>
            <path d="m4 14 6-6 2-3"></path>
            <path d="M2 5h12"></path>
            <path d="M7 2h1"></path>
            <path d="m22 22-5-10-5 10"></path>
            <path d="M14 18h6"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6V2H8"></path>
            <path d="m16 6 2-2-2-2"></path>
            <path d="M12 18v4h4"></path>
            <path d="m8 18-2 2 2 2"></path>
            <path d="M6 12H2v4"></path>
            <path d="m6 8-2-2 2-2"></path>
            <path d="M18 12h4v-4"></path>
            <path d="m18 16 2 2-2 2"></path>
            <path d="M12 12v.01"></path>
          </svg>
        );
    }
  };

  return (
    <a 
      href={`/courses?category=${category.slug}`}
      onClick={handleClick}
      className="group bg-gray-50 rounded-xl p-6 hover:bg-primary hover:shadow-md transition duration-300 flex flex-col items-center cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-white/20 mb-4">
          <span className="text-primary group-hover:text-white">
            {getIconComponent(category.iconName)}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white mb-2">{category.name}</h3>
        <p className="text-sm text-gray-500 group-hover:text-white/80 text-center">{category.description}</p>
      </a>
  );
};

export default CategoryCard;
