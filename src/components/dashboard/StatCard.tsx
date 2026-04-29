
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  actionLabel,
  onAction,
  trend
}) => {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2 rounded-lg bg-gray-50', iconColor.includes('blue') && 'bg-blue-50')}>
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}
                  </span>
                  <span className="text-xs text-gray-500">from last week</span>
                </div>
              )}
            </div>

            {actionLabel && onAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
                className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

