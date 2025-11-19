"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FEUD_QUESTIONS, GAME_STATES, generateFeudQuestions } from "@/app/data/feud-data"
import { ArrowLeft } from "lucide-react"



export default function FeudGame() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Game questions and setup state
  const [gameQuestions, setGameQuestions] = useState<typeof FEUD_QUESTIONS>([])
  const [customTheme, setCustomTheme] = useState("")
  const [showSetup, setShowSetup] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is logged in and load initial questions
  useEffect(() => {
    const loggedInUser = localStorage.getItem("arcadeTrivia_user")
    if (loggedInUser) {
      setIsLoggedIn(true)
      // Load initial questions with default theme
      handleCustomTheme()
    } else {
      router.push("/games")
    }

    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  // Game state
  const [gameState, setGameState] = useState(GAME_STATES.SETUP)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(gameQuestions[0] || null);
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [userAnswer, setUserAnswer] = useState("")
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())
  const [currentRoundAnswers, setCurrentRoundAnswers] = useState<number[]>([])
  const [gameOver, setGameOver] = useState(false)

  const maxStrikes = 3

const handleCustomTheme = async () => {
  if (!customTheme) {
    return;
  }

  try {
    setGameState(GAME_STATES.LOADING);
    setError(null);
    
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/v1/feud/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: customTheme.trim(),
        num_questions: 3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Failed to generate questions');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format: questions array not found');
    }

    // Transform API response to match the expected format
   const formattedQuestions = data.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answers: q.answers.map((a: any) => 
        typeof a === 'string' ? a : a.answer
      )
    }));

    console.log('Formatted questions:', formattedQuestions);
    
    if (formattedQuestions.length === 0) {
      throw new Error('No questions were generated. Please try a different theme.');
    }

    // Set the game state with the new questions
    setGameQuestions(formattedQuestions);
    setCurrentQuestion(formattedQuestions[0]);
    setCurrentQuestionIndex(0);
    setRevealedAnswers(new Set());
    setCurrentRoundAnswers([]);
    setScore(0);
    setStrikes(0);
    setGameState(GAME_STATES.PLAYING);
    
  } catch (error) {
    console.error('Error in handleCustomTheme:', error);
    setError(error instanceof Error ? error.message : 'Failed to generate questions');
    setGameState(GAME_STATES.SETUP);
  }
};

  // Start game
const startGame = () => {
  setGameState(GAME_STATES.LOADING);
  
  // If no questions were loaded, use default
  const questionsToUse = gameQuestions.length > 0 ? gameQuestions : FEUD_QUESTIONS;
  
  if (questionsToUse.length === 0) {
    setError('No questions available. Please try again.');
    setGameState(GAME_STATES.SETUP);
    return;
  }

  setTimeout(() => {
    setGameQuestions(questionsToUse);
    setCurrentQuestion(questionsToUse[0]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStrikes(0);
    setAnsweredQuestions(new Set());
    setRevealedAnswers(new Set());
    setCurrentRoundAnswers([]);
    setUserAnswer('');
    setGameState(GAME_STATES.PLAYING);
    setGameOver(false);
  }, 1500);
};

const handleSubmitAnswer = () => {
  if (!userAnswer.trim() || !currentQuestion) return;

  const normalizeAnswer = (answer: string) => {
    if (!answer) return '';
    return answer
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const userNormalized = normalizeAnswer(userAnswer);
  const questionAnswers = currentQuestion.answers || [];
  let foundMatch = -1;

  // Check for a match in answers
  for (let i = 0; i < questionAnswers.length; i++) {
    if (!revealedAnswers.has(i)) {
      const answerObj = questionAnswers[i];
      const answerText = typeof answerObj === 'string' ? answerObj : answerObj.answer;
      const normalizedCorrect = normalizeAnswer(answerText);
      
      if (normalizedCorrect === userNormalized) {
        foundMatch = i;
        break;
      }
    }
  }

  if (foundMatch !== -1) {
    // Correct answer
    const newRevealed = new Set(revealedAnswers);
    newRevealed.add(foundMatch);
    setRevealedAnswers(newRevealed);
    setCurrentRoundAnswers([...currentRoundAnswers, foundMatch]);

    // Calculate points
    const answerObj = questionAnswers[foundMatch];
    const points = typeof answerObj === 'object' ? answerObj.points : 
                 (currentQuestion.points?.[foundMatch] || 100 - (foundMatch * 10));
    
    setScore(prev => prev + points);
    setUserAnswer('');

    // Check if all answers are revealed
    if (newRevealed.size === questionAnswers.length) {
      setTimeout(moveToNextQuestion, 1500);
    }
  } else {
    // Wrong answer - add strike
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    setUserAnswer('');

    if (newStrikes >= maxStrikes) {
      endGame();
    }
  }
};

  const endGame = () => {
    setGameOver(true)
    setGameState(GAME_STATES.GAME_OVER)
  }

  const resetGame = () => {
    setGameState(GAME_STATES.SETUP)
    setGameQuestions(FEUD_QUESTIONS)
    setCustomTheme("")
    setShowSetup(true)
    setGameOver(false)
    setError(null)
  }

  const navigateToGames = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/games")
    }, 1000)
  }

