
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const TrophyIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 9.75H11.25A3.375 3.375 0 007.5 13.125V18.75m9 0h1.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v9.75c0 1.242 1.008 2.25 2.25 2.25H7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25V9.75M12 9.75a1.5 1.5 0 00-1.5-1.5H9a1.5 1.5 0 00-1.5 1.5V14.25m3-4.5a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V14.25m-3-4.5v3.75" />
  </svg>
);
export default TrophyIcon;