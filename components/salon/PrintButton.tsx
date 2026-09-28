"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white">
      Imprimer / Enregistrer en PDF
    </button>
  );
}
