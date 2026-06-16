import { useState } from 'react';
import { ChevronDown, PawPrint, TreePine } from 'lucide-react';
import type { ICategory } from '../types';

interface CategoryTreeProps {
  categories: ICategory[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryTree({ categories, selectedCategory, onSelectCategory }: CategoryTreeProps) {
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set(categories.map(c => c._id)));

  const toggleRoot = (id: string) => {
    setExpandedRoots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCategoryIcon = (name: string) => {
    if (name.toLowerCase().includes('động vật')) return <PawPrint className="w-4 h-4" />;
    if (name.toLowerCase().includes('thực vật')) return <TreePine className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-1">
      {/* All books option */}
      <button
        onClick={() => onSelectCategory('')}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          !selectedCategory
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:bg-primary-light/10 hover:text-primary'
        }`}
      >
        Tất cả sách
      </button>

      {categories.map((root) => (
        <div key={root._id}>
          {/* Root category */}
          <div className="flex items-center">
            <button
              onClick={() => onSelectCategory(root.slug)}
              className={`flex-1 text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === root.slug
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text hover:bg-primary-light/10 hover:text-primary'
              }`}
            >
              {getCategoryIcon(root.name)}
              {root.name}
            </button>
            {root.children && root.children.length > 0 && (
              <button
                onClick={() => toggleRoot(root._id)}
                className="p-2 text-text-secondary hover:text-primary rounded-lg transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedRoots.has(root._id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>

          {/* Children */}
          {expandedRoots.has(root._id) && root.children?.map((child) => (
            <button
              key={child._id}
              onClick={() => onSelectCategory(child.slug)}
              className={`w-full text-left pl-9 pr-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                selectedCategory === child.slug
                  ? 'bg-primary-light/20 text-primary font-medium'
                  : 'text-text-secondary hover:bg-primary-light/5 hover:text-primary'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
