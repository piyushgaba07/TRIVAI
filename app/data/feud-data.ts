// Family Feud style game data with top 10 answers for each question

export const FEUD_QUESTIONS = [
  {
    id: 1,
    question: "Name something you do in the morning",
    answers: [
      "shower",
      "brush teeth",
      "eat breakfast",
      "make coffee",
      "wake up",
      "get dressed",
      "check phone",
      "go to work",
      "drink water",
      "exercise",
    ],
  },
  {
    id: 2,
    question: "Name a color you see in a rainbow",
    answers: ["red", "blue", "yellow", "green", "orange", "purple", "indigo", "violet", "pink", "pink"],
  },
  {
    id: 3,
    question: "Name something you keep in your wallet",
    answers: ["money", "credit card", "driver license", "photo", "id", "cash", "cards", "receipt", "pass", "ticket"],
  },
  {
    id: 4,
    question: "Name a type of fish",
    answers: ["salmon", "tuna", "trout", "bass", "cod", "shark", "goldfish", "catfish", "halibut", "perch"],
  },
  {
    id: 5,
    question: "Name something round",
    answers: ["ball", "circle", "plate", "wheel", "coin", "sun", "moon", "clock", "ring", "button"],
  },
  {
    id: 6,
    question: "Name a sport played with a ball",
    answers: [
      "basketball",
      "soccer",
      "baseball",
      "tennis",
      "volleyball",
      "golf",
      "football",
      "cricket",
      "bowling",
      "lacrosse",
    ],
  },
  {
    id: 7,
    question: "Name a kitchen appliance",
    answers: [
      "microwave",
      "oven",
      "refrigerator",
      "dishwasher",
      "blender",
      "toaster",
      "coffee maker",
      "stove",
      "sink",
      "freezer",
    ],
  },
  {
    id: 8,
    question: "Name something you find at the beach",
    answers: ["sand", "water", "shells", "rocks", "seaweed", "people", "seagulls", "waves", "umbrellas", "crabs"],
  },
  {
    id: 9,
    question: "Name a type of tree",
    answers: ["oak", "pine", "maple", "birch", "elm", "willow", "cedar", "spruce", "ash", "palm"],
  },
  {
    id: 10,
    question: "Name something you wear on your feet",
    answers: ["shoes", "socks", "boots", "sandals", "slippers", "sneakers", "heels", "flip flops", "cleats", "loafers"],
  },
]

export const GAME_STATES = {
  SETUP: "setup",
  LOADING: "loading",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
}

// AI generation function for creating custom feud questions
// In feud-data.ts
export function generateFeudQuestions(theme: string, count: number) {
  const prompts = [
    `Name something you find at a ${theme}`,
    `Name a type of ${theme}`,
    `Name something people do at a ${theme}`,
    `Name something associated with ${theme}`,
  ];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const prompt = prompts[i % prompts.length];
    questions.push({
      id: FEUD_QUESTIONS.length + i + 1,
      question: prompt,
      answers: Array(10)
        .fill("")
        .map((_, idx) => ({
          answer: `Answer ${idx + 1} for ${theme}`,
          points: 100 - (idx * 10)
        })),
      points: Array(10).fill(0).map((_, i) => 100 - (i * 10))
    });
  }
  return questions;
}