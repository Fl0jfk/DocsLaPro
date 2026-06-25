export default function RgpdDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed ${className}`}
    >
      <strong>Outil d&apos;aide à la conformité</strong> — ce module facilite la rédaction et le suivi
      documentaire RGPD. Il ne constitue pas un conseil juridique. Validation finale par le DPD/DPO et
      la direction de l&apos;établissement.
    </p>
  );
}
