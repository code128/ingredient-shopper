'use client';

import React from 'react';
import styles from './Sidebar.module.css';
import AddRecipeForm from './AddRecipeForm';

interface Recipe {
  id: string;
  title: string;
  isSelected: boolean;
}

interface SidebarProps {
  recipes: Recipe[];
  onToggleSelection: (id: string) => void;
  activeRecipeId?: string;
  onSelectRecipe: (id: string) => void;
  onRecipeAdded: () => void;
}

export default function Sidebar({ recipes, onToggleSelection, activeRecipeId, onSelectRecipe, onRecipeAdded }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>My Recipes</h2>
      
      <div className={styles.recipeList}>
        {recipes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No recipes added yet.</p>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`${styles.recipeItem} ${activeRecipeId === recipe.id ? styles.recipeItemActive : ''}`}
              onClick={() => onSelectRecipe(recipe.id)}
            >
              <div
                className={`${styles.checkbox} ${recipe.isSelected ? styles.checkboxChecked : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection(recipe.id);
                }}
              >
                {recipe.isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span className={styles.recipeTitle}>{recipe.title}</span>
            </div>
          ))
        )}
      </div>
      <AddRecipeForm onRecipeAdded={onRecipeAdded} />
    </aside>
  );
}
