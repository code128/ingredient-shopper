'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShoppingList from '@/components/ShoppingList';
import RecipeEditor from '@/components/RecipeEditor';

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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar 
        recipes={recipes} 
        onToggleSelection={handleToggleSelection}
        activeRecipeId={activeRecipeId}
        onSelectRecipe={handleSelectRecipe}
        onRecipeAdded={fetchRecipes}
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeRecipe ? (
            <RecipeEditor 
              recipe={activeRecipe}
              onClose={() => setActiveRecipeId(undefined)}
              onRecipeUpdated={fetchRecipes}
            />
          ) : (
            <ShoppingList recipes={recipes} />
          )}
        </div>
      </div>
    </div>
  );
}
