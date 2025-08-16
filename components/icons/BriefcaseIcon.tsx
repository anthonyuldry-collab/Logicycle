

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BriefcaseIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25h-13.5a2.25 2.25 0 01-2.25-2.25V14.15M12 12.375a3.75 3.75 0 016.338 0V14.15a2.25 2.25 0 01-2.25 2.25h-1.888a2.25 2.25 0 01-2.25-2.25V12.375zM12 12.375a3.75 3.75 0 00-6.338 0V14.15a2.25 2.25 0 002.25 2.25h1.888a2.25 2.25 0 002.25-2.25V12.375zM12 3.75V9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a2.25 2.25 0 012.25 2.25v.75h-4.5v-.75A2.25 2.25 0 0112 3.75z" />
  </svg>
);
export default BriefcaseIcon;