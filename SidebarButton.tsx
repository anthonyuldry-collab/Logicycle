


import React, { useState } from 'react';

interface SidebarButtonProps {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ label, icon: IconComponent, isActive, onClick }) => {
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  let dynamicStyle: React.CSSProperties = {};
  let iconStyle: React.CSSProperties = {};
  let buttonBaseClasses = "w-full flex items-center text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ";

  if (isActive) {
    dynamicStyle.backgroundColor = 'var(--theme-primary-hover-bg)';
    dynamicStyle.color = 'var(--theme-primary-text)';
    iconStyle.color = 'var(--theme-primary-text)';
    buttonBaseClasses += 'shadow-lg';
  } else if (isButtonHovered) {
    dynamicStyle.backgroundColor = 'var(--theme-primary-hover-bg)';
    dynamicStyle.color = 'var(--theme-primary-text)';
    iconStyle.color = 'var(--theme-primary-text)';
  } else {
    dynamicStyle.color = 'var(--theme-primary-text)';
    dynamicStyle.opacity = 0.9;
    iconStyle.color = 'var(--theme-accent-color)';
    // Add a subtle shadow to the icon for better contrast against various background colors
    iconStyle.filter = 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.4))';
  }

  return (
    <button
      onClick={onClick}
      className={buttonBaseClasses}
      style={dynamicStyle}
      onMouseEnter={() => setIsButtonHovered(true)}
      onMouseLeave={() => setIsButtonHovered(false)}
      aria-current={isActive ? "page" : undefined}
    >
      {IconComponent && <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" style={iconStyle} />}
      {label}
    </button>
  );
};

export default SidebarButton;