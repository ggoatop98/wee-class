import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export function PageHeader({ title, children, centered = false }: PageHeaderProps) {
  return (
    <div className={cn(
      "flex items-center mb-8",
      centered ? "flex-col gap-4" : "justify-between"
    )}>
      <h2 className="text-3xl tracking-tight text-foreground">{title}</h2>
      <div className={cn(
        "flex items-center",
        centered ? "w-full justify-center" : "space-x-2"
      )}>
        {children}
      </div>
    </div>
  );
}
