
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const LungsIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5V9m0 0a2.25 2.25 0 00-2.25 2.25v3.75a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25v-3a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 002.25-2.25V4.5m0 4.5a2.25 2.25 0 012.25 2.25v3.75a2.25 2.25 0 002.25 2.25h2.25a2.25 2.25 0 002.25-2.25v-3a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5" />
  </svg>
);
export default LungsIcon;
