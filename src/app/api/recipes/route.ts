import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const targetUserId = session?.user?.id || null;

    const recipes = await prisma.recipe.findMany({
      where: {
        userId: targetUserId
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, recipes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
