"use client";

import { useActionState } from "react";
import { saveSettings } from "../../actions";
import { seedDemoAction } from "../../demo-actions";
import { btn, inputCls, textareaCls } from "@/components/admin/ui";

export function SettingsForm({ settings, demo }: { settings: Record<string, string>; demo: boolean }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const [demoState, demoAction, demoPending] = useActionState(seedDemoAction, undefined);

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-8 text-sm">
        <fieldset className="space-y-3">
          <legend className="font-semibold">Admissions</legend>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="admissions_open" value="1" defaultChecked={settings.admissions_open === "1"} className="h-4 w-4 accent-[#8c6b12]" />
            Accepter de nouvelles demandes d'admission sur le site
          </label>
          <label className="block">
            <span className="mb-1 block text-muted">Message affiché lorsque les admissions sont fermées</span>
            <textarea name="closed_message" rows={2} defaultValue={settings.closed_message} className={textareaCls} />
          </label>
          <label className="block max-w-xs">
            <span className="mb-1 block text-muted">Délai de traitement cible (heures)</span>
            <input name="sla_hours" type="number" min={1} max={720} defaultValue={settings.sla_hours} className={inputCls} />
            <span className="mt-1 block text-xs text-muted">Au-delà, les dossiers sont signalés en retard.</span>
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold">Cotisations mensuelles (€)</legend>
          <p className="text-muted">Utilisées pour le calcul des revenus récurrents du tableau de bord.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["fee_gold", "Feder Or"],
              ["fee_platine", "Feder Platine"],
              ["fee_noire", "Feder Noire"],
            ].map(([k, l]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-muted">{l}</span>
                <input name={k} type="number" min={0} defaultValue={settings[k]} className={inputCls} />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button disabled={pending} className={btn.primary}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {state?.ok && <span className="text-[#1f6b3a]">{state.ok}</span>}
          {state?.error && <span className="text-[#a33a2a]">{state.error}</span>}
        </div>
      </form>

      {demo && (
        <form
          action={demoAction}
          onSubmit={(e) => {
            if (!confirm("Générer 40 dossiers fictifs de démonstration ?")) e.preventDefault();
          }}
          className="space-y-3 border-t border-line pt-8 text-sm"
        >
          <div className="font-semibold">Données de démonstration</div>
          <p className="text-muted">
            Disponible uniquement en développement. Crée 40 dossiers fictifs (avec un document PDF d'exemple) répartis sur 30 jours pour tester
            l'administration.
          </p>
          <button disabled={demoPending} className={btn.ghost}>
            {demoPending ? "Génération…" : "Générer des données de démo"}
          </button>
          {demoState?.ok && <p className="text-[#1f6b3a]">{demoState.ok}</p>}
          {demoState?.error && <p className="text-[#a33a2a]">{demoState.error}</p>}
        </form>
      )}
    </div>
  );
}