const skipQuestion = () => {
  // Reveal all answers for the current question
  const allAnswers = new Set<number>();
  const answers = currentQuestion?.answers || [];
  
  for (let i = 0; i < answers.length; i++) {
    allAnswers.add(i);
  }
  
  setRevealedAnswers(allAnswers);
  setStrikes(maxStrikes);

  // Move to next question after a short delay
  setTimeout(() => {
    moveToNextQuestion();
  }, 1500);
};

const moveToNextQuestion = () => {
  const nextIndex = currentQuestionIndex + 1;
  if (nextIndex < gameQuestions.length) {
    setCurrentQuestionIndex(nextIndex);
    setCurrentQuestion(gameQuestions[nextIndex]);
    setRevealedAnswers(new Set());
    setCurrentRoundAnswers([]);
    setStrikes(0);
    setUserAnswer('');
  } else {
    endGame();
  }
};

  if (error && gameState === GAME_STATES.SETUP) {
    return (
      <div className="min-h-screen bg-black text-white font-pixel flex items-center justify-center p-4">
        <div className="bg-red-900 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl mb-4">ERROR</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={resetGame} className="bg-red-700 hover:bg-red-600">
            RETURN TO SETUP
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-pixel flex items-center justify-center p-4">
      {/* Transition effect */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black z-50 animate-fade-out pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-red-400 animate-pulse">FEUD!</div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl h-[85vh] bg-black rounded-lg overflow-hidden scanlines">
        {/* Setup Screen */}
        {gameState === GAME_STATES.SETUP && (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl md:text-2xl text-center text-red-400 font-bold mb-8">FAMILY FEUD</h2>

            <div className="max-w-md mx-auto w-full space-y-8 flex flex-col items-center">
              <div className="text-center space-y-4">
                <p className="text-lg text-yellow-300">Welcome to Family Feud!</p>
                <p className="text-sm text-gray-300">Guess the top 10 answers to each question.</p>
                <p className="text-sm text-gray-300">Get 3 strikes and it's game over!</p>
              </div>

              <div className="space-y-4 text-sm text-gray-400">
                <div className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-bold text-yellow-300">HOW TO PLAY:</p>
                  <p>• Type in your answer and submit</p>
                  <p>• Match answers for points</p>
                  <p>• Wrong answers give you a strike</p>
                  <p>• 3 strikes = Game Over</p>
                </div>
              </div>

              <div className="w-full space-y-3 border-t border-gray-600 pt-4">
                <Label htmlFor="customTheme" className="text-red-400 text-xs text-center block">
                  OR ENTER A CUSTOM THEME
                </Label>
                <Input
                  id="customTheme"
                  placeholder="e.g., birthday party, beach"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="bg-black border-white text-white h-8 text-xs text-center"
                />
                <Button
                  onClick={handleCustomTheme}
                  disabled={!customTheme.trim()}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-400 border-2 border-white font-bold text-xs h-8"
                >
                  GENERATE CUSTOM
                </Button>
              </div>

              <div className="pt-4 flex justify-center gap-4 w-full">
                <Button
                  onClick={navigateToGames}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-2 border-white px-4 py-1 h-8 text-xs"
                >
                  BACK
                </Button>
                <Button
                  onClick={() => {
                    setGameQuestions(FEUD_QUESTIONS)
                    setShowSetup(false)
                    startGame()
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white border-2 border-white px-4 py-1 h-8 text-xs"
                >
                  START GAME
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {gameState === GAME_STATES.LOADING && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-red-400 text-xl animate-pulse mb-4">LOADING GAME</div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState === GAME_STATES.PLAYING && (
          <div className="h-full flex flex-col p-4 overflow-auto">
            {/* Header */}
            <div className="mb-4 flex justify-between items-center">
              <div className="bg-red-700 border-2 border-white px-3 py-1 rounded text-xs">
                <span>SCORE: </span>
                <span className="text-yellow-300">${score}</span>
              </div>
              <div className="text-red-400 text-sm font-bold">
                Q{currentQuestionIndex + 1}/{gameQuestions.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs">
                  STRIKES:
                  <span className="ml-2 text-red-400">
                    {Array(maxStrikes)
                      .fill("X")
                      .map((x, i) => (
                        <span key={i} className={i < strikes ? "text-red-600" : "text-gray-600"}>
                          {x}
                        </span>
                      ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-red-700 border-4 border-yellow-400 p-4 mb-6 rounded text-center">
              <p className="text-lg font-bold text-white">{currentQuestion?.question}</p>
            </div>

            {/* Answer Boxes */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {currentQuestion?.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`
                    p-3 border-2 rounded text-center text-xs font-bold
                    ${revealedAnswers.has(index) ? "bg-yellow-500 border-yellow-600 text-black" : "bg-gray-700 border-white text-white"}
                  `}
                >
                  {revealedAnswers.has(index) ? answer : "?"}
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
                placeholder="Type your answer..."
                className="bg-black text-white border-2 border-yellow-400 text-center py-2 placeholder-gray-500"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 border-2 border-white font-bold"
                >
                  SUBMIT
                </Button>
                <Button
                  onClick={skipQuestion}
                  className="flex-1 bg-gray-600 text-white hover:bg-gray-500 border-2 border-white text-xs"
                >
                  SKIP
                </Button>
              </div>
            </div>

            {/* Back button */}
            <div className="mt-auto pt-4">
              <button
                onClick={navigateToGames}
                className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>BACK</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GAME_STATES.GAME_OVER && (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="text-red-400 text-3xl mb-6 animate-pulse">GAME OVER</div>
            <div className="text-xl mb-2 text-yellow-300">FINAL SCORE:</div>
            <div className="text-4xl mb-8 text-yellow-400 font-bold">${score}</div>

            <div className="text-sm text-gray-400 mb-8 text-center max-w-md">
              {strikes >= maxStrikes ? (
                <p>You got {maxStrikes} strikes and were eliminated!</p>
              ) : (
                <p>You completed all {gameQuestions.length} questions!</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-500 border-2 border-white text-xs font-bold"
              >
                PLAY AGAIN
              </Button>
              <Button onClick={navigateToGames} className="bg-blue-600 hover:bg-blue-700 border-2 border-white text-xs">
                MAIN MENU
              </Button>
            </div>
          </div>
        )}

        {/* CRT Effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
            backgroundSize: "100% 4px",
            zIndex: 2,
          }}
        ></div>
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%)",
            zIndex: 3,
          }}
        ></div>
        <div className="absolute inset-0 pointer-events-none static-noise opacity-5"></div>
      </div>

      {/* Developer credits */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10"></div>
    </div>
  )
}
