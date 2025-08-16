
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const TrashIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0c-.342-.052-.682-.107-1.022-.166m-1.022-.165L6.11 19.673a2.25 2.25 0 002.244 2.077H15.646a2.25 2.25 0 002.244-2.077L18.16 5.79m-14.456 0l1.08 11.873A1.125 1.125 0 006.912 19.5h10.176c.524 0 .979-.396 1.103-.912l1.08-11.873m-12.234 0c-.342.052-.682-.107-1.022-.166" />
  </svg>
);
export default TrashIcon;