export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-muted-foreground">Sign in to save favorites and manage account.</p>
      <form action="/api/auth/login" method="post" className="space-y-3">
        <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded border p-2" />
        <button className="rounded bg-black text-white px-4 py-2" type="submit">Continue with Google (MVP fallback)</button>
      </form>
    </main>
  );
}
