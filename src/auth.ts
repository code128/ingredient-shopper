import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Resend from "next-auth/providers/resend"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      
      const defaults = await prisma.recipe.findMany({
        where: { userId: null },
        include: { ingredients: true }
      });

      for (const def of defaults) {
        await prisma.recipe.create({
          data: {
            title: def.title,
            sourceUrl: def.sourceUrl,
            imageUrl: def.imageUrl,
            userId: user.id,
            ingredients: {
              create: def.ingredients.map(ing => ({
                quantity: ing.quantity,
                unit: ing.unit,
                originalText: ing.originalText,
                ingredientId: ing.ingredientId
              }))
            }
          }
        });
      }
    }
  }
})
