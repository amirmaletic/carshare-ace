import { useState } from "react";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Car } from "lucide-react";

export default function TenantInloggen() {
  const { tenant, slug, isLoading: tenantLoading } = useTenantPortaal();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const base = slug ? `/t/${slug}` : "";
  const redirectTo = searchParams.get("redirect") || base || "/";

  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading || tenantLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
    else if (!isLogin) toast({ title: "Account aangemaakt", description: "Je kunt nu reserveringen plaatsen." });
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectTo,
    });
    if (result.error) toast({ title: "Fout", description: "Kon niet inloggen met Google", variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            {tenant?.portaal_logo_url ? (
              <img src={tenant.portaal_logo_url} alt={tenant.portaal_naam || tenant.naam} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto"><Car className="w-8 h-8 text-primary-foreground" /></div>
            )}
          </div>
          <CardTitle className="text-2xl">{tenant?.portaal_naam || tenant?.naam}</CardTitle>
          <CardDescription>
            {isLogin ? "Log in om je reservering af te ronden" : "Maak een account aan om te reserveren"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Doorgaan met Google
          </Button>
          <div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-xs text-muted-foreground">of</span><Separator className="flex-1" /></div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Bezig..." : isLogin ? "Inloggen" : "Account aanmaken"}
            </Button>
          </form>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
            {isLogin ? "Nog geen account? Registreer" : "Al een account? Log in"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border">
            Klantportaal van {tenant?.naam} · powered by FleeFlo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}