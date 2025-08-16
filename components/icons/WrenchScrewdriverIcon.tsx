
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const WrenchScrewdriverIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 001.064-2.382V6.75M11.42 15.17A2.25 2.25 0 0015.17 11.42M6.75 8.625l2.472 2.472A3.375 3.375 0 0011.608 12h2.472M6.75 8.625A3.375 3.375 0 016.75 3h.008v.008h-.008v-.008zm0 0H2.25m4.5 0H9" />
  </svg>
);
export default WrenchScrewdriverIcon;