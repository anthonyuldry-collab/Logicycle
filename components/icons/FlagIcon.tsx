

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const FlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 6H2.25m.75 0h.75m-1.5 0H3.75m0-6H2.25m.75 0h.75m-1.5 0H3.75m0 0V9m0 6.75a.75.75 0 00.75.75h14.25a.75.75 0 00.75-.75V9a.75.75 0 00-.75-.75H3.75m14.25 0L15 12l-2.25 2.25-2.25-2.25L7.5 14.25" />
  </svg>
);
export default FlagIcon;