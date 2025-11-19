"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CONNECTIONS_QUESTIONS, GAME_STATES, generateConnectionsQuestions, ConnectionsQuestion } from "@/app/data/connections-data"
import { ArrowLeft } from 'lucide-react'

interface SelectedItem {
  index: number
  groupIndex: number
}

export default function ConnectGame() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [gameQuestions, setGameQuestions] = useState(CONNECTIONS_QUESTIONS)
  const [customTheme, setCustomTheme] = useState("")
  const [showSetup, setShowSetup] = useState(true)

  // Check if user is logged in on page load
  useEffect(() => {
    const loggedInUser = localStorage.getItem("arcadeTrivia_user")
    if (loggedInUser) {
      setIsLoggedIn(true)
    } else {
      router.push("/games")
    }

    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  // Game state
  const [gameState, setGameState] = useState(GAME_STATES.SETUP)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gameplay state
  const [allItems, setAllItems] = useState<string[]>([])
  const [itemGroupMapping, setItemGroupMapping] = useState<number[]>([]) // added mapping to track which group each shuffled item belongs to
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [solvedGroups, setSolvedGroups] = useState<Set<number>>(new Set())
  const [revealedGroups, setRevealedGroups] = useState<Set<number>>(new Set())
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])
  const [remainingItemIndices, setRemainingItemIndices] = useState<number[]>([])

  const maxMistakes = 4
  const currentQuestion = gameQuestions[currentQuestionIndex]

  // Initialize items on question change
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      initializeQuestion()
    }
  }, [currentQuestionIndex, gameState])

  const initializeQuestion = () => {
    if (!currentQuestion?.groups) return

    const itemsWithGroups: Array<{ item: string; groupIndex: number }> = []
    
    currentQuestion.groups.forEach((group, groupIndex) => {
      group.items.forEach((item) => {
        itemsWithGroups.push({ item, groupIndex })
      })
    })

    const shuffled = [...itemsWithGroups].sort(() => Math.random() - 0.5)
    
    const itemStrings = shuffled.map((i) => i.item)
    const groupIndices = shuffled.map((i) => i.groupIndex)
    
    setAllItems(itemStrings)
    setItemGroupMapping(groupIndices)
    setRemainingItemIndices(Array.from({ length: itemStrings.length }, (_, i) => i))
    setSelectedItems([])
    setSolvedGroups(new Set())
    setRevealedGroups(new Set())
  }

  const handleCustomTheme = async () => {
    if (!customTheme.trim()) return

    try {
      const generatedQuestions = await generateConnectionsQuestions(customTheme, 5)
      if (generatedQuestions.length > 0) {
        setGameQuestions(generatedQuestions)
        setShowSetup(false)
        startGame()
      }
    } catch (err) {
      setError("Failed to generate questions. Using default questions.")
    }
  }

  const startGame = () => {
    setGameState(GAME_STATES.LOADING)
    setTimeout(() => {
      setCurrentQuestionIndex(0)
      setScore(0)
      setMistakes(0)
      setSolvedGroups(new Set())
      setRevealedGroups(new Set())
      setGameState(GAME_STATES.PLAYING)
    }, 2000)
  }

  const toggleItemSelection = (index: number) => {
    if (selectedItems.some((item) => item.index === index)) {
      setSelectedItems(selectedItems.filter((item) => item.index !== index))
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, { index, groupIndex: 0 }])
    }
  }

  const handleSubmitGroup = () => {
    if (selectedItems.length !== 4) return

    const selectedGroupIndices = selectedItems.map((item) => itemGroupMapping[item.index])

    const firstGroup = selectedGroupIndices[0]
    const allSameGroup = selectedGroupIndices.every((g) => g === firstGroup)

    if (allSameGroup && !solvedGroups.has(firstGroup)) {
      const newSolved = new Set(solvedGroups)
      newSolved.add(firstGroup)
      setSolvedGroups(newSolved)
      
      // Remove the solved item indices from remaining items
      const solvedIndices = selectedItems.map((item) => item.index)
      const newRemaining = remainingItemIndices.filter((idx) => !solvedIndices.includes(idx))
      setRemainingItemIndices(newRemaining)
      
      setScore((prev) => prev + (4 - Math.floor(solvedGroups.size / 4)) * 25)
      setSelectedItems([])

      if (newSolved.size === 4) {
        moveToNextQuestion()
      }
    } else {
      const newMistakes = mistakes + 1
      setMistakes(newMistakes)
      setSelectedItems([])

      if (newMistakes >= maxMistakes) {
        endGame()
      }
    }
  }

  const handleDeselectAll = () => {
    setSelectedItems([])
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      endGame()
    }
  }

  const endGame = () => {
    setGameOver(true)
    setGameState(GAME_STATES.GAME_OVER)
  }

  const resetGame = () => {
    setGameState(GAME_STATES.SETUP)
    setGameQuestions(CONNECTIONS_QUESTIONS)
    setCustomTheme("")
    setShowSetup(true)
    setGameOver(false)
    setError(null)
    setRemainingItemIndices([])
  }

  const navigateToGames = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/games")
    }, 1000)
  }

  if (error && gameState === GAME_STATES.SETUP) {
    return (
      <div className="min-h-screen bg-black text-white font-pixel flex items-center justify-center p-4">
        <div className="bg-yellow-900 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl mb-4">ERROR</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={resetGame} className="bg-yellow-700 hover:bg-yellow-600">
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
            <div className="text-4xl text-yellow-400 animate-pulse">CONNECTIONS</div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl h-[85vh] bg-black rounded-lg overflow-hidden scanlines">
        {/* Setup Screen */}
        {gameState === GAME_STATES.SETUP && (
          <div className="h-full flex flex-col p-4 overflow-auto">
            <h2 className="text-xl md:text-2xl text-center text-yellow-400 font-bold mb-8">CONNECTIONS</h2>

            <div className="max-w-md mx-auto w-full space-y-8 flex flex-col items-center">
              <div className="text-center space-y-4">
                <p className="text-lg text-yellow-300">Find the connection!</p>
                <p className="text-sm text-gray-300">Groups of 4 items share a common theme.</p>
                <p className="text-sm text-gray-300">Make 4 mistakes and it's game over!</p>
              </div>

              <div className="space-y-4 text-sm text-gray-400">
                <div className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-bold text-yellow-300">HOW TO PLAY:</p>
                  <p>• Select 4 items you think are connected</p>
                  <p>• Submit when ready</p>
                  <p>• Correct groups are revealed</p>
                  <p>• 4 mistakes = Game Over</p>
                </div>
              </div>

              <div className="w-full space-y-3 border-t border-gray-600 pt-4">
                <Label htmlFor="customTheme" className="text-yellow-400 text-xs text-center block">
                  OR ENTER A CUSTOM THEME
                </Label>
                <Input
                  id="customTheme"
                  placeholder="e.g., movies, nature, sports"
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
                    setGameQuestions(CONNECTIONS_QUESTIONS)
                    setShowSetup(false)
                    startGame()
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-white px-4 py-1 h-8 text-xs font-bold"
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
            <div className="text-yellow-400 text-xl animate-pulse mb-4">LOADING GAME</div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState === GAME_STATES.PLAYING && (
          <div className="h-full flex flex-col p-4 overflow-auto">
            {/* Header */}
            <div className="mb-4 flex justify-between items-center">
              <div className="bg-yellow-700 border-2 border-white px-3 py-1 rounded text-xs">
                <span>SCORE: </span>
                <span className="text-yellow-300">{score}</span>
              </div>
              <div className="text-yellow-400 text-sm font-bold">
                Q{currentQuestionIndex + 1}/{gameQuestions.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs">
                  MISTAKES:
                  <span className="ml-2 text-yellow-400">
                    {Array(maxMistakes)
                      .fill("X")
                      .map((x, i) => (
                        <span key={i} className={i < mistakes ? "text-yellow-600" : "text-gray-600"}>
                          {x}
                        </span>
                      ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Solved Groups Display */}
            {solvedGroups.size > 0 && (
              <div className="space-y-2 mb-4">
                {Array.from(solvedGroups)
                  .sort((a, b) => a - b)
                  .map((groupIdx) => {
                    const bgColors = ["bg-yellow-600", "bg-green-600", "bg-blue-600", "bg-purple-600"]
                    return (
                      <div
                        key={groupIdx}
                        className={`${bgColors[groupIdx]} w-full p-3 rounded border-2 border-white text-center`}
                      >
                        <p className="font-bold text-sm">{currentQuestion?.groups[groupIdx].category}</p>
                        <p className="text-xs mt-1">{currentQuestion?.groups[groupIdx].items.join(" • ")}</p>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4 flex-1">
              {remainingItemIndices.map((itemIndex) => {
                const item = allItems[itemIndex]
                const isSelected = selectedItems.some((s) => s.index === itemIndex)
                return (
                  <button
                    key={itemIndex}
                    onClick={() => toggleItemSelection(itemIndex)}
                    className={`
                      p-2 rounded border-2 text-center text-xs font-bold transition-all
                      ${isSelected ? "bg-white text-black border-yellow-300" : "bg-gray-700 border-white text-white"}
                      hover:brightness-110
                    `}
                  >
                    {item}
                  </button>
                )
              })}
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleDeselectAll}
                  className="w-full bg-blue-600 text-white hover:bg-blue-500 border-2 border-white text-xs"
                  disabled={selectedItems.length === 0}
                >
                  DESELECT
                </Button>
              </div>
              <Button
                onClick={handleSubmitGroup}
                disabled={selectedItems.length !== 4}
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 border-2 border-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SUBMIT {selectedItems.length}/4
              </Button>
            </div>

            {/* Back button */}
            <div className="mt-4">
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
            <div className="text-yellow-400 text-3xl mb-6 animate-pulse">GAME OVER</div>
            <div className="text-xl mb-2 text-yellow-300">FINAL SCORE:</div>
            <div className="text-4xl mb-8 text-yellow-500 font-bold">{score}</div>

            <div className="text-sm text-gray-400 mb-8 text-center max-w-md">
              {mistakes >= maxMistakes ? (
                <p>You made {maxMistakes} mistakes and were eliminated!</p>
              ) : (
                <p>You completed all {gameQuestions.length} questions!</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={resetGame}
                className="bg-yellow-600 hover:bg-yellow-500 border-2 border-white text-xs font-bold"
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
      </div>

      {/* Developer credits */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10"></div>
    </div>
  )
}
