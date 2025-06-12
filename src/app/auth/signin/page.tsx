import { redirect } from "next/navigation";

import SignInForm from "@/components/form/signin-form";

import { getCurrentUser } from "@/lib/user";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-16 font-[family-name:var(--font-geist-sans)]">
      <SignInForm />
    </div>
  );
}
