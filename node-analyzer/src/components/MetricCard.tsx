import React from 'react';

interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    variant: 'yellow' | 'red' | 'green';
  }
  
  export const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, description, variant }) => {
    const bgColor = {
      yellow: 'bg-yellow-50',
      red: 'bg-red-50',
      green: 'bg-green-50',
    }[variant];
  
    const textColor = {
      yellow: 'text-yellow-700',
      red: 'text-red-700',
      green: 'text-green-700',
    }[variant];
  
    return (
      <div className={`p-4 ${bgColor} rounded-lg`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    );
  };
  