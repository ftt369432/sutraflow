import { GeniePersonality, GeniePreferences } from '../types/genie';

export class GenieMagicService {
  private readonly magicPhrases = [
    "Your wish is my command!",
    "Let me wave my magic wand...",
    "Abracadabra!",
    "In a puff of smoke...",
    "By the power of ancient wisdom..."
  ];

  private readonly soundEffects = {
    magic: 'magic-sparkle.mp3',
    grant: 'wish-granted.mp3',
    think: 'magical-thinking.mp3',
    success: 'success-chime.mp3'
  };

  constructor(
    private personality: GeniePersonality,
    private preferences: GeniePreferences
  ) {}

  public async grantWish(wish: string): Promise<string> {
    if (this.preferences.soundEffects.enabled) {
      await this.playSound('magic');
    }

    const phrase = this.getRandomPhrase(this.magicPhrases);
    const response = await this.generateMagicalResponse(wish);

    return `${phrase} ${response}`;
  }

  private async playSound(type: string): Promise<void> {
    // Simple sound implementation - can be enhanced
    console.log(`🎵 Playing ${type} sound effect`);
  }

  private getRandomPhrase(phrases: string[]): string {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  private async generateMagicalResponse(wish: string): Promise<string> {
    const playfulness = this.personality.traits.playfulness;
    const wisdom = this.personality.traits.wisdom;
    
    let response = '';
    
    if (playfulness > 0.7) {
      response += this.addMagicalFlair();
    }
    
    if (wisdom > 0.7) {
      response += this.addWiseAdvice();
    }

    return response;
  }

  private addMagicalFlair(): string {
    const flair = [
      "✨ ",
      "🌟 ",
      "🎭 ",
      "🔮 "
    ];
    return flair[Math.floor(Math.random() * flair.length)];
  }

  private addWiseAdvice(): string {
    const wisdom = [
      "Remember, true magic comes from within.",
      "The path to wisdom is paved with experience.",
      "Every journey begins with a single step."
    ];
    return wisdom[Math.floor(Math.random() * wisdom.length)];
  }
} 