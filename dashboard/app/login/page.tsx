import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { t } from "@/lib/texts";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.app}</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t.login.lead}</p>
      </div>
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {t.login.errors[error] ?? t.login.errors.github}
        </p>
      )}
      <a href="/api/auth/login"
         className="rounded-lg bg-stone-900 px-4 py-3 text-center font-medium text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300">
        {t.login.button}
      </a>
    </main>
  );
}
