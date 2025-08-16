import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const IdentificationIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 17.25v1.5A2.25 2.25 0 004.5 21h15z" />
  </svg>
);

export default IdentificationIcon;