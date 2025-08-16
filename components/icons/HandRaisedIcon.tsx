import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const HandRaisedIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM7.518 14.267A8.25 8.25 0 0115 5.25a8.25 8.25 0 01-2.909 6.225l-2.51 2.225" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
  </svg>
);
export default HandRaisedIcon;