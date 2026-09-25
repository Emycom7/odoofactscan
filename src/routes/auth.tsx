import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "./index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" | "login" } => ({ mode: s["mode"] === "signup" ? "signup" : "login" }),
  head: () => ({
    meta: [
      { title: "Connexion — FacturOdoo" },
      { name: "description", content: "Créez votre compte ou connectez-vous pour scanner vos factures vers Odoo." },
      { property: "og:title", content: "Connexion — FacturOdoo" },
      { property: "og:description", content: "Accédez à votre espace de scan de factures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().email("E-mail invalide"), password: z.string().min(6, "6 caractères minimum") });

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = /already registered/i.test(error.message)
        ? "Un compte existe déjà avec cet e-mail. Connectez-vous."
        : /invalid login/i.test(error.message)
          ? "E-mail ou mot de passe incorrect."
          : error.message;
      { toast.error(msg); return; }
    }
    toast.success(mode === "signup" ? "Compte créé, bienvenue !" : "Content de vous revoir !");
    navigate({ to: "/app" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Brand /></Link>
        </div>
        <div className="surface-lift p-7">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-semibold">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md py-2 transition-colors ${mode === m ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {m === "login" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{mode === "login" ? "Ravi de vous revoir" : "Bienvenue"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Accédez à votre espace de scan." : "Aucune confirmation par e-mail nécessaire."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" disabled={busy} className="btn-copper h-11 w-full text-base">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
