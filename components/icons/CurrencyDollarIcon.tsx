

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const CurrencyDollarIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.912-.724 1.99-1.118 3.078-1.118 1.176 0 2.22.466 3.012 1.226M12 6v12m0 0H9m3 0h3" />
  </svg>
);
export default CurrencyDollarIcon;