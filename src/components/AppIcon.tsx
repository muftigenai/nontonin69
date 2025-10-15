import React from 'react';

interface AppIconProps {
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ className = 'h-7 w-7' }) => {
  return (
    <img 
      src="/app-icon.png" 
      alt="Nontonin Logo" 
      className={className} 
    />
  );
};

export default AppIcon;