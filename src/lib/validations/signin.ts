import { z } from "zod";

export const SignInSchema = z.object({
  email: z.string().email({ message: "Email yang dimasukkan tidak valid" }),
  password: z
    .string()
    .min(8, { message: "Panjang password minimal 8 karakter" }),
});

export type SignInSchemaType = z.infer<typeof SignInSchema>;
