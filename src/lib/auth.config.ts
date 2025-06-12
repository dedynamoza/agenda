import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignInSchema } from "./validations/signin";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = SignInSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;

          const passwordsMatch = bcrypt.compareSync(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub as string;
      }

      if (token.image && session.user) {
        session.user.image = token.image as string;
      }

      if (session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { name: true, email: true, image: true },
      });

      if (!existingUser) return token;

      token.name = existingUser.name;
      token.email = existingUser.email;
      token.image = existingUser.image;

      return token;
    },
  },
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),
} satisfies NextAuthConfig;
