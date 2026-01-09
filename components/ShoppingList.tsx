import React, { useState } from 'react';
import { Ingredient } from '../types';
import { ShoppingCart, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  ingredients: Ingredient[];
  language: 'en' | 'zh-TW';
}

const IngredientImage = ({ term }: { term?: string }) => {
  const [error, setError] = useState(false);
  const imageUrl = term && !error
    ? `https://www.themealdb.com/images/ingredients/${encodeURIComponent(term)}-Small.png`
    : null;

  return (
    <div className="w-10 h-10 relative mx-auto flex items-center justify-center">
      {/* Fallback Icon - Only render if no image or error */}
      {(!imageUrl) && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-muted/10 rounded-full text-xs text-brand-muted">
          🥘
        </div>
      )}
      
      {/* Actual Image */}
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={term} 
          className="relative z-10 w-full h-full object-contain transition-opacity duration-200"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export const ShoppingList: React.FC<Props> = ({ ingredients, language }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleItem = (item: string) => {
    const next = new Set(checkedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setCheckedItems(next);
  };

  const toggleCategory = (category: string) => {
    const next = new Set(collapsedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setCollapsedCategories(next);
  };

  // Group by category
  const grouped = ingredients.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  const t = {
    item: language === 'zh-TW' ? '項目' : 'Item',
    qty: language === 'zh-TW' ? '數量' : 'Qty',
    notes: language === 'zh-TW' ? '備註' : 'Notes',
    check: language === 'zh-TW' ? '確認' : 'Check'
  };

  return (
    <div className="bg-brand-surface p-8 rounded-3xl shadow-soft">
      <div className="flex items-center gap-3 mb-8 text-brand-primary">
        <div className="bg-brand-primary/10 p-3 rounded-2xl">
          <ShoppingCart size={24} />
        </div>
        <h2 className="text-2xl font-black text-brand-text">{language === 'zh-TW' ? '採購清單' : 'Shopping List'}</h2>
      </div>
      
      <div className="space-y-4">
        {Object.keys(grouped).map((category) => {
          const isCollapsed = collapsedCategories.has(category);
          const itemCount = grouped[category].length;
          
          return (
            <div key={category} className="overflow-hidden rounded-2xl bg-brand-bg/50 border border-transparent transition-all hover:bg-brand-bg">
              <button 
                onClick={() => toggleCategory(category)}
                className="w-full bg-brand-secondary/30 px-6 py-4 font-bold text-brand-text uppercase tracking-wide text-sm flex items-center justify-between hover:bg-brand-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                   <span>📂</span> 
                   <span>{category}</span>
                   <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-brand-text/60 normal-case">{itemCount}</span>
                </div>
                {isCollapsed ? <ChevronRight size={18} className="text-brand-text/50" /> : <ChevronDown size={18} className="text-brand-text/50" />}
              </button>
              
              {!isCollapsed && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-brand-primary/10">
                      <tr>
                        <th className="w-16 p-4 text-center text-brand-muted">{t.check}</th>
                        <th className="w-16 p-4"></th> {/* Image Column */}
                        <th className="p-4 text-brand-muted font-bold">{t.item}</th>
                        <th className="p-4 w-28 text-brand-muted font-bold">{t.qty}</th>
                        <th className="p-4 hidden sm:table-cell text-brand-muted font-bold">{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-primary/5">
                      {grouped[category].map((ing, idx) => {
                        const key = `${ing.item}-${idx}`;
                        const isChecked = checkedItems.has(key);

                        return (
                          <tr 
                            key={key} 
                            onClick={() => toggleItem(key)}
                            className={`cursor-pointer transition-all hover:bg-white ${isChecked ? 'bg-brand-bg opacity-60' : ''}`}
                          >
                            <td className="p-4 text-center">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mx-auto
                                ${isChecked 
                                  ? 'bg-brand-success border-brand-success text-white' 
                                  : 'border-brand-muted/30 bg-white'}`}
                              >
                                {isChecked && <Check size={14} strokeWidth={4} />}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <IngredientImage term={ing.imageTerm} />
                            </td>
                            <td className={`p-4 font-bold text-base ${isChecked ? 'line-through text-brand-muted' : 'text-brand-text'}`}>
                              {ing.item}
                            </td>
                            <td className={`p-4 font-medium ${isChecked ? 'text-brand-muted' : 'text-brand-text/70'}`}>
                              {ing.quantity} {ing.unit}
                            </td>
                            <td className={`p-4 hidden sm:table-cell italic ${isChecked ? 'text-brand-muted' : 'text-brand-text/50'}`}>
                              {ing.notes}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};