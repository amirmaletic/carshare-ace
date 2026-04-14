import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const blogPosts = [
  {
    slug: "wagenparkbeheer-tips-verhuurbedrijven",
    title: "7 tips voor efficiënt wagenparkbeheer bij verhuurbedrijven",
    excerpt:
      "Een goed georganiseerd wagenpark is de basis van elk succesvol verhuurbedrijf. In dit artikel delen we zeven praktische tips waarmee je je vloot slimmer beheert, kosten bespaart en de klanttevredenheid verhoogt.",
    date: "12 april 2026",
    readTime: "5 min lezen",
    category: "Wagenparkbeheer",
  },
  {
    slug: "digitale-contracten-voordelen",
    title: "Waarom digitale contracten onmisbaar zijn voor autoverhuurbedrijven",
    excerpt:
      "Papieren contracten kosten tijd, zijn foutgevoelig en lastig terug te vinden. Ontdek hoe digitale contracten met elektronische handtekeningen je verhuurproces versnellen en je administratie vereenvoudigen.",
    date: "5 april 2026",
    readTime: "4 min lezen",
    category: "Contractbeheer",
  },
  {
    slug: "schaderegistratie-best-practices",
    title: "Schaderegistratie bij voertuigverhuur: zo doe je dat professioneel",
    excerpt:
      "Een goede schaderegistratie beschermt zowel het verhuurbedrijf als de klant. Leer hoe je met visuele schadeformulieren, foto's en digitale rapportages grip houdt op de staat van elk voertuig in je vloot.",
    date: "28 maart 2026",
    readTime: "6 min lezen",
    category: "Schadebeheer",
  },
];

export default function BlogPreviewSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20" id="blog">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Kennisbank en tips
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Praktische inzichten over wagenparkbeheer, contracten en voertuigverhuur om je bedrijf naar een hoger niveau te tillen.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-border bg-background overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit mb-3">
                  {post.category}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug">
                  <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/blog">
              Bekijk alle artikelen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
