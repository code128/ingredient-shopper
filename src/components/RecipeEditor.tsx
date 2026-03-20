'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const isReadOnly = !session?.user;

  const [title, setTitle] = useState(recipe.title);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {

    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        onRecipeUpdated();
        onClose();
      } else {
        setError(data.error || 'Failed to delete recipe');
      }
    } catch (err) {
      setError('An error occurred while deleting');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, title: title.trim() }),
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

  const handleTitleBlur = async () => {
    if (title.trim() === recipe.title || !title.trim() || isReadOnly) return;
    
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onRecipeUpdated();
      } else {
        setError(data.error || 'Failed to auto-save title');
        setTitle(recipe.title);
      }
    } catch (err) {
      setError('An error occurred while auto-saving title');
      setTitle(recipe.title);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onClose} className={styles.backButton}>
          ← Back to Shopping List
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className={styles.titleInput}
          placeholder="Recipe Title"
          disabled={saving || isReadOnly}
        />
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.tableHeader}>
        <div className={styles.colName}>Name</div>
        <div className={styles.qtyUnitGroup}>
          <div className={styles.colQty}>Qty</div>
          <div className={styles.colUnit}>Unit</div>
        </div>
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
                disabled={saving || isReadOnly}
                style={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
            </div>
            <div className={styles.qtyUnitGroup}>
              <div className={styles.colQty}>
                <input
                  type="text"
                  value={ri.quantity}
                  onChange={(e) => handleFieldChange(ri.id, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className={styles.input}
                  disabled={saving || isReadOnly}
                />
              </div>
              <div className={styles.colUnit}>
                <input
                  type="text"
                  value={ri.unit}
                  onChange={(e) => handleFieldChange(ri.id, 'unit', e.target.value)}
                  placeholder="Unit"
                  className={styles.input}
                  disabled={saving || isReadOnly}
                />
              </div>
            </div>
            <div className={styles.colOriginal}>
              <input
                type="text"
                value={ri.originalText}
                onChange={(e) => handleFieldChange(ri.id, 'originalText', e.target.value)}
                placeholder="Original description"
                className={styles.input}
                disabled={saving || isReadOnly}
              />
            </div>
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <button 
          onClick={handleAddIngredient} 
          className={styles.addButton} 
          disabled={saving}
        >
          + Add Ingredient
        </button>
      )}

      <div className={styles.actions}>
        {!isReadOnly && (
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
        {!isReadOnly && (
          <button onClick={handleDelete} className={styles.deleteButton} disabled={saving}>
            Delete Recipe
          </button>
        )}
        <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
          {isReadOnly ? 'Close' : 'Cancel'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Delete Recipe</h3>
            <p className={styles.modalDescription}>
              Are you sure you want to completely delete <strong>{recipe.title}</strong>?<br/>
              This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button 
                onClick={executeDelete} 
                className={styles.deleteButton}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
