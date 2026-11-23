import { Trash2 } from "lucide-react";
import type { CharacterCard } from "../types";

interface DeckPanelProps {
  deck: CharacterCard[];
  activeCharacterId: string | null;
  onSelectCard: (card: CharacterCard) => void;
  onRemoveCard: (id: string) => void;
}

const FALLBACK_CREST_SRC = "/src/assets/images/portrait_placeholder_crest_1795465519727.jpg";

export function DeckPanel({
  deck,
  activeCharacterId,
  onSelectCard,
  onRemoveCard,
}: DeckPanelProps) {
  return (
    <section
      id="my-deck"
      aria-label="My Deck"
      className="rounded-xl border border-amber-700/30 bg-stone-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-[0_18px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-amber-800/30">
        <div>
          <h2 className="font-display text-xl font-bold tracking-wide text-amber-100">
            My Deck
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Saved characters · Select any card to inspect on the workbench
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-amber-300/90 whitespace-nowrap shrink-0">
          {deck.length} {deck.length === 1 ? "Card" : "Cards"}
        </span>
      </div>

      {deck.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-stone-300">Your deck is empty.</p>
          <p className="mt-1.5 text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            Forge a character on the workbench and click Save to Deck to preserve their portrait, stats, and origin story.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 max-h-[680px] overflow-y-auto pr-1">
          {deck.map((card) => {
            const isSelected = card.id === activeCharacterId;
            return (
              <li key={card.id}>
                <div
                  className={`group relative flex items-start gap-3.5 rounded-lg border p-3 transition-colors duration-150 ${
                    isSelected
                      ? "border-amber-500/75 bg-amber-950/35"
                      : "border-stone-800 bg-stone-900/75 hover:border-amber-700/50 hover:bg-stone-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCard(card)}
                    className="flex flex-1 items-start gap-3.5 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-amber-800/50 bg-stone-950">
                      <img
                        src={card.portraitUrl || FALLBACK_CREST_SRC}
                        alt={`Portrait of ${card.name}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-amber-100 truncate">
                          {card.name}
                        </h3>
                      </div>

                      <p className="text-xs text-amber-300/85 tracking-wide">
                        {card.charClass}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[11px] tabular-nums text-stone-300">
                        <span>Health {card.stats.health}</span>
                        <span aria-hidden="true" className="text-stone-600">·</span>
                        <span>Mana {card.stats.mana}</span>
                        <span aria-hidden="true" className="text-stone-600">·</span>
                        <span>Strength {card.stats.strength}</span>
                      </div>

                      {card.backstory && (
                        <p className="mt-1.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {card.backstory}
                        </p>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveCard(card.id)}
                    aria-label={`Remove ${card.name} from deck`}
                    title={`Remove ${card.name}`}
                    className="shrink-0 rounded-md p-2 text-stone-400 hover:bg-rose-950/60 hover:text-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
