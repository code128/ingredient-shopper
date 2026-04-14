'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  colorIndex: number;
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shoppingListCheckedItems');
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Failed to load checked items', e);
    }
  }, []);

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
      try {
        localStorage.setItem('shoppingListCheckedItems', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to save checked items', e);
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

  const clearCheckedItems = () => {
    setCheckedItems(new Set());
    try {
      localStorage.removeItem('shoppingListCheckedItems');
    } catch (e) {
      console.error('Failed to clear checked items', e);
    }
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
        recipes: { id: string; title: string; colorIndex: number }[];
      } 
    } 
  } = {};

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ri => {
      // Water is always assumed to be on hand — skip it
      if (ri.ingredient.name.trim().toLowerCase() === 'water') return;

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
        current.recipes.push({ id: recipe.id, title: recipe.title, colorIndex: recipe.colorIndex });
      }
    });
  });

  const categories = categoryOrder.filter(c => aggregated[c]);
  const missingCats = Object.keys(aggregated).filter(c => !categoryOrder.includes(c));
  const displayCategories = [...categories, ...missingCats.sort()];

  const handlePrint = () => {
    const recipeTitles = selectedRecipes.map(r => r.title).join(', ');
    const rows = displayCategories.map(cat => {
      const items = Object.entries(aggregated[cat]).sort((a, b) => a[0].localeCompare(b[0]));
      const itemRows = items.map(([name, details]) => {
        const amtText = details.quantity > 0
          ? `${details.quantity}${details.unit ? ' ' + details.unit : ''}`
          : details.originals[0] || '';
        const recipePills = details.recipes
          .map(r => `<span class="pill">${r.title}</span>`)
          .join('');
        return `<tr>
          <td class="check">&#x2610;</td>
          <td class="name"><span class="name-row"><span class="name-text">${name}</span><span class="pills">${recipePills}</span></span></td>
          <td class="amt">${amtText}</td>
        </tr>`;
      }).join('');
      return `<tbody>
        <tr class="cat-header"><td colspan="3">${cat}</td></tr>
        ${itemRows}
      </tbody>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shopping List</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 2rem; max-width: 680px; margin: auto; }
    h1 { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.25rem; }
    .meta { font-size: 0.8rem; color: #666; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    .cat-header td { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #555; padding: 1rem 0 0.4rem; border-bottom: 1.5px solid #111; }
    tr:not(.cat-header) td { padding: 0.55rem 0.25rem; border-bottom: 1px solid #e5e5e5; font-size: 0.95rem; vertical-align: middle; }
    td.check { width: 28px; font-size: 1.1rem; color: #bbb; padding-right: 0.5rem; }
    td.name { font-weight: 500; text-transform: capitalize; }
    td.amt { text-align: right; color: #555; font-size: 0.85rem; white-space: nowrap; padding-left: 0.75rem; }
    .name-row { display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .name-text { text-transform: capitalize; }
    .pills { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; }
    .pill { font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 999px; background: #f0f0f0; color: #555; border: 1px solid #ddd; white-space: nowrap; }
    @media print {
      body { padding: 1rem; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>&#x1F6D2; Shopping List</h1>
  <p class="meta">${selectedRecipes.length} ${selectedRecipes.length === 1 ? 'recipe' : 'recipes'}: ${recipeTitles}</p>
  <table>${rows}</table>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=720,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitleLine}>
          <h1 className={styles.title}>Shopping List</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.printButton}
              onClick={handlePrint}
              title="Print shopping list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
            <button 
              className={`${styles.shoppingButton} ${shoppingMode ? styles.shoppingButtonActive : ''}`}
              onClick={() => setShoppingMode(!shoppingMode)}
            >
              {shoppingMode ? 'Exit Shopping Mode' : 'Start Shopping'}
            </button>
          </div>
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
            <div className={`${styles.collapsibleWrapper} ${isCollapsed ? styles.listCollapsed : ''}`}>
              <div className={styles.listInner}>
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
                            <AnimatePresence>
                              {isChecked && (
                                <motion.svg 
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </motion.svg>
                              )}
                            </AnimatePresence>
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
                              style={{ 
                                '--chip-color': `var(--palette-${r.colorIndex})`,
                                cursor: shoppingMode ? 'default' : 'pointer'
                              } as React.CSSProperties}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!shoppingMode) {
                                  onRecipeClick?.(r.id);
                                }
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
              </div>
            </div>
          </div>
        );
      })}

      {shoppingMode && checkedItems.size > 0 && (
        <div className={styles.clearContainer}>
          <button className={styles.clearButton} onClick={clearCheckedItems}>
            Uncheck All Ingredients
          </button>
        </div>
      )}
    </div>
  );
}
