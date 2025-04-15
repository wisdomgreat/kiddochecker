
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionLink?: string;
  onClickAction?: () => void;
  className?: string; // Adding className prop to fix errors
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  actionLabel,
  actionLink,
  onClickAction,
  className,
}: StatCardProps) => {
  const handleActionClick = (e: React.MouseEvent) => {
    if (onClickAction) {
      e.preventDefault();
      onClickAction();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            {React.cloneElement(icon as React.ReactElement, {
              className: "text-purple-600",
            })}
          </div>
        </div>
        {actionLabel && (
          <div className="mt-4">
            <a
              href={actionLink || "#"}
              onClick={handleActionClick}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {actionLabel}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
