import React from 'react';
import { CalendarDays, ListChecks, BarChart3, User } from 'lucide-react';

interface MobileNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onNavigate }) => {
  const items = [
    { id: 'plan', label: 'Plan', icon: CalendarDays },
    { id: 'list', label: 'List', icon: ListChecks },
    { id: 'compare', label: 'Compare', icon: BarChart3 },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-50 pb-safe md:hidden">
      <div className="flex justify-around py-2">
        {items.map(item => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
