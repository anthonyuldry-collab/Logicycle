

import React from 'react';

interface SectionWrapperProps {
  title: string;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, actionButton, children }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-700">{title}</h2>
        {actionButton}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionWrapper;