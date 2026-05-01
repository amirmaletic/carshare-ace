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
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

function EmailVerificationScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verstuurd!", description: "We hebben een nieuwe verificatie-e-mail gestuurd." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-fit">
            <img src={fleefloLogo} alt="FleeFlo" className="w-16 h-16 object-contain" />
          </div>
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Controleer je inbox</CardTitle>
          <CardDescription className="text-base mt-2">
            We hebben een verificatie-e-mail gestuurd naar
          </CardDescription>
          <p className="font-semibold text-foreground mt-1">{email}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Klik op de link in de e-mail om je account te activeren
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Check ook je spam/ongewenste map als je de e-mail niet ziet
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Na verificatie kun je direct inloggen en starten met je 30-dagen proefperiode
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Geen e-mail ontvangen?</p>
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={resending}>
              {resending ? "Bezig met versturen..." : "Verificatie-e-mail opnieuw versturen"}
            </Button>
          </div>

          <Separator />

          <button
            type="button"
            onClick={onBack}
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

function ForgotPasswordScreen({
  email,
  setEmail,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      onBack();
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            onClick={onBack}
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

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  if (showVerification) {
    return (
      <EmailVerificationScreen
        email={email}
        onBack={() => {
          setShowVerification(false);
          setIsLogin(true);
        }}
      />
    );
  }

  if (isForgotPassword) {
    return (
      <ForgotPasswordScreen
        email={email}
        setEmail={setEmail}
        onBack={() => setIsForgotPassword(false)}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await signUp(email, password, bedrijfsnaam.trim());
      setSubmitting(false);
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        setShowVerification(true);
      }
    }
  };

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
              : "Start je gratis proefperiode van 30 dagen"}
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
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="bedrijfsnaam">Bedrijfsnaam</Label>
                <Input
                  id="bedrijfsnaam"
                  type="text"
                  placeholder="Bijv. De Waal Autoverhuur"
                  value={bedrijfsnaam}
                  onChange={(e) => setBedrijfsnaam(e.target.value)}
                  required
                />
              </div>
            )}
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

        </CardContent>
      </Card>
    </div>
  );
}
