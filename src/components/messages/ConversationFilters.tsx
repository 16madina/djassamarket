import { Button } from '@/components/ui/button';
import { ShoppingBag, User } from 'lucide-react';

interface ConversationFiltersProps {
  filter: 'all' | 'buying' | 'selling';
  onFilterChange: (filter: 'all' | 'buying' | 'selling') => void;
}

export const ConversationFilters = ({ filter, onFilterChange }: ConversationFiltersProps) => {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="flex-1"
      >
        Toutes
      </Button>
      <Button
        variant={filter === 'buying' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('buying')}
        className="flex-1"
      >
        <ShoppingBag className="h-4 w-4 mr-1" />
        Achats
      </Button>
      <Button
        variant={filter === 'selling' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('selling')}
        className="flex-1"
      >
        <User className="h-4 w-4 mr-1" />
        Ventes
      </Button>
    </div>
  );
};
