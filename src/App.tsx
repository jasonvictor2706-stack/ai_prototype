import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, RefreshCw, ScrollText, BookmarkPlus, Check } from "lucide-react";
import type { CharacterCard } from "./types";
import { PlayerCard } from "./components/PlayerCard";
import { DeckPanel } from "./components/DeckPanel";

const DECK_STORAGE_KEY = "alchemists_grimoire_deck_v1";

function loadSavedDeck(): CharacterCard[] {
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CharacterCard[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [character, setCharacter] = useState<CharacterCard | null>(null);
  const [deck, setDeck] = useState<CharacterCard[]>(() => loadSavedDeck());
  const [recentNames, setRecentNames] = useState<string[]>([]);

  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isGeneratingBackstory, setIsGeneratingBackstory] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
      setErrorMessage(
        "Browser storage is full for additional large portraits. Remove an older card from My Deck to save more."
      );
    }
  }, [deck]);

  const isAnyLoading = isGeneratingCharacter || isGeneratingPortrait || isGeneratingBackstory;

  async function handleGenerateCharacter() {
    setErrorMessage(null);
    setSaveFeedback(null);
    setIsGeneratingCharacter(true);

    try {
      const response = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousNames: recentNames }),
      });

      const data = (await response.json()) as {
        name?: string;
        charClass?: string;
        stats?: { health: number; mana: number; strength: number };
        error?: string;
      };

      if (!response.ok || !data.name || !data.charClass || !data.stats) {
        throw new Error(data.error || "Unable to generate character.");
      }

      const newCard: CharacterCard = {
        id: crypto.randomUUID(),
        name: data.name,
        charClass: data.charClass,
        stats: data.stats,
        portraitUrl: null,
        portraitVersion: 0,
        backstory: null,
        createdAt: Date.now(),
      };

      setCharacter(newCard);
      setRecentNames((prev) => [...prev.slice(-14), data.name!]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate character.");
    } finally {
      setIsGeneratingCharacter(false);
    }
  }

  async function requestPortrait(isRegenerate: boolean) {
    if (!character) return;
    setErrorMessage(null);
    setSaveFeedback(null);
    setIsGeneratingPortrait(true);

    const nextVersion = isRegenerate ? character.portraitVersion + 1 : character.portraitVersion;

    try {
      const response = await fetch("/api/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: character.name,
          charClass: character.charClass,
          variationIndex: nextVersion,
        }),
      });

      const data = (await response.json()) as { imageUrl?: string; error?: string };

      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || "Unable to generate portrait.");
      }

      setCharacter((prev) =>
        prev && prev.id === character.id
          ? { ...prev, portraitUrl: data.imageUrl!, portraitVersion: nextVersion }
          : prev
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate portrait.");
    } finally {
      setIsGeneratingPortrait(false);
    }
  }

  async function handleGenerateBackstory() {
    if (!character) return;
    setErrorMessage(null);
    setSaveFeedback(null);
    setIsGeneratingBackstory(true);

    try {
      const response = await fetch("/api/backstory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: character.name,
          charClass: character.charClass,
        }),
      });

      const data = (await response.json()) as { backstory?: string; error?: string };

      if (!response.ok || !data.backstory) {
        throw new Error(data.error || "Unable to write backstory.");
      }

      setCharacter((prev) =>
        prev && prev.id === character.id ? { ...prev, backstory: data.backstory! } : prev
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate backstory.");
    } finally {
      setIsGeneratingBackstory(false);
    }
  }

  function handleSaveToDeck() {
    if (!character) return;
    setErrorMessage(null);

    setDeck((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === character.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...character };
        return updated;
      }
      return [{ ...character }, ...prev];
    });

    setSaveFeedback("Saved to Deck");
    window.setTimeout(() => {
      setSaveFeedback((current) => (current === "Saved to Deck" ? null : current));
    }, 2400);
  }

  function handleSelectFromDeck(card: CharacterCard) {
    setErrorMessage(null);
    setSaveFeedback(null);
    setCharacter({ ...card });
  }

  function handleRemoveFromDeck(id: string) {
    setDeck((prev) => prev.filter((item) => item.id !== id));
  }

  const hasCharacter = character !== null;
  const hasPortrait = Boolean(character?.portraitUrl);
  const isAlreadyInDeck = Boolean(character && deck.some((item) => item.id === character.id));

  return (
    <div className="alchemist-workbench-bg min-h-screen flex flex-col text-amber-50">
      {/* 3-Zone Top Bar Contract */}
      <header className="border-b border-amber-800/35 bg-stone-950/75 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-8 py-4">
          <a
            href="#workbench"
            className="font-display text-lg sm:text-xl font-bold tracking-wider text-amber-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          >
            Alchemist&apos;s Grimoire
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-stone-300">
            <a
              href="#workbench"
              className="hover:text-amber-200 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workbench
            </a>
            <a
              href="#my-deck"
              className="hover:text-amber-200 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              My Deck
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleGenerateCharacter}
              disabled={isAnyLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-stone-950 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Character</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workbench Area */}
      <main id="workbench" className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-8 py-8 lg:py-10">
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-rose-500/45 bg-rose-950/85 px-4 py-3 text-sm text-rose-100 shadow-lg"
          >
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-medium text-rose-200 hover:text-white underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Primary Focal Anchor: Player Card + Workbench Controls */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <PlayerCard
              character={character}
              isGeneratingCharacter={isGeneratingCharacter}
              isGeneratingPortrait={isGeneratingPortrait}
              isGeneratingBackstory={isGeneratingBackstory}
            />

            {/* Workbench Action Controls */}
            <div
              aria-label="Character Forge Controls"
              className="mt-6 w-full max-w-[440px] rounded-xl border border-amber-800/35 bg-stone-950/80 backdrop-blur-sm p-4 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGenerateCharacter}
                  disabled={isAnyLoading}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGeneratingCharacter ? "Generating Character..." : "Generate Character"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => requestPortrait(false)}
                  disabled={!hasCharacter || hasPortrait || isAnyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-600/50 bg-stone-900 px-4 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-950/60 hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Generate Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => requestPortrait(true)}
                  disabled={!hasCharacter || !hasPortrait || isAnyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-600/50 bg-stone-900 px-4 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-950/60 hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingPortrait ? "animate-spin" : ""}`} />
                  <span>Regenerate Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateBackstory}
                  disabled={!hasCharacter || isAnyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-600/50 bg-stone-900 px-4 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-950/60 hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <ScrollText className="h-4 w-4" />
                  <span>{isGeneratingBackstory ? "Writing Story..." : "Generate Backstory"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToDeck}
                  disabled={!hasCharacter || isAnyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600/55 bg-emerald-950/65 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-emerald-900/75 hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {saveFeedback ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                  <span>Save to Deck</span>
                </button>
              </div>
              {saveFeedback && (
                <p className="mt-2.5 text-center text-xs text-emerald-300">
                  {isAlreadyInDeck ? "Character saved to My Deck." : saveFeedback}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: My Deck */}
          <div className="lg:col-span-5">
            <DeckPanel
              deck={deck}
              activeCharacterId={character?.id ?? null}
              onSelectCard={handleSelectFromDeck}
              onRemoveCard={handleRemoveFromDeck}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
