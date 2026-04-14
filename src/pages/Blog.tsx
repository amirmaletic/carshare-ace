import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/components/marketing/BlogPreviewSection";

export default function Blog() {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Blog en kennisbank
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Lees onze artikelen over wagenparkbeheer, voertuigverhuur en alles wat daarbij komt kijken.
          </p>
        </div>
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit mb-3">
                {post.category}
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
