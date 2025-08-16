

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BuildingOfficeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 21V3.75m7.5 17.25V3.75M3 13.5h18M3 7.5h18" />
  </svg>
);
export default BuildingOfficeIcon;