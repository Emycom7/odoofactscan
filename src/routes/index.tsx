import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, FileScan, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FacturOdoo — Scannez vos factures, créez-les dans Odoo" },
      { name: "description", content: "Déposez une facture fournisseur en PDF : l'IA l'analyse, retrouve ou crée le fournisseur et génère la facture dans Odoo Achats & Facturation." },
      { property: "og:title", content: "FacturOdoo — Scannez vos factures, créez-les dans Odoo" },
      { property: "og:description", content: "De la facture PDF à l'écriture Odoo en quelques secondes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: FileScan, title: "Déposez le PDF", text: "Glissez votre facture d'achat, l'analyse démarre immédiatement." },
  { icon: Sparkles, title: "L'IA lit tout", text: "Fournisseur, numéro, dates, lignes, taxes, totaux : tout est extrait et vérifiable." },
  { icon: Users, title: "Fournisseur reconnu", text: "Existant ? Il est sélectionné. Inconnu ? Il est créé dans vos contacts Odoo." },
  { icon: ShieldCheck, title: "Facture créée", text: "Bon de commande et facture fournisseur créés réellement dans Odoo, PDF joint." },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Brand />
        <Link to="/auth">
          <Button variant="ghost">Se connecter</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-20 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-copper">
              <Sparkles className="size-3.5" /> Intelligence artificielle intégrée
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] md:text-6xl">
              De la facture PDF à <span className="text-gradient-copper">l'écriture Odoo</span> en quelques secondes.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Scannez vos factures fournisseurs. FacturOdoo extrait chaque donnée, retrouve ou crée le fournisseur, puis crée la facture dans les modules Achats et Facturation de votre Odoo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="btn-copper h-12 px-6 text-base">
                  Créer mon compte <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base">J'ai déjà un compte</Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Sans confirmation par e-mail. Vos clés Odoo sont chiffrées.</p>
          </div>

          <div className="surface-lift relative overflow-hidden p-6 animate-fade-up [animation-delay:120ms]">
            <div className="pointer-events-none absolute inset-x-6 top-6 h-24 bg-gradient-to-b from-copper/25 to-transparent animate-scan rounded-lg" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>facture_fournisseur_2049.pdf</span>
              <span className="rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success">Analysée</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Fournisseur", "Atelier Lumière SAS"],
                ["N° facture", "F-2049-118"],
                ["Date", "12/09/2026"],
                ["Échéance", "12/10/2026"],
                ["Total HT", "1 240,00 €"],
                ["TVA 20 %", "248,00 €"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-semibold tabular">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-copper/30 bg-accent/50 p-3 text-sm">
              <span>Fournisseur existant détecté (TVA)</span>
              <span className="font-semibold text-copper">→ BILL/2026/0142</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="surface p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2 font-display text-lg font-bold ${light ? "text-sidebar-foreground" : ""}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-copper text-copper-foreground">
        <FileScan className="size-4.5" />
      </span>
      Factur<span className="text-copper">Odoo</span>
    </div>
  );
}
