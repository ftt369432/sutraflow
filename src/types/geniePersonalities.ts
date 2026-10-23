import { GeniePersonality as _GeniePersonality } from './genie';

export const GENIE_ARCHETYPES = {
  WISE_MENTOR: {
    traits: {
      playfulness: 0.3,
      wisdom: 0.9,
      mystique: 0.7
    },
    responses: {
      granting: [
        "Let wisdom guide your path...",
        "Through knowledge, all things are possible...",
        "As the ancient scrolls foretold..."
      ],
      thinking: [
        "Consulting the ancient wisdom...",
        "Meditating on your request...",
        "Seeking the deeper meaning..."
      ],
      declining: [
        "Perhaps there is another way...",
        "Let us consider a different approach...",
        "Wisdom suggests an alternative path..."
      ],
      encouraging: [
        "Every challenge brings growth.",
        "Trust in your inner wisdom.",
        "The journey teaches what you need to know."
      ]
    },
    catchphrases: {
      greeting: [
        "Greetings, seeker of wisdom.",
        "Ah, the student returns.",
        "Welcome to the path of knowledge."
      ],
      farewell: [
        "Until our paths cross again...",
        "May wisdom light your way.",
        "Remember what you've learned."
      ]
    }
  },

  PLAYFUL_TRICKSTER: {
    traits: {
      playfulness: 0.9,
      wisdom: 0.5,
      mystique: 0.8
    },
    responses: {
      granting: [
        "✨ Poof! Your wish is my fun command!",
        "Let's sprinkle some magic sparkles on this!",
        "Time for some magical mischief!"
      ],
      thinking: [
        "Juggling some magical ideas...",
        "Cooking up something special...",
        "Let me pull a rabbit out of my hat..."
      ],
      declining: [
        "Oopsie! That's a bit too tricky, even for me!",
        "Even magic has its silly limits!",
        "Let's try something more fun instead!"
      ]
    }
  },

  EFFICIENT_ASSISTANT: {
    traits: {
      playfulness: 0.4,
      wisdom: 0.7,
      mystique: 0.3
    },
    responses: {
      granting: [
        "Processing your request efficiently.",
        "Implementing optimal solution.",
        "Task accepted, executing now."
      ],
      thinking: [
        "Analyzing options...",
        "Calculating optimal approach...",
        "Processing request parameters..."
      ]
    }
  },

  MYSTICAL_SAGE: {
    traits: {
      playfulness: 0.2,
      wisdom: 0.9,
      mystique: 0.9
    },
    responses: {
      granting: [
        "By the ancient powers...",
        "The stars align with your request...",
        "The mystic forces hear your call..."
      ]
    }
  },

  FRIENDLY_COMPANION: {
    traits: {
      playfulness: 0.7,
      wisdom: 0.6,
      mystique: 0.4
    },
    responses: {
      granting: [
        "Happy to help, friend!",
        "Let's tackle this together!",
        "Consider it done, buddy!"
      ]
    }
  }
} as const;

export interface PersonalityModifiers {
  timeOfDay: {
    morning: { playfulness: number; wisdom: number };
    afternoon: { playfulness: number; wisdom: number };
    evening: { playfulness: number; mystique: number };
  };
  userMood: {
    stressed: { wisdom: number; playfulness: number };
    focused: { mystique: number; playfulness: number };
    relaxed: { playfulness: number; wisdom: number };
  };
  workContext: {
    deadline: { wisdom: number; playfulness: number };
    creative: { playfulness: number; mystique: number };
    learning: { wisdom: number; mystique: number };
  };
}

export const PERSONALITY_MODIFIERS: PersonalityModifiers = {
  timeOfDay: {
    morning: { playfulness: 0.3, wisdom: 0.8 },
    afternoon: { playfulness: 0.6, wisdom: 0.6 },
    evening: { playfulness: 0.4, mystique: 0.7 }
  },
  userMood: {
    stressed: { wisdom: 0.8, playfulness: 0.2 },
    focused: { mystique: 0.6, playfulness: 0.3 },
    relaxed: { playfulness: 0.8, wisdom: 0.5 }
  },
  workContext: {
    deadline: { wisdom: 0.8, playfulness: 0.2 },
    creative: { playfulness: 0.8, mystique: 0.7 },
    learning: { wisdom: 0.9, mystique: 0.6 }
  }
};

export interface PersonalityTransition {
  from: keyof typeof GENIE_ARCHETYPES;
  to: keyof typeof GENIE_ARCHETYPES;
  duration: number; // in milliseconds
  triggers: string[];
}

export const PERSONALITY_TRANSITIONS: PersonalityTransition[] = [
  {
    from: 'PLAYFUL_TRICKSTER',
    to: 'EFFICIENT_ASSISTANT',
    duration: 1000,
    triggers: ['deadline', 'urgent', 'important']
  },
  {
    from: 'EFFICIENT_ASSISTANT',
    to: 'WISE_MENTOR',
    duration: 1500,
    triggers: ['stuck', 'confused', 'help']
  },
  {
    from: 'MYSTICAL_SAGE',
    to: 'FRIENDLY_COMPANION',
    duration: 800,
    triggers: ['casual', 'chat', 'break']
  }
];