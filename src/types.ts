export interface CharacterStats {
  health: number;
  mana: number;
  strength: number;
}

export interface CharacterCard {
  id: string;
  name: string;
  charClass: string;
  stats: CharacterStats;
  portraitUrl: string | null;
  portraitVersion: number;
  backstory: string | null;
  createdAt: number;
}
