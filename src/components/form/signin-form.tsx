"use client";

import { useTransition } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

import { toast } from "sonner";
import { signIn } from "@/actions/signin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInSchema, SignInSchemaType } from "@/lib/validations/signin";

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInSchemaType) => {
    startTransition(async () => {
      signIn(values)
        .then((data) => {
          if (data?.error) {
            return toast.error(data.error);
          }
          form.reset();
          toast.success("Berhasil masuk ke akun anda!");
          return;
        })
        .catch((err) => {
          console.log("Error during sign-in:", err);
        });
    });
  };

  return (
    <Card className="w-full max-w-lg shadow-lg rounded-md bg-white/80 backdrop-blur-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>
          Masukkan email dan password untuk masuk ke akun anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="john.doe@example.com"
                          type="email"
                          disabled={isPending}
                          className="border-primary-800/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="**********"
                          {...field}
                          disabled={isPending}
                          className="border-primary-800/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-6 cursor-pointer bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-4 py-2.5 shadow-lg hover:shadow-xl transform transition-all duration-200 text-sm min-w-20"
              disabled={isPending}
            >
              {isPending ? "Memuat..." : "Masuk"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
