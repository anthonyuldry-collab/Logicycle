
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const MegaphoneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.75h-1.84L4.5 8.25H2.25c-.414 0-.75.336-.75.75v6c0 .414.336.75.75.75H4.5l3.999 4.5h1.84c1.144 0 2.117-.806 2.233-1.938a9.972 9.972 0 000-7.124C12.457 4.556 11.484 3.75 10.34 3.75zM16.5 6.75c1.657 0 3 1.343 3 3s-1.343 3-3 3M15 12a3 3 0 013-3m0 0c0-1.657-1.343-3-3-3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5c3.314 0 6 2.686 6 6s-2.686 6-6 6M18 12a6 6 0 016-6m0 0c0-3.314-2.686-6-6-6" />
  </svg>
);
export default MegaphoneIcon;