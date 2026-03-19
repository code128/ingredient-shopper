'use client';

import React from 'react';
import styles from './Sidebar.module.css';
import AddRecipeForm from './AddRecipeForm';
import { useSession, signIn, signOut } from "next-auth/react";

interface Recipe {
  id: string;
  title: string;
  isSelected: boolean;
  colorIndex?: number;
}

interface SidebarProps {
  recipes: Recipe[];
  onToggleSelection: (id: string) => void;
  activeRecipeId?: string;
  onSelectRecipe: (id: string) => void;
  onRecipeAdded: () => void;
  onClose?: () => void;
}

export default function Sidebar({ recipes, onToggleSelection, activeRecipeId, onSelectRecipe, onRecipeAdded, onClose }: SidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Recipes</h2>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>
      
      <div className={styles.authSection}>
        {session ? (
          <div className={styles.userInfo}>
            {session.user?.image && (
              <img src={session.user.image} alt="Profile" className={styles.avatar} referrerPolicy="no-referrer" />
            )}
            <div className={styles.userMeta}>
              <span className={styles.userName}>{session.user?.name || 'User'}</span>
              <button className={styles.authButton} onClick={() => signOut()}>Sign Out</button>
            </div>
          </div>
        ) : (
          <button className={styles.authButton} onClick={() => signIn('google')}>
            Sign in with Google
          </button>
        )}
      </div>
      
      <div className={styles.recipeList}>
        {recipes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No recipes added yet.</p>
        ) : (
          [...recipes]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((recipe) => (
            <div
              key={recipe.id}
              className={`${styles.recipeItem} ${activeRecipeId === recipe.id ? styles.recipeItemActive : ''}`}
              style={recipe.colorIndex ? { '--recipe-color': `var(--palette-${recipe.colorIndex})` } as React.CSSProperties : {}}
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
      {session && <AddRecipeForm onRecipeAdded={onRecipeAdded} />}
      
      <div className={styles.feedbackContainer}>
        <a 
          href="mailto:joshbloom@google.com?subject=Recipe%20Ingredient%20Shopper%20Feedback" 
          className={styles.feedbackLink}
        >
          Send Feedback
        </a>
      </div>
    </aside>
  );
}
