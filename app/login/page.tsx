import { LoginButton } from "@/app/login/login-button";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-muted-foreground">Sign in to save favorites and manage account.</p>
      <LoginButton />
    </main>
  );
}
