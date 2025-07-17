import React from "react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h2>
      <div className="flex items-center space-x-2">
        {children}
      </div>
    </div>
  );
}
