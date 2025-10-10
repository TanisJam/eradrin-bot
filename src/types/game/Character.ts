export interface Character {
  name: string;
  link: string;
}

export interface CharacterDetails extends Character {
  imageUrl?: string;
}
