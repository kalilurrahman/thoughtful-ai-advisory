import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { getGlossaryTerm, type GlossaryTerm } from "./glossary";

// Definition popover for underlined glossary terms (a.term, added by the Markdown renderer).
// Mouse: hover previews, click opens the glossary entry. Keyboard: focus previews, Enter opens.
// Touch: the first tap shows the definition (with a link to the entry), a second tap opens it.

interface Tip {
  term: GlossaryTerm;
  anchor: HTMLElement;
  pinned: boolean;
}

const TIP_ID = "glossary-tip";

export function GlossaryTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<Tip | null>(null);
  tipRef.current = tip;

  useEffect(() => {
    let lastPointer = "mouse";
    const termOf = (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.<HTMLElement>("a.term") ?? null;
    const show = (anchor: HTMLElement, pinned: boolean) => {
      const term = getGlossaryTerm(anchor.dataset["term"] ?? "");
      if (!term) return;
      anchor.setAttribute("aria-describedby", TIP_ID);
      setTip({ term, anchor, pinned });
    };
    const hide = () => {
      tipRef.current?.anchor.removeAttribute("aria-describedby");
      setTip(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      lastPointer = e.pointerType;
      const current = tipRef.current;
      if (current?.pinned && !termOf(e.target) && !boxRef.current?.contains(e.target as Node))
        hide();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const a = termOf(e.target);
      if (a && !tipRef.current?.pinned) show(a, false);
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || tipRef.current?.pinned) return;
      const next = e.relatedTarget as Node | null;
      if (termOf(e.target) && !(next && boxRef.current?.contains(next))) hide();
    };
    const onFocusIn = (e: FocusEvent) => {
      const a = termOf(e.target);
      if (a) show(a, false);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (termOf(e.target) && !tipRef.current?.pinned) hide();
    };
    // Capture phase, so a first tap is stopped before the page's link handler navigates.
    const onClick = (e: MouseEvent) => {
      const a = termOf(e.target);
      if (!a || lastPointer !== "touch") return;
      const current = tipRef.current;
      if (current?.pinned && current.anchor === a) return; // second tap: follow the link
      e.preventDefault();
      show(a, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tipRef.current) hide();
    };
    const onScroll = () => {
      if (tipRef.current) hide();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Place the box under the term, or above it near the bottom of the window.
  useEffect(() => {
    if (!tip) return setPos(null);
    const r = tip.anchor.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    const above = r.bottom + 200 > window.innerHeight && r.top > 220;
    setPos({ top: above ? r.top - 8 : r.bottom + 8, left, above });
  }, [tip]);

  if (!tip || !pos) return null;
  return (
    <div
      ref={boxRef}
      id={TIP_ID}
      role="tooltip"
      className={`glossary-tip${pos.above ? " is-above" : ""}${tip.pinned ? " is-pinned" : ""}`}
      style={{ top: pos.top, left: pos.left }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && !tip.pinned && e.relatedTarget !== tip.anchor)
          setTip(null);
      }}
    >
      <p className="glossary-tip-term">{tip.term.term}</p>
      <p className="glossary-tip-def">{tip.term.definition}</p>
      <Link
        className="glossary-tip-link"
        to="/glossary"
        hash={tip.term.id}
        onClick={() => setTip(null)}
      >
        Open in the glossary <ArrowRight weight="bold" aria-hidden="true" />
      </Link>
    </div>
  );
}
