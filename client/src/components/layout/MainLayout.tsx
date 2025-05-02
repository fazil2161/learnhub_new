import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
