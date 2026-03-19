import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = params.id;

    if ('isSelected' in body) {
      const recipe = await prisma.recipe.update({
        where: { id },
        data: { isSelected: body.isSelected },
      });
      return NextResponse.json({ success: true, recipe });
    }

    if ('ingredients' in body) {
      const { ingredients } = body; // Array of { id, quantity, unit, originalText, name }
      
      await prisma.$transaction(async (tx) => {
        for (const ri of ingredients) {
          let ingredientId = undefined;
          
          if (ri.name) {
            const trimmedName = ri.name.trim();
            // Find or create ingredient
            let ingredient = await tx.ingredient.findUnique({
              where: { name: trimmedName }
            });
            
            if (!ingredient) {
              ingredient = await tx.ingredient.create({
                data: { name: trimmedName }
              });
            }
            ingredientId = ingredient.id;
          }

          await tx.recipeIngredient.update({
            where: { id: ri.id },
            data: {
              ingredientId: ingredientId, // Link to new/found ingredient
              quantity: ri.quantity === '' || ri.quantity === null ? null : parseFloat(ri.quantity),
              unit: ri.unit === '' || ri.unit === null ? null : ri.unit,
              originalText: ri.originalText,
            }
          });
        }
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Delete junction records first due to foreign key constraints
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: id },
    });

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
