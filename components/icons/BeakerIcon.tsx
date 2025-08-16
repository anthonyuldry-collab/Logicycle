

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BeakerIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.03 4.03A7.505 7.505 0 0112 3.75a7.505 7.505 0 011.97.28M14.25 9.75a4.503 4.503 0 00-4.5 4.5v1.5M6.375 9.75a4.503 4.503 0 014.5 4.5v1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h16.5M12 3v1.5M12 21v-1.5" />
  </svg>
);
export default BeakerIcon;