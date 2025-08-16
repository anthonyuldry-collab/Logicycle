

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const CakeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.75c-1.34.973-2.97.553-4.596-.924a4.875 4.875 0 00-6.808 0c-1.625 1.477-3.256 1.897-4.596.924V21a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-5.25zm0 0V9.75A2.25 2.25 0 0018.75 7.5h-1.066a4.875 4.875 0 00-1.717-1.054M3 15.75V9.75A2.25 2.25 0 015.25 7.5h1.066c.679.316 1.29.708 1.717 1.054M12 9.75a2.625 2.625 0 110-5.25 2.625 2.625 0 010 5.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3V1.5M12 3c.18-.007.358-.011.537-.011a4.876 4.876 0 014.127 2.31M12 3c-.18-.007-.358-.011-.537-.011A4.876 4.876 0 007.336 5.299" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.75h9" />
  </svg>
);
export default CakeIcon;