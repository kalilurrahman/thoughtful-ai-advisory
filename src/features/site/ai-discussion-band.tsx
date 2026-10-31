import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import discussionImage from "@/assets/ai-discussion.jpg";

/** Home page entry to the everyday AI discussion tools: the advisor and Ask VERITRAIL. */
export function AiDiscussionBand() {
  return (
    <section className="container py-10" aria-labelledby="ai-discussion-title">
      <div className="grid items-center gap-6 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2">
        <img
          src={discussionImage}
          alt="Governance practitioners discussing a concern with an AI assistant"
          width={1280}
          height={800}
          loading="lazy"
          className="h-56 w-full object-cover md:h-full"
        />
        <div className="space-y-4 p-6 md:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            AI discussion · for everyday use
          </p>
          <h2 id="ai-discussion-title" className="text-2xl font-semibold text-foreground">
            Talk a governance concern through with AI
          </h2>
          <p className="text-muted-foreground">
            Describe a policy, risk or control concern and get the relevant GOVERN areas and
            corrective actions, or ask the knowledge base for cited answers and directions to
            the right page.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-11"><Link to="/assistant"><MessageCircle size={20} aria-hidden /> Site assistant <ArrowRight size={16} aria-hidden /></Link></Button>
            <Button asChild variant="outline" className="min-h-11"><Link to="/advisor"><Compass size={20} aria-hidden /> AI advisor</Link></Button>
          </div>
          <p className="text-xs text-muted-foreground">
            AI suggestions must be reviewed by qualified professionals before use.
          </p>
        </div>
      </div>
    </section>
  );
}
