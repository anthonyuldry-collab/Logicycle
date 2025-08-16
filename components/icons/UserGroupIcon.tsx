

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const UserGroupIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.007-7.032c.001-.144.002-.288.002-.432C17.054 8.318 16.326 7.5 15.5 7.5c-.825 0-1.554.818-1.556 1.802c0 .144.001.287.002.432m0 7.032V18.75m0-10.5c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 3.314 2.686 6 6 6s6-2.686 6-6m-1.732 5.175c-.223.047-.447.1-.676.158A6.03 6.03 0 017.5 9.75c1.036 0 1.98.224 2.79.622m0 0A3.001 3.001 0 0013.5 7.5c0-1.06-.526-2.004-1.372-2.618M15.75 9.75a3 3 0 00-3-3M4.5 12a7.5 7.5 0 0115 0m-15 0a7.5 7.5 0 00-2.251 5.025A9.094 9.094 0 013 18.75m0-1.5a2.625 2.625 0 100-5.25 2.625 2.625 0 000 5.25" />
  </svg>
);
export default UserGroupIcon;