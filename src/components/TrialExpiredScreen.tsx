import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TrialExpiredScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Proefperiode verlopen</h1>
            <p className="text-muted-foreground">
              Je gratis proefperiode van 30 dagen is afgelopen. Neem contact op om je account te activeren en verder te gaan.
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => window.location.href = "mailto:info@fleeflo.nl?subject=Account%20activeren"}
          >
            <Mail className="w-4 h-4" />
            Contact opnemen
          </Button>

          <p className="text-xs text-muted-foreground">
            Je data blijft veilig bewaard en is direct beschikbaar na activatie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
