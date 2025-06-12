"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import { signIn as nextAuthSignIn } from "@/lib/auth";
import { SignInSchema, SignInSchemaType } from "@/lib/validations/signin";

export const signIn = async (data: SignInSchemaType) => {
  const validatedFields = SignInSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Data yang dimasukkan tidak valid" };
  }

  const { email, password } = validatedFields.data;

  // Mencari pengguna yang sudah ada/terbuat berdasarkan email
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      email: true,
      password: true,
    },
  });

  // Jika email pengguna tidak ditemukan
  if (!existingUser || !existingUser.email) {
    return { error: "Akun tidak terdaftar" };
  }

  // Periksa apakah password yang dimasukkan cocok
  const isPasswordValid = await bcrypt.compare(
    password,
    existingUser.password!
  );

  if (!isPasswordValid) {
    return { error: "Password tidak valid" };
  }

  try {
    await nextAuthSignIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    // Tangani kesalahan autentikasi
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password tidak valid" };
        default:
          return { error: "Terjadi kesalahan. Silakan coba lagi nanti." };
      }
    }

    // Lempar error jika bukan tipe AuthError
    throw error;
  }
};
