import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import fleefloLogo from "@/assets/fleeflo-logo-blue.png";
import maletickLogo from "@/assets/maletick-logo.png";

function MarketingHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/#functies", label: "Functies" },
    { to: "/#voertuigen", label: "Voertuigen" },
    { to: "/#contracten", label: "Contracten" },
    { to: "/prijzen", label: "Prijzen" },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (to.startsWith("/#")) {
      e.preventDefault();
      const id = to.slice(2);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else if (!to.startsWith("/#")) {
      e.preventDefault();
      navigate(to);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={fleefloLogo} alt="FleeFlo wagenparkbeheer" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-foreground">FleeFlo</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              onClick={(e) => handleNavClick(e, link.to)}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild>
            <Link to="/auth">Inloggen</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Menu openen"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              onClick={(e) => handleNavClick(e, link.to)}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-border space-y-2">
            <Button className="w-full" asChild>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Inloggen</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={fleefloLogo} alt="FleeFlo" className="w-6 h-6 object-contain" />
              <span className="font-semibold text-foreground">FleeFlo</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professioneel wagenparkbeheer voor verhuurbedrijven in Nederland.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#functies" className="text-muted-foreground hover:text-foreground transition-colors">Functies</a></li>
              <li><a href="/#voertuigen" className="text-muted-foreground hover:text-foreground transition-colors">Voertuigbeheer</a></li>
              <li><a href="/#contracten" className="text-muted-foreground hover:text-foreground transition-colors">Contractbeheer</a></li>
              <li><a href="/#voordelen" className="text-muted-foreground hover:text-foreground transition-colors">Voordelen</a></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Aan de slag</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/prijzen" className="text-muted-foreground hover:text-foreground transition-colors">Prijzen</Link></li>
              <li><Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">Account aanmaken</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:info@fleeflo.nl" className="text-muted-foreground hover:text-foreground transition-colors" rel="noopener">info@fleeflo.nl</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FleeFlo. Alle rechten voorbehouden.</p>
          <a
            href="https://maletick.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Een product van Maletick"
          >
            <span className="text-xs">Een product van</span>
            <img
              src={maletickLogo}
              alt="Maletick"
              className="h-5 w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
