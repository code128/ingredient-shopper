'use client';

import React, { useState } from 'react';
import styles from './RecipeEditor.module.css';

interface Ingredient {
  id: string;
  name: string;
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
  ingredients: RecipeIngredient[];
}

interface RecipeEditorProps {
  recipe: Recipe;
  onClose: () => void;
  onRecipeUpdated: () => void;
}

export default function RecipeEditor({ recipe, onClose, onRecipeUpdated }: RecipeEditorProps) {
  const [ingredients, setIngredients] = useState(() => 
    recipe.ingredients.map(ri => ({
      id: ri.id,
      quantity: ri.quantity !== null ? String(ri.quantity) : '',
      unit: ri.unit || '',
      originalText: ri.originalText,
      name: ri.ingredient.name
    }))
  );
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (id: string, field: string, value: string) => {
    setIngredients(prev => prev.map(ri => ri.id === id ? { ...ri, [field]: value } : ri));
  };

  const handleAddIngredient = () => {
    setIngredients(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: '',
        quantity: '',
        unit: '',
        originalText: '',
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      const data = await res.json();
      if (data.success) {
        onRecipeUpdated();
        onClose();
      } else {
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onClose} className={styles.backButton}>
          ← Back to Shopping List
        </button>
        <h1 className={styles.title}>Edit Recipe: {recipe.title}</h1>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.tableHeader}>
        <div className={styles.colName}>Name</div>
        <div className={styles.colQty}>Qty</div>
        <div className={styles.colUnit}>Unit</div>
        <div className={styles.colOriginal}>Original Text</div>
      </div>

      <div className={styles.ingredientList}>
        {ingredients.map(ri => (
          <div key={ri.id} className={styles.ingredientRow}>
            <div className={styles.colName}>
              <input
                type="text"
                value={ri.name}
                onChange={(e) => handleFieldChange(ri.id, 'name', e.target.value)}
                placeholder="Ingredient Name"
                className={styles.input}
                disabled={saving}
                style={{ fontWeight: 600 }}
              />
            </div>
            <div className={styles.colQty}>
              <input
                type="text"
                value={ri.quantity}
                onChange={(e) => handleFieldChange(ri.id, 'quantity', e.target.value)}
                placeholder="Qty"
                className={styles.input}
                disabled={saving}
              />
            </div>
            <div className={styles.colUnit}>
              <input
                type="text"
                value={ri.unit}
                onChange={(e) => handleFieldChange(ri.id, 'unit', e.target.value)}
                placeholder="Unit"
                className={styles.input}
                disabled={saving}
              />
            </div>
            <div className={styles.colOriginal}>
              <input
                type="text"
                value={ri.originalText}
                onChange={(e) => handleFieldChange(ri.id, 'originalText', e.target.value)}
                placeholder="Original description"
                className={styles.input}
                disabled={saving}
              />
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleAddIngredient} 
        className={styles.addButton} 
        disabled={saving}
      >
        + Add Ingredient
      </button>

      <div className={styles.actions}>
        <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
