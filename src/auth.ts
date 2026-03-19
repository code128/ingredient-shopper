import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
