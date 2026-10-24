import { InlineMarkdown } from "./markdown";
import type { FaqItem } from "./pages";
import { formatDate } from "./reading";

/** FAQ (as an accordion, so long answers do not form a wall of text) and the review date. */
export function PageEnd({ faq, updated }: { faq?: FaqItem[]; updated?: string | undefined }) {
  return (
    <>
      {faq && faq.length > 0 && (
        <section className="faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Frequently asked questions</h2>
          <div className="faq-list">
            {faq.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <div className="faq-answer">
                  <InlineMarkdown text={item.a} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
      {updated && (
        <p className="page-updated">
          Last reviewed: <time dateTime={updated}>{formatDate(updated)}</time>
        </p>
      )}
    </>
  );
}
