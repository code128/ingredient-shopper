import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
    if (!existingRecipe || existingRecipe.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const updateData: any = {};
    if ('isSelected' in body) updateData.isSelected = body.isSelected;
    if ('title' in body) updateData.title = body.title;

    let updated = false;

    if (Object.keys(updateData).length > 0) {
      await prisma.recipe.update({
        where: { id },
        data: updateData,
      });
      updated = true;
    }

    if ('ingredients' in body) {
      const { ingredients } = body;
      
      await prisma.$transaction(async (tx) => {
        for (const ri of ingredients) {
          let ingredientId = undefined;
          
          if (ri.name) {
            const trimmedName = ri.name.trim();
            let ingredient = await tx.ingredient.findUnique({
              where: { name: trimmedName }
            });
            
            if (!ingredient) {
              ingredient = await tx.ingredient.create({
                data: { 
                  name: trimmedName,
                  category: ri.category || null
                }
              });
            } else if (ri.category && ingredient.category !== ri.category) {
              ingredient = await tx.ingredient.update({
                where: { id: ingredient.id },
                data: { category: ri.category }
              });
            }
            ingredientId = ingredient.id;
          }

          if (!ingredientId) continue;

          if (ri.id.startsWith('new-')) {
            await tx.recipeIngredient.create({
              data: {
                recipeId: id,
                ingredientId: ingredientId,
                quantity: ri.quantity === '' || ri.quantity === null ? null : parseFloat(ri.quantity),
                unit: ri.unit === '' || ri.unit === null ? null : ri.unit,
                originalText: ri.originalText || '',
              }
            });
          } else {
            await tx.recipeIngredient.update({
              where: { id: ri.id },
              data: {
                ingredientId: ingredientId,
                quantity: ri.quantity === '' || ri.quantity === null ? null : parseFloat(ri.quantity),
                unit: ri.unit === '' || ri.unit === null ? null : ri.unit,
                originalText: ri.originalText,
              }
            });
          }
        }

        const incomingIds = ingredients
          .map((ri: any) => ri.id)
          .filter((riId: string) => !riId.startsWith('new-'));

        await tx.recipeIngredient.deleteMany({
          where: {
            recipeId: id,
            id: { notIn: incomingIds }
          }
        });
      });
      updated = true;
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
    if (!existingRecipe || existingRecipe.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

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
