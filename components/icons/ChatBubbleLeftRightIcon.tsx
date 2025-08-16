

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const ChatBubbleLeftRightIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.07.107-2.13-.387-2.754-1.306l-1.424-2.847a.75.75 0 00-1.254 0l-1.424 2.847c-.624.92-1.684 1.413-2.754 1.306l-3.722-.372c-1.133-.113-1.98-1.057-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097L6.75 8.25m.75 12.44l-2.25-2.25m0 0l2.25-2.25M16.5 20.69l2.25-2.25m0 0l-2.25-2.25m-6-13.81l2.25 2.25m0 0l2.25-2.25M12 5.39l-2.25 2.25m0 0l-2.25-2.25" />
  </svg>
);
export default ChatBubbleLeftRightIcon;