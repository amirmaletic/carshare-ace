import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import fleefloLogo from "@/assets/fleeflo-logo-blue.png";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else if (!isLogin) {
      toast({
        title: "Account aangemaakt",
        description: "Je kunt nu direct aan de slag met je gratis proefperiode van 30 dagen!",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "E-mail verstuurd",
        description: "Controleer je inbox voor de link om je wachtwoord te resetten.",
      });
      setIsForgotPassword(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-fit">
              <img src={fleefloLogo} alt="FleeFlo" className="w-16 h-16 object-contain" />
            </div>
            <CardTitle className="text-2xl">Wachtwoord vergeten</CardTitle>
            <CardDescription>
              Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mailadres</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Bezig..." : "Verstuur resetlink"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar inloggen
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-fit">
            <img src={fleefloLogo} alt="FleeFlo" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? "Inloggen" : "Account aanmaken"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Log in om je wagenpark te beheren"
              : "Maak een account aan om te beginnen"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={async () => {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                toast({ title: "Fout", description: "Kon niet inloggen met Google", variant: "destructive" });
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Doorgaan met Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">of</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Wachtwoord</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Wachtwoord vergeten?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Bezig..."
                : isLogin
                ? "Inloggen"
                : "Account aanmaken"}
            </Button>
          </form>
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Nog geen account? Registreer hier"
                : "Al een account? Log hier in"}
            </button>
          </div>

          <Separator />

          <div className="text-center">
            <a href="/klant-login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Klant? Ga naar het klantportaal →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
