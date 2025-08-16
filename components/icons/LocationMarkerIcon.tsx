

import React from 'react';

// Using MapPinIcon and renaming it for semantic clarity, or use a distinct location marker if available.
// For this example, let's assume MapPinIcon is suitable for "LocationMarker"
// If a different visual is needed, the SVG path should be changed.

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const LocationMarkerIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
export default LocationMarkerIcon;