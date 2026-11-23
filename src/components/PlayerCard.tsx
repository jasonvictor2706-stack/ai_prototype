import { useState, useEffect } from "react";
import type { CharacterCard } from "../types";

interface PlayerCardProps {
  character: CharacterCard | null;
  isGeneratingCharacter: boolean;
  isGeneratingPortrait: boolean;
  isGeneratingBackstory: boolean;
}

const FALLBACK_CREST_SRC = "/src/assets/images/portrait_placeholder_crest_1795465519727.jpg";

export function PlayerCard({
  character,
  isGeneratingCharacter,
  isGeneratingPortrait,
  isGeneratingBackstory,
}: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [character?.portraitUrl, character?.id]);

  const portraitSrc =
    character?.portraitUrl && !imgError ? character.portraitUrl : FALLBACK_CREST_SRC;

  const healthPct = character ? Math.min(100, Math.round((character.stats.health / 180) * 100)) : 0;
  const manaPct = character ? Math.min(100, Math.round((character.stats.mana / 160) * 100)) : 0;
  const strengthPct = character ? Math.min(100, Math.round((character.stats.strength / 100) * 100)) : 0;

  return (
    <article
      aria-label="Character Player Card"
      className="relative mx-auto w-full max-w-[440px] rounded-xl p-[3px] bg-gradient-to-b from-amber-500/60 via-amber-700/50 to-amber-900/70 shadow-[0_24px_64px_rgba(0,0,0,0.72)]"
    >
      {/* Inner double brass frame & parchment body */}
      <div className="parchment-card-surface relative rounded-[10px] border border-amber-950/60 px-6 pt-5 pb-6 text-stone-900">
        {/* Corner brass rivets */}
        <span aria-hidden="true" className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full bg-amber-800/70 ring-1 ring-amber-200/40" />
        <span aria-hidden="true" className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-800/70 ring-1 ring-amber-200/40" />
        <span aria-hidden="true" className="absolute bottom-2.5 left-2.5 h-2 w-2 rounded-full bg-amber-800/70 ring-1 ring-amber-200/40" />
        <span aria-hidden="true" className="absolute bottom-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-800/70 ring-1 ring-amber-200/40" />

        {/* Header: Character Name (stylized fantasy font) + Class */}
        <header className="text-center pb-3 border-b border-amber-900/25">
          <h1
            className="font-display text-2xl sm:text-[26px] font-bold tracking-wide text-stone-900 leading-tight min-h-[34px]"
            style={{ textWrap: "balance" }}
          >
            {isGeneratingCharacter
              ? "Summoning Character..."
              : character
                ? character.name
                : "Unforged Vessel"}
          </h1>
          <p className="mt-1 font-display text-xs tracking-[0.18em] text-amber-900/90 font-semibold">
            {isGeneratingCharacter
              ? "Consulting the Grimoire"
              : character
                ? character.charClass
                : "Awaiting Transmutation"}
          </p>
        </header>

        {/* Backstory Section — directly below character name and class */}
        <section
          aria-label="Character Backstory"
          className="mt-3 pb-3 border-b border-amber-900/20 min-h-[56px] text-center"
        >
          {isGeneratingBackstory ? (
            <p className="text-sm italic text-stone-700 leading-relaxed">
              Inscribing origin chronicle...
            </p>
          ) : character?.backstory ? (
            <p className="text-[14.5px] leading-relaxed text-stone-800 font-serif">
              {character.backstory}
            </p>
          ) : (
            <p className="text-xs italic text-stone-600 leading-relaxed">
              {character
                ? "No origin chronicle inscribed yet. Click Generate Backstory to reveal this character's past."
                : "Generate a character to begin forging their portrait, origin story, and attributes."}
            </p>
          )}
        </section>

        {/* Portrait Frame */}
        <div className="mt-4 relative aspect-square w-full overflow-hidden rounded-lg border-2 border-amber-900/55 bg-stone-950 shadow-inner">
          <img
            src={portraitSrc}
            alt={
              character?.portraitUrl
                ? `Fantasy portrait of ${character.name}, ${character.charClass}`
                : "Alchemical crest placeholder"
            }
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              isGeneratingPortrait || isGeneratingCharacter ? "opacity-35" : "opacity-100"
            }`}
          />

          {/* Subtle vignette for frame depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_28px_rgba(12,8,5,0.65)]"
          />

          {!character?.portraitUrl && !isGeneratingPortrait && !isGeneratingCharacter && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-transparent px-4 py-3 text-center">
              <p className="text-xs text-amber-100/90 tracking-wide">
                {character
                  ? "Select Generate Portrait to illustrate this character"
                  : "Generate a character first to unlock portrait alchemy"}
              </p>
            </div>
          )}

          {(isGeneratingPortrait || isGeneratingCharacter) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/55 px-4 text-center">
              <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
              <p className="mt-3 text-xs font-medium tracking-wide text-amber-100">
                {isGeneratingCharacter ? "Rolling name, class, and stats..." : "Painting character portrait..."}
              </p>
            </div>
          )}
        </div>

        {/* Randomized Stats: Health, Mana, Strength */}
        <section aria-label="Character Attributes" className="mt-4 pt-3 border-t border-amber-900/20">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-amber-950/[0.06] border border-amber-900/20 px-3 py-2">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-stone-700">Health</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-rose-900">
                  {character ? character.stats.health : "--"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-stone-900/15">
                <div
                  className="h-full bg-rose-700 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${healthPct / 100})` }}
                />
              </div>
            </div>

            <div className="rounded-md bg-amber-950/[0.06] border border-amber-900/20 px-3 py-2">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-stone-700">Mana</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-sky-900">
                  {character ? character.stats.mana : "--"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-stone-900/15">
                <div
                  className="h-full bg-sky-700 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${manaPct / 100})` }}
                />
              </div>
            </div>

            <div className="rounded-md bg-amber-950/[0.06] border border-amber-900/20 px-3 py-2">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-stone-700">Strength</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-950">
                  {character ? character.stats.strength : "--"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-stone-900/15">
                <div
                  className="h-full bg-amber-700 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${strengthPct / 100})` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
