'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShoppingList from '@/components/ShoppingList';
import RecipeEditor from '@/components/RecipeEditor';
import stylesLayout from './page.module.css';

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

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      if (data.success) {
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleToggleSelection = (id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isSelected: !r.isSelected } : r));
  };

  const handleSelectRecipe = (id: string) => {
    setActiveRecipeId(id);
    setIsSidebarOpen(false); // Close sidebar on selection (mobile helpful)
  };

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)', fontWeight: 600 }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className={stylesLayout.mainLayout}>
      <div 
        className={`${stylesLayout.overlay} ${isSidebarOpen ? stylesLayout.overlayActive : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`${stylesLayout.sidebarContainer} ${isSidebarOpen ? stylesLayout.sidebarOpen : ''}`}>
        <Sidebar 
          recipes={recipes} 
          onToggleSelection={handleToggleSelection}
          activeRecipeId={activeRecipeId}
          onSelectRecipe={handleSelectRecipe}
          onRecipeAdded={fetchRecipes}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      <div className={stylesLayout.contentContainer}>
        {!activeRecipe && (
          <button className={stylesLayout.menuButton} onClick={() => setIsSidebarOpen(true)} title="Menu">
            ☰
          </button>
        )}
        <div className={stylesLayout.scrollArea}>
          {activeRecipe ? (
            <RecipeEditor 
              key={activeRecipe.id}
              recipe={activeRecipe}
              onClose={() => setActiveRecipeId(undefined)}
              onRecipeUpdated={fetchRecipes}
            />
          ) : (
            <ShoppingList recipes={recipes} onRecipeClick={handleSelectRecipe} />
          )}
        </div>
      </div>
    </div>
  );
}
