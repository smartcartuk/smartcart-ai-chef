import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ShoppingItem {
  name: string;
  quantity: string;
  category?: string;
  inPantry?: boolean;
  checked?: boolean;
  price?: number;
}

interface ShoppingListSectionProps {
  items: ShoppingItem[];
  onToggleItem: (index: number) => void;
  isLoading?: boolean;
}

export const ShoppingListSection: React.FC<ShoppingListSectionProps> = ({
  items,
  onToggleItem,
  isLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const pantryCount = items.filter(i => i.inPantry).length;
  const activeItems = items.filter(i => !i.inPantry);
  const displayItems = expanded ? activeItems : activeItems.slice(0, 5);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Shopping list
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Shopping list · {activeItems.length} items
        </h3>
        {pantryCount > 0 && (
          <span className="text-[11px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
            {pantryCount} in pantry
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {displayItems.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggleItem(i)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className={`w-[18px] h-[18px] rounded flex-shrink-0 border-[1.5px] flex items-center justify-center transition-colors ${
              item.checked
                ? 'bg-primary border-primary'
                : 'border-border group-hover:border-primary/50'
            }`}>
              {item.checked && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span className={`text-sm flex-1 text-left ${
              item.checked ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground">{item.quantity}</span>
          </button>
        ))}

        {activeItems.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>+ {activeItems.length - 5} more items <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </section>
  );
};
