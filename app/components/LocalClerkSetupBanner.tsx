export default function LocalClerkSetupBanner() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-[9999] max-w-2xl mx-auto rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg"
    >
      <p className="font-semibold">Clerk indisponible en local</p>
      <p className="mt-1 text-amber-900">
        Les clés production du registry ne fonctionnent pas sur{" "}
        <code className="rounded bg-amber-100 px-1">localhost</code>. Ajoutez dans{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> les clés{" "}
        <strong>Development</strong> de Clerk, puis redémarrez le serveur :
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-amber-100/80 p-2 text-xs">
        {`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...\nCLERK_SECRET_KEY=sk_test_...`}
      </pre>
      <p className="mt-2 text-xs text-amber-800">
        Récupération : Dashboard Clerk → API Keys (instance Development), ou{" "}
        <code className="rounded bg-amber-100 px-1">npx clerk@latest env pull</code>
      </p>
    </div>
  );
}
