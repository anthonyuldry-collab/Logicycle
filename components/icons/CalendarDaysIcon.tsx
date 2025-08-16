

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const CalendarDaysIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18.75zM15 15h.008v.008H15V15zm0 2.25h.008v.008H15v-.008zM9.75 11.25h.008v.008H9.75V11.25zm0 2.25h.008v.008H9.75V13.5zM7.5 11.25h.008v.008H7.5V11.25zm0 2.25h.008v.008H7.5V13.5z" />
  </svg>
);
export default CalendarDaysIcon;