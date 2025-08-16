

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const BrainIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.39m3.421 1.756a15.973 15.973 0 013.388-1.618m0 0a15.993 15.993 0 003.422-1.756l-.023-3.05a15.992 15.992 0 00-3.05-.022m0 0a15.996 15.996 0 00-3.422-1.756l-.023-3.05a15.992 15.992 0 00-3.05-.022m0 0a15.972 15.972 0 00-3.388 1.618m0 0a15.992 15.992 0 00-1.622 3.39m3.39-1.622a15.992 15.992 0 00-3.39 1.622m0 0a15.994 15.994 0 00-1.622 3.389m3.39-1.623a15.995 15.995 0 003.39 1.622M12 6.75a5.25 5.25 0 110 10.5 5.25 5.25 0 010-10.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75V12m0 0V14.25m0-2.25H9.75m2.25 0H14.25" />
  </svg>
);
export default BrainIcon;