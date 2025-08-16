

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const CyclingIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5M3.75 12h18" /> 
    {/* This is ArrowRightIcon, using as placeholder. For actual cyclist icon: */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5H15V9l2.25-3h1.5L16.5 10.5zM7.5 10.5H9V9L6.75 6h-1.5L7.5 10.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 15.75L12 18l-2.25-2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364 1.522l-1.591 1.591M21 12h-2.25m-1.522 6.364l-1.591-1.591M12 18.75V21m-6.364-1.522l1.591-1.591M3 12h2.25m1.522-6.364l1.591 1.591" />
  </svg>
);
export default CyclingIcon;