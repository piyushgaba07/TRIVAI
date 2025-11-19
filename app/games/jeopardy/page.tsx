"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { THEMED_BOARDS, GAME_STATES } from "@/app/data/jeopardy-data"
import { ArrowLeft } from "lucide-react"

export default function JeopardyGame() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState("login")

  // Check if user is logged in on page load
  useEffect(() => {
    const loggedInUser = localStorage.getItem("arcadeTrivia_user")
    if (loggedInUser) {
      setIsLoggedIn(true)
    } else {
      // Redirect to games page if not logged in
      router.push("/games")
    }

    // Handle transition effect on page load
    setIsTransitioning(true)

    // After a short delay, remove the transition effect
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  // Game configuration
  const [gameState, setGameState] = useState(GAME_STATES.SETUP)
  const [customTheme, setCustomTheme] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("GENERAL")
  const [numCategories, setNumCategories] = useState(5)
  const [numQuestions, setNumQuestions] = useState(5)
  const [dailyDoubleCount, setDailyDoubleCount] = useState(3)

  // Game state
  const [categories, setCategories] = useState<string[]>([])
  const [questions, setQuestions] = useState<any>({})
  const [score, setScore] = useState(0)
  const [selectedQuestion, setSelectedQuestion] = useState<{
    category: string
    index: number
    question: string
    answer: string
    value: number
    dailyDouble: boolean
  } | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [wager, setWager] = useState<number>(0)
  const [showWager, setShowWager] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [answerResult, setAnswerResult] = useState<"correct" | "incorrect" | null>(null)

  // Generate questions for custom theme
  const generateCustomThemeQuestions = async (theme: string) => {
    try {
      console.log('Sending request to generate questions for theme:', theme);
      setError(null);
      setGameState(GAME_STATES.LOADING);
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const response = await fetch(`${apiBaseUrl}/api/v1/jeopardy/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          theme: theme,
          num_boards: 1
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.detail || data.message || 'Failed to generate questions');
      }

      console.log('Received data from API:', data);
      
      // Ensure we have the expected data structure
      if (!data.categories || !data.questions) {
        console.error('Unexpected data format:', data);
        throw new Error('Invalid data format received from server');
      }

      const formattedQuestions: Record<string, any[]> = {};
      
      // Process each category and its questions
      data.categories.forEach((category: string) => {
        if (data.questions[category]) {
          formattedQuestions[category] = data.questions[category].map((q: any) => ({
            question: q.question || q.clue || 'No question provided',
            answer: q.answer || q.response || 'No answer provided',
            value: q.value || 200,
            dailyDouble: q.dailyDouble || q.isDailyDouble || false,
            isRevealed: false,
            isAnswered: false,
            image: q.image || null
          }));
        }
      });

      // Sort questions by value within each category
      Object.values(formattedQuestions).forEach(questions => {
        questions.sort((a, b) => a.value - b.value);
      });

      return {
        categories: data.categories,
        questions: formattedQuestions
      };
    } catch (error) {
      console.error('Error in generateCustomThemeQuestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate questions');
      setGameState(GAME_STATES.SETUP);
      throw error;
    }
  };

  // Initialize game
  const initializeGame = async () => {
    try {
      setError(null);
      setGameState(GAME_STATES.LOADING);
      
      // Set fixed values for categories and questions
      setNumCategories(5);
      setNumQuestions(5);

      if (customTheme) {
        const customThemeData = await generateCustomThemeQuestions(customTheme);
        
        // Process the custom theme data
        const formattedQuestions: Record<string, any[]> = {};
        
        // Ensure we have valid questions for each category
        customThemeData.categories.forEach((category: string) => {
          if (customThemeData.questions[category]?.length > 0) {
            formattedQuestions[category] = customThemeData.questions[category].map((q: any) => ({
              ...q,
              // Ensure required fields are set
              question: q.question || 'No question provided',
              answer: q.answer || 'No answer provided',
              value: q.value || 200,
              isRevealed: false,
              isAnswered: false
            }));
          }
        });
        
        // Update state with the new questions
        setCategories(customThemeData.categories);
        setQuestions(formattedQuestions);
        setScore(0);
        setAnsweredQuestions(new Set());
        setSelectedQuestion(null);
        setShowAnswer(false);
        setGameOver(false);
        setGameState(GAME_STATES.PLAYING);
        return;
      }

      // Get the selected theme data for predefined themes
      const themeData = THEMED_BOARDS[selectedTheme as keyof typeof THEMED_BOARDS];
      if (!themeData) {
        throw new Error(`Theme data not found for ${selectedTheme}`);
      }

      // Limit categories based on fixed value
      const selectedCategories = themeData.categories.slice(0, 5);

      // Create a new questions object with limited questions per category
      const selectedQuestions: any = {};
      selectedCategories.forEach((category) => {
        if (!themeData.questions[category]) {
          throw new Error(`Questions not found for category ${category}`);
        }
        selectedQuestions[category] = themeData.questions[category].slice(0, 5);
      });

      // Reset daily doubles
      selectedCategories.forEach((category) => {
        selectedQuestions[category].forEach((q: any) => {
          q.dailyDouble = false
        })
      })

      // Randomly assign daily doubles
      let ddCount = 0
      while (ddCount < dailyDoubleCount) {
        const randomCategoryIndex = Math.floor(Math.random() * selectedCategories.length)
        const randomCategory = selectedCategories[randomCategoryIndex]
        const randomQuestionIndex = Math.floor(Math.random() * selectedQuestions[randomCategory].length)

        if (!selectedQuestions[randomCategory][randomQuestionIndex].dailyDouble) {
          selectedQuestions[randomCategory][randomQuestionIndex].dailyDouble = true
          ddCount++
        }
      }

      setCategories(selectedCategories)
      setQuestions(selectedQuestions)
      setScore(0)
      setAnsweredQuestions(new Set())
      setSelectedQuestion(null)
      setShowAnswer(false)
      setWager(0)
      setShowWager(false)
      setGameOver(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setGameState(GAME_STATES.SETUP)
    }
  }

  // Start game
  const startGame = async () => {
    setGameState(GAME_STATES.LOADING);
    try {
      await initializeGame();
      setGameState(GAME_STATES.PLAYING);
    } catch (error) {
      console.error('Error initializing game:', error);
      setError('Failed to start game. Please try again.');
      setGameState(GAME_STATES.SETUP);
    }
  }

  // Check if game is over
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING && categories.length > 0) {
      const totalQuestions = categories.length * numQuestions
      if (answeredQuestions.size === totalQuestions) {
        setGameOver(true)
        setGameState(GAME_STATES.GAME_OVER)
      }
    }
  }, [answeredQuestions, categories, gameState, numQuestions])

  const handleSelectQuestion = (category: string, index: number) => {
    if (gameState !== GAME_STATES.PLAYING) return

    try {
      const questionData = questions[category][index]
      if (!questionData) {
        throw new Error(`Question data not found for ${category} at index ${index}`)
      }

      const questionKey = `${category}-${index}`

      if (answeredQuestions.has(questionKey)) return

      setSelectedQuestion({
        category,
        index,
        question: questionData.question,
        answer: questionData.answer,
        value: questionData.value,
        dailyDouble: questionData.dailyDouble,
      })

      if (questionData.dailyDouble) {
        setShowWager(true)
      } else {
        setShowWager(false)
      }

      setUserAnswer("")
      setAnswerResult(null)
      setShowAnswer(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

  const handleCloseQuestion = () => {
    if (selectedQuestion) {
      const questionKey = `${selectedQuestion.category}-${selectedQuestion.index}`
      setAnsweredQuestions((prev) => new Set([...prev, questionKey]))
    }
    setSelectedQuestion(null)
    setShowAnswer(false)
    setUserAnswer("")
    setAnswerResult(null)
    setWager(0)
  }

  const handleCorrect = () => {
    const pointsToAdd = showWager ? wager : selectedQuestion?.value || 0
    setScore((prev) => prev + pointsToAdd)
    handleCloseQuestion()
  }

  const handleIncorrect = () => {
    const pointsToSubtract = showWager ? wager : selectedQuestion?.value || 0
    setScore((prev) => prev - pointsToSubtract)
    handleCloseQuestion()
  }

  const handleSubmitWager = () => {
    setShowWager(false)
  }

  const resetGame = () => {
    setGameState(GAME_STATES.SETUP)
    setError(null)
  }

  const checkAnswer = () => {
    if (!selectedQuestion || !userAnswer.trim()) return

    // Normalize answers for comparison (remove punctuation, lowercase, etc.)
    const normalizeAnswer = (answer: string) => {
      return answer
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    }

    const correctAnswer = normalizeAnswer(selectedQuestion.answer)
    const userSubmission = normalizeAnswer(userAnswer)

    // Check if user answer contains the key part of the correct answer
    // This is a simple check - could be improved with more sophisticated matching
    const isCorrect =
      correctAnswer.includes(userSubmission) ||
      userSubmission.includes(correctAnswer.replace(/what is |who is |where is /i, ""))

    setAnswerResult(isCorrect ? "correct" : "incorrect")
    setShowAnswer(true)

    // Update score after a short delay
    setTimeout(() => {
      if (isCorrect) {
        handleCorrect()
      } else {
        handleIncorrect()
      }
    }, 4000)
  }

  // Navigate to home with transition
  const navigateToHome = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/games")
    }, 1000)
  }

  // Display error message if there's an error
  if (error) {
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
            <div className="text-4xl text-jeopardy-gold animate-pulse">JEOPARDY!</div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl h-[85vh] bg-black rounded-lg overflow-hidden scanlines">
        {/* Setup Screen */}
        {gameState === GAME_STATES.SETUP && (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl md:text-2xl text-center text-jeopardy-gold font-bold mb-8">GAME SETUP</h2>

            <div className="max-w-md mx-auto w-full space-y-8 flex flex-col items-center">
              <div className="space-y-1 w-full">
                <Label htmlFor="theme" className="text-jeopardy-gold text-xs text-center block">
                  SELECT THEME
                </Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="bg-jeopardy-blue border-white h-8 text-xs">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-jeopardy-blue border-white">
                    <SelectItem value="GENERAL">GENERAL KNOWLEDGE</SelectItem>
                    <SelectItem value="MOVIES">MOVIES</SelectItem>
                    <SelectItem value="VIDEO GAMES">VIDEO GAMES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-full">
                <Label htmlFor="customTheme" className="text-jeopardy-gold text-xs text-center block">
                  OR ENTER CUSTOM THEME
                </Label>
                <Input
                  id="customTheme"
                  placeholder="e.g., SCIENCE FICTION"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="bg-black border-white text-white h-8 text-xs text-center"
                />
                <p className="text-[10px] text-gray-400 text-center">Custom themes use general knowledge questions</p>
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-jeopardy-gold text-xs text-center block">
                  DAILY DOUBLES: {dailyDoubleCount}
                </Label>
                <Slider
                  value={[dailyDoubleCount]}
                  min={1}
                  max={3}
                  step={1}
                  onValueChange={(value) => setDailyDoubleCount(value[0])}
                  className="py-2"
                />
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button
                  onClick={navigateToHome}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-white px-4 py-1 h-8 text-xs"
                >
                  BACK
                </Button>
                <Button
                  onClick={startGame}
                  className="bg-jeopardy-gold text-black hover:bg-yellow-400 border-2 border-white px-4 py-1 h-8 text-xs"
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
            <div className="text-jeopardy-gold text-xl animate-pulse mb-4">LOADING GAME</div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}

        {/* Game Board */}
        {gameState === GAME_STATES.PLAYING && (
          <div className="h-full flex flex-col p-2 overflow-auto">
            <div className="mb-2 flex justify-between items-center">
              <div className="bg-black border-2 border-white p-1 rounded text-xs">
                <span>SCORE: </span>
                <span className={`${score < 0 ? "text-red-500" : "text-green-400"}`}>${score}</span>
              </div>
              <h2 className="text-sm md:text-base text-jeopardy-gold font-bold">{customTheme || selectedTheme}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={navigateToHome}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>BACK</span>
                </button>
                <button
                  onClick={resetGame}
                  className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px]"
                >
                  RESET
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 mb-1">
              {categories.map((category) => (
                <div
                  key={category}
                  className="bg-jeopardy-blue border-2 border-black p-1 text-center text-jeopardy-gold text-[10px] font-bold"
                >
                  {category}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1 flex-1">
              {Array.from({ length: numQuestions }).map((_, rowIndex) => {
                const questionValue = (rowIndex + 1) * 200

                return categories.map((category, colIndex) => {
                  const questionKey = `${category}-${rowIndex}`
                  const isAnswered = answeredQuestions.has(questionKey)

                  return (
                    <button
                      key={`${category}-${rowIndex}`}
                      onClick={() => handleSelectQuestion(category, rowIndex)}
                      disabled={isAnswered}
                      className={`
                        p-1 text-center font-bold text-white
                        ${isAnswered ? "bg-gray-800 cursor-not-allowed" : "bg-jeopardy-blue hover:bg-blue-800 cursor-pointer"}
                        border-2 border-black transition-colors
                        flex items-center justify-center min-h-[40px]
                      `}
                    >
                      {isAnswered ? (
                        <span className="text-gray-600">--</span>
                      ) : (
                        <span className="text-jeopardy-gold text-sm">${questionValue}</span>
                      )}
                    </button>
                  )
                })
              })}
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GAME_STATES.GAME_OVER && (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="text-jeopardy-gold text-2xl mb-4 animate-pulse">GAME OVER</div>
            <div className="text-xl mb-2">FINAL SCORE:</div>
            <div className={`text-2xl mb-6 ${score < 0 ? "text-red-500" : "text-green-400"}`}>${score}</div>
            <div className="flex space-x-4">
              <Button
                onClick={resetGame}
                className="bg-jeopardy-gold text-black hover:bg-yellow-400 border-2 border-white text-xs"
              >
                PLAY AGAIN
              </Button>
              <Button onClick={navigateToHome} className="bg-blue-600 hover:bg-blue-700 border-2 border-white text-xs">
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

      {/* Question Dialog - Updated styling to match reference */}
      <Dialog open={selectedQuestion !== null} onOpenChange={(open) => !open && handleCloseQuestion()}>
        <DialogContent
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[80%] max-w-3xl bg-[#0000FF] border-4 border-white text-white font-pixel p-8 rounded-none"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-white text-xl">
              {selectedQuestion?.category} - ${selectedQuestion?.dailyDouble ? wager : selectedQuestion?.value}
            </DialogTitle>
          </DialogHeader>

          {showWager ? (
            <div className="py-4 text-center space-y-4">
              <p className="text-2xl animate-pulse">DAILY DOUBLE!</p>
              <div className="flex justify-center items-center space-x-2">
                <span className="text-white text-lg">$</span>
                <Input
                  type="number"
                  value={wager}
                  onChange={(e) =>
                    setWager(Math.max(5, Math.min(Math.max(score, 1000), Number.parseInt(e.target.value) || 0)))
                  }
                  className="bg-black text-white border-white w-24 text-center text-lg"
                  min={5}
                  max={Math.max(score, 1000)}
                />
              </div>
              <p className="text-xs text-gray-300">(Min: $5, Max: ${Math.max(score, 1000)})</p>
              <Button
                onClick={handleSubmitWager}
                className="bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-white mt-4"
              >
                CONFIRM WAGER
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-xl leading-relaxed whitespace-pre-wrap">{selectedQuestion?.question}</p>

              {!showAnswer ? (
                <div className="mt-6 space-y-4">
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your answer..."
                    className="bg-black text-white border-white text-center max-w-md mx-auto"
                  />
                  <Button
                    onClick={checkAnswer}
                    className="bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-white"
                    disabled={!userAnswer.trim()}
                  >
                    SUBMIT ANSWER
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-yellow-400 font-bold text-xl">{selectedQuestion?.answer}</p>
                  {answerResult && (
                    <div
                      className={`text-2xl font-bold ${answerResult === "correct" ? "text-green-400" : "text-red-500"}`}
                    >
                      {answerResult === "correct" ? "CORRECT!" : "INCORRECT!"}
                    </div>
                  )}
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleCorrect} className="bg-green-600 hover:bg-green-700 border-2 border-white">
                      OVERRIDE: CORRECT
                    </Button>
                    <Button onClick={handleIncorrect} className="bg-red-600 hover:bg-red-700 border-2 border-white">
                      OVERRIDE: INCORRECT
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <button onClick={handleCloseQuestion} className="absolute top-2 right-2 text-white hover:text-gray-300">
            ×
          </button>
        </DialogContent>
      </Dialog>

      {/* Developer credits */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10"></div>
    </div>
  )
}
