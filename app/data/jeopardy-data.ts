// Sample Jeopardy data for different themes
export const THEMED_BOARDS = {
  GENERAL: {
    categories: ["SCIENCE", "HISTORY", "GEOGRAPHY", "ENTERTAINMENT", "SPORTS"],
    questions: {
      SCIENCE: [
        {
          value: 200,
          question: "This element with atomic number 79 is known for its use in jewelry and electronics",
          answer: "What is Gold?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This physicist developed the theory of relativity",
          answer: "Who is Albert Einstein?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This is the process by which plants convert light energy into chemical energy",
          answer: "What is photosynthesis?",
          dailyDouble: true,
        },
        {
          value: 800,
          question: "This subatomic particle has a negative charge",
          answer: "What is an electron?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This scientist discovered penicillin",
          answer: "Who is Alexander Fleming?",
          dailyDouble: false,
        },
      ],
      HISTORY: [
        {
          value: 200,
          question: "This document begins with 'We the People'",
          answer: "What is the Constitution?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This ancient wonder was a lighthouse located in Alexandria, Egypt",
          answer: "What is the Lighthouse of Alexandria?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This king of England had six wives",
          answer: "Who is Henry VIII?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This war lasted from 1939 to 1945",
          answer: "What is World War II?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This civilization built Machu Picchu",
          answer: "Who are the Incas?",
          dailyDouble: false,
        },
      ],
      GEOGRAPHY: [
        {
          value: 200,
          question: "This is the largest ocean on Earth",
          answer: "What is the Pacific Ocean?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This African country is known as the 'Land of a Thousand Hills'",
          answer: "What is Rwanda?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This mountain is the tallest in the world",
          answer: "What is Mount Everest?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This European capital city is divided by the Danube River",
          answer: "What is Budapest?",
          dailyDouble: true,
        },
        {
          value: 1000,
          question: "This desert covers much of northern Africa",
          answer: "What is the Sahara Desert?",
          dailyDouble: false,
        },
      ],
      ENTERTAINMENT: [
        {
          value: 200,
          question: "This 1997 film features Leonardo DiCaprio and Kate Winslet on a doomed ship",
          answer: "What is Titanic?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This TV show features a high school chemistry teacher who becomes a methamphetamine manufacturer",
          answer: "What is Breaking Bad?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This band performed the album 'Abbey Road'",
          answer: "Who are The Beatles?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This actress starred in 'The Devil Wears Prada' and 'The Princess Diaries'",
          answer: "Who is Anne Hathaway?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This director is known for films such as 'Pulp Fiction' and 'Django Unchained'",
          answer: "Who is Quentin Tarantino?",
          dailyDouble: false,
        },
      ],
      SPORTS: [
        {
          value: 200,
          question: "This sport uses a shuttlecock",
          answer: "What is badminton?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This country has won the most FIFA World Cup tournaments",
          answer: "What is Brazil?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This number of players is on a standard basketball team on the court",
          answer: "What is 5?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This Olympic sport involves jumping on a large elastic canvas",
          answer: "What is trampoline?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This American swimmer has won the most Olympic gold medals",
          answer: "Who is Michael Phelps?",
          dailyDouble: true,
        },
      ],
    },
  },
  MOVIES: {
    categories: ["ACTION FILMS", "SCI-FI", "ANIMATION", "DIRECTORS", "MOVIE QUOTES"],
    questions: {
      "ACTION FILMS": [
        {
          value: 200,
          question: "This actor starred as John McClane in the 'Die Hard' series",
          answer: "Who is Bruce Willis?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This 2015 film features Tom Hardy and Charlize Theron in a post-apocalyptic desert chase",
          answer: "What is Mad Max: Fury Road?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This martial artist starred in 'Enter the Dragon'",
          answer: "Who is Bruce Lee?",
          dailyDouble: true,
        },
        {
          value: 800,
          question:
            "This 1996 action film stars Keanu Reeves as a cop trying to rescue passengers on a bus rigged with explosives",
          answer: "What is Speed?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question:
            "This actor performed his own stunts in the 'Mission: Impossible' franchise, including hanging from the Burj Khalifa",
          answer: "Who is Tom Cruise?",
          dailyDouble: false,
        },
      ],
      "SCI-FI": [
        {
          value: 200,
          question: "This 1977 film begins with the text 'A long time ago in a galaxy far, far away...'",
          answer: "What is Star Wars?",
          dailyDouble: false,
        },
        {
          value: 400,
          question:
            "This 1982 sci-fi film features a replicant saying 'All those moments will be lost in time, like tears in rain'",
          answer: "What is Blade Runner?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This 1999 film asks 'What is the Matrix?'",
          answer: "What is The Matrix?",
          dailyDouble: false,
        },
        {
          value: 800,
          question:
            "This Christopher Nolan film features astronauts traveling through a wormhole to find a new home for humanity",
          answer: "What is Interstellar?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This 1968 Stanley Kubrick film features the sentient computer HAL 9000",
          answer: "What is 2001: A Space Odyssey?",
          dailyDouble: true,
        },
      ],
      ANIMATION: [
        {
          value: 200,
          question: "This 1994 Disney film features the song 'Circle of Life'",
          answer: "What is The Lion King?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This Pixar film features a rat who wants to become a chef",
          answer: "What is Ratatouille?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This Japanese animation studio created 'Spirited Away' and 'My Neighbor Totoro'",
          answer: "What is Studio Ghibli?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This stop-motion animation technique was used in films like 'The Nightmare Before Christmas'",
          answer: "What is claymation?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This 2018 film features Miles Morales as Spider-Man in an animated multiverse adventure",
          answer: "What is Spider-Man: Into the Spider-Verse?",
          dailyDouble: false,
        },
      ],
      DIRECTORS: [
        {
          value: 200,
          question: "This director is known for films such as 'E.T.' and 'Jurassic Park'",
          answer: "Who is Steven Spielberg?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This director created the 'Lord of the Rings' trilogy",
          answer: "Who is Peter Jackson?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This director is known for psychological thrillers like 'Psycho' and 'The Birds'",
          answer: "Who is Alfred Hitchcock?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This director's films include 'Inception', 'The Dark Knight', and 'Dunkirk'",
          answer: "Who is Christopher Nolan?",
          dailyDouble: true,
        },
        {
          value: 1000,
          question: "This Japanese director created 'Seven Samurai' and 'Rashomon'",
          answer: "Who is Akira Kurosawa?",
          dailyDouble: false,
        },
      ],
      "MOVIE QUOTES": [
        {
          value: 200,
          question: "'May the Force be with you' is a famous line from this film franchise",
          answer: "What is Star Wars?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "'Here's looking at you, kid' is a famous line from this 1942 film",
          answer: "What is Casablanca?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "'I'm going to make him an offer he can't refuse' is a famous line from this film",
          answer: "What is The Godfather?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "'You can't handle the truth!' is a famous line from this 1992 film",
          answer: "What is A Few Good Men?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "'My precious' is a famous line from this film series",
          answer: "What is The Lord of the Rings?",
          dailyDouble: false,
        },
      ],
    },
  },
  "VIDEO GAMES": {
    categories: ["NINTENDO", "PLAYSTATION", "XBOX", "PC GAMING", "GAMING HISTORY"],
    questions: {
      NINTENDO: [
        {
          value: 200,
          question: "This plumber is Nintendo's mascot and most famous character",
          answer: "Who is Mario?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This Nintendo franchise features creatures that trainers catch and battle",
          answer: "What is Pokémon?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This green-clad hero saves Princess Zelda in his many adventures",
          answer: "Who is Link?",
          dailyDouble: true,
        },
        {
          value: 800,
          question: "This Nintendo console released in 2017 can be played both as a handheld and on a TV",
          answer: "What is the Nintendo Switch?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This Nintendo character is a bounty hunter who wears a power suit",
          answer: "Who is Samus Aran?",
          dailyDouble: false,
        },
      ],
      PLAYSTATION: [
        {
          value: 200,
          question: "This treasure hunter is the protagonist of the 'Uncharted' series",
          answer: "Who is Nathan Drake?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This PlayStation mascot is a bandicoot who spins and jumps through levels",
          answer: "Who is Crash Bandicoot?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This action-adventure game series features a Spartan warrior named Kratos",
          answer: "What is God of War?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This PlayStation exclusive features a post-apocalyptic world with infected humans",
          answer: "What is The Last of Us?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This racing game series on PlayStation features realistic driving physics and Gran Turismo Sport",
          answer: "What is Gran Turismo?",
          dailyDouble: true,
        },
      ],
      XBOX: [
        {
          value: 200,
          question: "This Xbox franchise features Master Chief as its protagonist",
          answer: "What is Halo?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This Xbox racing game series features the word 'Forza' in its title",
          answer: "What is Forza Motorsport/Horizon?",
          dailyDouble: false,
        },
        {
          value: 600,
          question:
            "This Xbox exclusive is a third-person shooter featuring soldiers fighting against the Locust Horde",
          answer: "What is Gears of War?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This subscription service gives Xbox players access to a library of games for a monthly fee",
          answer: "What is Xbox Game Pass?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This Xbox motion-sensing input device was discontinued in 2017",
          answer: "What is Kinect?",
          dailyDouble: false,
        },
      ],
      "PC GAMING": [
        {
          value: 200,
          question: "This Valve digital distribution platform is the largest for PC gaming",
          answer: "What is Steam?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This PC strategy game series features civilizations advancing through historical eras",
          answer: "What is Civilization?",
          dailyDouble: false,
        },
        {
          value: 600,
          question: "This MMORPG by Blizzard features the world of Azeroth",
          answer: "What is World of Warcraft?",
          dailyDouble: true,
        },
        {
          value: 800,
          question:
            "This PC game involves building and managing a city with considerations for traffic, pollution, and citizen happiness",
          answer: "What is SimCity/Cities: Skylines?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question: "This company created the first-person shooters 'DOOM' and 'Quake'",
          answer: "What is id Software?",
          dailyDouble: false,
        },
      ],
      "GAMING HISTORY": [
        {
          value: 200,
          question:
            "This simple tennis game from 1972 is often considered the first commercially successful video game",
          answer: "What is Pong?",
          dailyDouble: false,
        },
        {
          value: 400,
          question: "This 1980s video game crash primarily affected this country's gaming industry",
          answer: "What is the United States?",
          dailyDouble: false,
        },
        {
          value: 600,
          question:
            "This company released the Famicom in Japan before bringing it to North America under a different name",
          answer: "What is Nintendo?",
          dailyDouble: false,
        },
        {
          value: 800,
          question: "This controversial 1990s fighting game led to the creation of the ESRB rating system",
          answer: "What is Mortal Kombat?",
          dailyDouble: false,
        },
        {
          value: 1000,
          question:
            "This gaming phenomenon of the late 1990s and early 2000s featured collectible monsters in games, cards, and TV shows",
          answer: "What is Pokémon?",
          dailyDouble: false,
        },
      ],
    },
  },
}

// Game states
export const GAME_STATES = {
  SETUP: "setup",
  LOADING: "loading",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
}
