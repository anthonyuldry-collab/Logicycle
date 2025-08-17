

import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: React.ElementType;
    colorClass: string; // e.g., 'bg-blue-100 text-blue-600'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon: Icon, colorClass }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:scale-105">
            <div className={`p-3 rounded-full ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
            </div>
        </div>
    );
};

export default StatCard;