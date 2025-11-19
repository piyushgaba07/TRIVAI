export interface ConnectionsQuestion {
  groups: {
    category: string
    items: string[]
    difficulty: "common" | "tricky" | "confusing" | "obscure"
  }[]
  answer?: string
}

export const CONNECTIONS_QUESTIONS: ConnectionsQuestion[] = [
  {
    groups: [
      {
        category: "Programming Languages",
        items: ["Python", "JavaScript", "Java", "Ruby"],
        difficulty: "common",
      },
      {
        category: "Social Media Platforms",
        items: ["Facebook", "Twitter", "Instagram", "TikTok"],
        difficulty: "common",
      },
      {
        category: "Colors",
        items: ["Red", "Blue", "Green", "Yellow"],
        difficulty: "common",
      },
      {
        category: "Fruits",
        items: ["Apple", "Orange", "Banana", "Grape"],
        difficulty: "common",
      },
    ],
  },
  {
    groups: [
      {
        category: "Things you can 'fall' with",
        items: ["Asleep", "Behind", "In love", "Short"],
        difficulty: "tricky",
      },
      {
        category: "Types of Cats",
        items: ["Tiger", "Copy", "Mountain", "House"],
        difficulty: "tricky",
      },
      {
        category: "Things that go 'round'",
        items: ["Robin", "About-face", "Merry", "Through"],
        difficulty: "confusing",
      },
      {
        category: "Words that rhyme with 'Orange'",
        items: ["Storage", "Porridge", "Sausage", "George"],
        difficulty: "obscure",
      },
    ],
  },
  {
    groups: [
      {
        category: "Planets in our solar system",
        items: ["Mercury", "Venus", "Earth", "Mars"],
        difficulty: "common",
      },
      {
        category: "Shakespearean plays",
        items: ["Hamlet", "Macbeth", "Othello", "Romeo"],
        difficulty: "tricky",
      },
      {
        category: "Chemical elements",
        items: ["Carbon", "Oxygen", "Hydrogen", "Nitrogen"],
        difficulty: "common",
      },
      {
        category: "Types of clouds",
        items: ["Cumulus", "Stratus", "Cirrus", "Nimbus"],
        difficulty: "tricky",
      },
    ],
  },
]

export const GAME_STATES = {
  SETUP: "setup",
  LOADING: "loading",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
}

export async function generateConnectionsQuestions(theme: string, count: number): Promise<ConnectionsQuestion[]> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/v1/connections/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme,
        num_groups: 4,
        items_per_group: 4
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate game');
    }

    const { data } = await response.json();
    
    // Transform the API response to match our frontend format
    return [{
      groups: data.groups.map((group: any) => ({
        category: group.category,
        items: group.items,
        difficulty: group.difficulty
      }))
    }];
    
  } catch (error) {
    console.error('Error generating questions:', error);
    // Fallback to template if API fails
    return [{
      groups: [
        { 
          category: `${theme} related items`, 
          items: ["Example 1", "Example 2", "Example 3", "Example 4"], 
          difficulty: "common" 
        },
        { 
          category: `${theme} related places`, 
          items: ["Place 1", "Place 2", "Place 3", "Place 4"], 
          difficulty: "tricky" 
        },
        { 
          category: `${theme} related concepts`, 
          items: ["Concept 1", "Concept 2", "Concept 3", "Concept 4"], 
          difficulty: "confusing" 
        },
        { 
          category: `${theme} related objects`, 
          items: ["Object 1", "Object 2", "Object 3", "Object 4"], 
          difficulty: "obscure" 
        }
      ]
    }];
  }
}
