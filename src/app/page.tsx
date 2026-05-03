'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
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
  colorIndex: number;
  ingredients: RecipeIngredient[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      if (data.success) {
        setRecipes(data.recipes.map((r: any, i: number) => ({
          ...r,
          colorIndex: (i % 6) + 1
        })));
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [session]);

  const handleToggleSelection = async (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    const newIsSelected = !recipe.isSelected;

    // Optimistically update UI
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isSelected: newIsSelected } : r));

    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSelected: newIsSelected }),
      });
    } catch (error) {
      console.error('Failed to save selection state:', error);
      // Rollback on failure
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, isSelected: !newIsSelected } : r));
    }
  };

  const handleSelectRecipe = (id: string) => {
    setActiveRecipeId(id);
    setIsSidebarOpen(false); // Close sidebar on selection (mobile helpful)
  };

  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  const defaultCategories = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Frozen', 'Other'];
  const existingCategories = Array.from(new Set([
    ...defaultCategories,
    ...recipes.flatMap(r => r.ingredients.map(ri => ri.ingredient.category).filter(Boolean))
  ])) as string[];

  if (loading || status === 'loading') {
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
              existingCategories={existingCategories}
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
