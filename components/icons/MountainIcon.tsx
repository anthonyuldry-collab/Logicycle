
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

// Using a simplified representation, can be replaced with a more detailed mountain icon
const MountainIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75l3.75-3.75L12 15.75l3.75-3.75L20.25 15.75M4.5 19.5h15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.323 15.75L12 8.25l5.677 7.5" />
  </svg>
);
export default MountainIcon;