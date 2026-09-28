import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/salon/PrintButton";
import { fmtIban } from "@/lib/banking-labels";
import { ensureAccount } from "@/lib/server/banking";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "RIB" };

export default async function RibPage() {
  const m = await requireMember();
  const acc = ensureAccount(m.id);
  const bank = acc.iban.slice(4, 9);
  const branch = acc.iban.slice(9, 14);
  const account = acc.iban.slice(14, 25);
  const key = acc.iban.slice(25, 27);

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/espace/documents" className="text-sm text-[var(--s-muted)] hover:text-white">
          ← Documents
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-ink print:rounded-none print:p-0">
        <div className="flex items-start justify-between">
          <Logo />
          <div className="text-right text-xs text-muted">Relevé d'identité bancaire</div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Titulaire du compte</div>
            <div className="mt-1 font-medium">
              {m.prenom} {m.nom}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Domiciliation</div>
            <div className="mt-1">Feder · [établissement teneur de compte à compléter]</div>
          </div>
        </div>
        <table className="mt-10 w-full border border-line text-center font-mono text-sm">
          <thead className="bg-mist text-xs text-muted">
            <tr>
              <th className="p-2 font-normal">Code banque</th>
              <th className="p-2 font-normal">Code guichet</th>
              <th className="p-2 font-normal">N° de compte</th>
              <th className="p-2 font-normal">Clé RIB</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3">{bank}</td>
              <td className="p-3">{branch}</td>
              <td className="p-3">{account}</td>
              <td className="p-3">{key}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-8 grid gap-6 sm:grid-cols-[2fr_1fr]">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">IBAN</div>
            <div className="mt-1 font-mono text-lg tracking-wide">{fmtIban(acc.iban)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">BIC</div>
            <div className="mt-1 font-mono text-lg">[À compléter]</div>
          </div>
        </div>
        <p className="mt-12 text-[11px] text-muted">
          Environnement de démonstration : coordonnées bancaires fictives, à remplacer par celles de l'établissement partenaire.
        </p>
      </article>
    </div>
  );
}
