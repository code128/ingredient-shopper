'use client';

import React, { useState, useEffect } from 'react';
import styles from './ShoppingList.module.css';

interface Ingredient {
  id: string;
  name: string;
  category: string | null;
}

interface RecipeIngredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  originalText: string;
  ingredient: Ingredient;
}

interface Recipe {
  id: string;
  title: string;
  isSelected: boolean;
  ingredients: RecipeIngredient[];
}

interface ShoppingListProps {
  recipes: Recipe[];
  onRecipeClick?: (id: string) => void;
}

export default function ShoppingList({ recipes, onRecipeClick }: ShoppingListProps) {
  const selectedRecipes = recipes.filter(r => r.isSelected);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [manuallyOpenedCats, setManuallyOpenedCats] = useState<Set<string>>(new Set());
  const [manuallyCollapsedCats, setManuallyCollapsedCats] = useState<Set<string>>(new Set());

  const handleToggleCollapse = (cat: string, isCollapsed: boolean, isAutoCollapsed: boolean) => {
    if (isCollapsed) {
      if (isAutoCollapsed) {
        setManuallyOpenedCats(prev => { const n = new Set(prev); n.add(cat); return n; });
      }
      setManuallyCollapsedCats(prev => { const n = new Set(prev); n.delete(cat); return n; });
    } else {
      setManuallyCollapsedCats(prev => { const n = new Set(prev); n.add(cat); return n; });
    }
  };

  const toggleChecked = (cat: string, name: string) => {
    const key = `${cat}:::${name}`;
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleOpenCategory = (cat: string) => {
    setManuallyOpenedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  useEffect(() => {
    const selectedRecipes = recipes.filter(r => r.isSelected);
    const categories = Array.from(new Set(
      selectedRecipes.flatMap(r => r.ingredients.map(ri => ri.ingredient.category || 'Other'))
    ));
    
    setCategoryOrder(prev => {
      let base = prev;
      if (base.length === 0) {
        const saved = localStorage.getItem('shoppingListCategoryOrder');
        if (saved) {
          try { base = JSON.parse(saved); } catch {}
        }
      }
      
      const newCats = categories.filter(c => !base.includes(c));
      if (newCats.length > 0) {
        const next = [...base, ...newCats];
        localStorage.setItem('shoppingListCategoryOrder', JSON.stringify(next));
        return next;
      }
      return base;
    });
  }, [recipes]);

  const moveCategory = (cat: string, direction: 'up' | 'down') => {
    const index = categoryOrder.indexOf(cat);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categoryOrder.length) return;

    const newOrder = [...categoryOrder];
    newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, cat);

    setCategoryOrder(newOrder);
    localStorage.setItem('shoppingListCategoryOrder', JSON.stringify(newOrder));
  };

  if (selectedRecipes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p>Select recipes from the sidebar to generate a shopping list.</p>
      </div>
    );
  }

  // Aggregate ingredients
  const aggregated: { 
    [category: string]: { 
      [name: string]: { 
        quantity: number; 
        unit: string | null; 
        originals: string[];
        recipes: { id: string; title: string }[];
      } 
    } 
  } = {};

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ri => {
      const cat = ri.ingredient.category || 'Other';
      const name = ri.ingredient.name;
      const qty = ri.quantity || 0;
      const unit = ri.unit || null;

      if (!aggregated[cat]) aggregated[cat] = {};
      if (!aggregated[cat][name]) {
        aggregated[cat][name] = { quantity: 0, unit: unit, originals: [], recipes: [] };
      }

      const current = aggregated[cat][name];
      
      // Sum if units match, or if both are null/empty
      if (current.unit === unit || (!current.unit && !unit)) {
        current.quantity += qty;
      } else if (qty > 0) {
        // If units differ but we have quantity, we might want to display them separately
        // For now, just append to originals for reference
      }
      current.originals.push(ri.originalText);
      
      if (!current.recipes.some(r => r.id === recipe.id)) {
        current.recipes.push({ id: recipe.id, title: recipe.title });
      }
    });
  });

  const categories = categoryOrder.filter(c => aggregated[c]);
  const missingCats = Object.keys(aggregated).filter(c => !categoryOrder.includes(c));
  const displayCategories = [...categories, ...missingCats.sort()];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitleLine}>
          <h1 className={styles.title}>Shopping List</h1>
          <button 
            className={`${styles.shoppingButton} ${shoppingMode ? styles.shoppingButtonActive : ''}`}
            onClick={() => setShoppingMode(!shoppingMode)}
          >
            {shoppingMode ? 'Exit Shopping Mode' : 'Start Shopping'}
          </button>
        </div>
        <p className={styles.subtitle}>{selectedRecipes.length} {selectedRecipes.length === 1 ? 'recipe' : 'recipes'} selected</p>
      </div>

      {displayCategories.map((cat, index) => {
        const items = Object.entries(aggregated[cat]).sort((a, b) => a[0].localeCompare(b[0]));
        const checkedCount = items.filter(([name]) => checkedItems.has(`${cat}:::${name}`)).length;
        const isAllChecked = items.length > 0 && checkedCount === items.length;
        const isAutoCollapsed = shoppingMode && isAllChecked && !manuallyOpenedCats.has(cat);
        const isCollapsed = manuallyCollapsedCats.has(cat) || isAutoCollapsed;

        return (
          <div key={cat} className={styles.categorySection}>
            <h2 
              className={`${styles.categoryTitle} ${styles.collapsibleTitle}`}
              onClick={() => handleToggleCollapse(cat, isCollapsed, isAutoCollapsed)}
            >
              <span className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ''}`}>▶</span>
              <span>{cat}</span>
              {isCollapsed && (
                <span className={styles.collapsedCount}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              )}
              {!isCollapsed && (
                <div className={styles.reorderControls} onClick={(e) => e.stopPropagation()}>
                  <button 
                    disabled={index === 0} 
                    onClick={() => moveCategory(cat, 'up')}
                    className={styles.reorderButton}
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button 
                    disabled={index === displayCategories.length - 1} 
                    onClick={() => moveCategory(cat, 'down')}
                    className={styles.reorderButton}
                    title="Move Down"
                  >
                    ↓
                  </button>
                </div>
              )}
            </h2>
            {!isCollapsed && (
              <div className={styles.ingredientList}>
                {items.map(([name, details]) => {
                  const isChecked = checkedItems.has(`${cat}:::${name}`);
                  return (
                    <div 
                      key={name} 
                      className={`${styles.ingredientItem} ${shoppingMode ? styles.shoppingModeItem : ''} ${isChecked ? styles.ingredientChecked : ''}`}
                      onClick={() => shoppingMode && toggleChecked(cat, name)}
                    >
                      {shoppingMode && (
                        <div className={styles.checkboxContainer}>
                          <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                            {isChecked && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      <div className={styles.ingredientMain}>
                        <span className={styles.ingredientName}>{name}</span>
                        <div className={styles.recipeChips}>
                          {details.recipes.map(r => (
                            <span 
                              key={r.id} 
                              className={styles.chip} 
                              title={r.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRecipeClick?.(r.id);
                              }}
                            >
                              {r.title.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={styles.ingredientDetails}>
                        {details.quantity > 0 ? (
                          <span>{details.quantity} {details.unit || ''}</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            {details.originals[0]}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
