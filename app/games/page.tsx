"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Info, LogIn, Mail, User, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GoogleLogo } from "@/components/ui/google-logo"
import { beginGoogleOAuth } from "@/lib/oauthClient"
import { useGoogleAuthComplete } from "@/hooks/use-google-auth-complete"

export default function GamesPage() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState("login")
  const [targetPath, setTargetPath] = useState("")

  // Mock authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")

  // Check if user is logged in on page load
  useEffect(() => {
    const loggedInUser = localStorage.getItem("arcadeTrivia_user")
    if (loggedInUser) {
      setIsLoggedIn(true)
    }

    // Check if we're coming from another page with a transition
    const gameTitle = localStorage.getItem("gameTitle")

    if (gameTitle) {
      setIsTransitioning(true)

      // After a short delay, remove the transition effect
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        localStorage.removeItem("gameTitle")
      }, 2500)

      return () => clearTimeout(timer)
    } else {
      setIsTransitioning(false)
    }
  }, [])

  const handleAuth = (type: "login" | "signup") => {
    setAuthError("")
    setIsAuthenticating(true)

    // Simulate authentication process
    setTimeout(() => {
      setIsAuthenticating(false)

      // Simple validation
      if (!email || !password || (type === "signup" && !username)) {
        setAuthError("Please fill in all fields")
        return
      }

      // Mock successful login/signup
      const userToSave = type === "login" ? email.split("@")[0] : username
      localStorage.setItem("arcadeTrivia_user", userToSave)
      setIsLoggedIn(true)

      // Close dialog
      setShowAuthDialog(false)

      // Navigate to target path if it exists
      if (targetPath) {
        navigateWithTransition(targetPath, getGameTitle(targetPath))
        setTargetPath("")
      }
    }, 1500)
  }

  const handleGoogleAuth = (mode: "login" | "signup") => {
    if (typeof window === "undefined") return

    setAuthError("")
    setIsGoogleAuthenticating(true)

    try {
      beginGoogleOAuth(mode, targetPath || window.location.pathname)
    } catch (error) {
      console.error("Google auth error:", error)
      setAuthError("Google authentication is not configured")
      setIsGoogleAuthenticating(false)
    }
  }

  const getGameTitle = (path: string) => {
    if (path.includes("jeopardy")) return "JEOPARDY!"
    if (path.includes("feud")) return "FEUD!"
    if (path.includes("connect")) return "CONNECTIONS"
    return "TRIVAI"
  }

  const navigateWithTransition = (path: string, title: string) => {
    // If not logged in, show auth dialog and save target path
    if (!isLoggedIn && !path.includes("/home")) {
      setTargetPath(path)
      setShowAuthDialog(true)
      return
    }

    setIsTransitioning(true)

    // Store the game title in localStorage to be used for transition
    localStorage.setItem("gameTitle", title)

    // Navigate after transition starts
    setTimeout(() => {
      router.push(path)
    }, 1000)
  }

  const handleGoogleOAuthSuccess = useCallback(
    ({ userName, redirectPath }: { userName: string; redirectPath: string | null }) => {
      setIsGoogleAuthenticating(false)
      setIsLoggedIn(true)
      setUsername(userName)
      setShowAuthDialog(false)
      setTargetPath("")

      if (
        redirectPath &&
        typeof window !== "undefined" &&
        redirectPath !== window.location.pathname
      ) {
        navigateWithTransition(redirectPath, getGameTitle(redirectPath))
      }
    },
    [navigateWithTransition]
  )

  const handleGoogleOAuthError = useCallback((message: string) => {
    setIsGoogleAuthenticating(false)
    setAuthError(message || "Google authentication failed")
  }, [])

  useGoogleAuthComplete({
    onSuccess: handleGoogleOAuthSuccess,
    onError: handleGoogleOAuthError,
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white font-pixel flex items-center justify-center p-4">
      {/* Transition effect */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black z-50 animate-fade-out pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-yellow-400 animate-pulse">TRIVAI GAMES</div>
          </div>
        </div>
      )}

      {/* Arcade Cabinet */}
      <div className="relative w-full max-w-6xl h-[95vh] flex flex-col items-center">
        {/* Marquee/Header */}
        <div className="w-full max-w-4xl h-[15vh] bg-gray-800 rounded-t-3xl border-8 border-b-0 border-gray-700 relative overflow-hidden arcade-glow">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl text-center text-yellow-400 font-bold tracking-wide animate-pulse">
              TRIVAI
            </h1>
          </div>
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-900"></div>

          {/* Info button */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button
              onClick={() => navigateWithTransition("/home", "ABOUT TRIVAI")}
              className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <Info className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Screen Area */}
        <div className="w-full max-w-4xl h-[55vh] bg-gray-800 border-x-8 border-gray-700 relative overflow-hidden">
          {/* Screen Bezel */}
          <div className="absolute inset-2 bg-black rounded-lg border-4 border-gray-900 overflow-hidden">
            {/* Actual Screen Content */}
            <div className="relative h-full w-full overflow-hidden scanlines crt-on">
              <div className="h-full flex flex-col p-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl text-green-400 mb-4">SELECT YOUR GAME</h2>
                  <p className="text-blue-300">Test your knowledge with these classic trivia games!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <GameCard
                    title="JEOPARDY"
                    description="Answer questions across categories for points"
                    color="bg-blue-600"
                    onClick={() => navigateWithTransition("/games/jeopardy", "JEOPARDY!")}
                  />
                  <GameCard
                    title="FEUD"
                    description="Guess the most popular answers"
                    color="bg-red-600"
                    onClick={() => navigateWithTransition("/games/feud", "FEUD!")}
                  />
                  <GameCard
                    title="CONNECTIONS"
                    description="Find the connections between clues"
                    color="bg-purple-600"
                    onClick={() => navigateWithTransition("/games/connect", "CONNECTIONS")}
                  />
                </div>

                <div className="mt-auto text-center text-sm text-gray-500">
                  <p>© {new Date().getFullYear()} TRIVAI • PRESS START TO PLAY</p>
                </div>
              </div>

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
          </div>
        </div>

        {/* Control Panel - Simplified, removed start button */}
        <div className="w-full max-w-4xl h-[25vh] bg-gray-800 rounded-b-3xl border-8 border-t-0 border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-900 rounded-b-xl"></div>

          {/* Arcade cabinet decoration */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-xs text-gray-400 mb-4">TRIVAI SYSTEM</div>

            {!isLoggedIn && (
              <Button
                onClick={() => setShowAuthDialog(true)}
                className="bg-green-600 hover:bg-green-500 text-white border-2 border-white mx-auto mb-4"
              >
                <LogIn className="h-4 w-4 mr-2" />
                LOGIN TO PLAY
              </Button>
            )}

            <div className="text-xs text-gray-500">SELECT A GAME ABOVE TO PLAY</div>
          </div>

          {/* Coin Slot */}
          <div className="absolute top-4 right-4 flex flex-col items-center">
            <div className="w-12 h-3 bg-gray-700 border border-gray-600 rounded"></div>
            <div className="mt-1 text-xs text-gray-400">INSERT COIN</div>
          </div>
        </div>

        {/* Side Decorations */}
        <div className="absolute -left-4 top-[15vh] h-[55vh] w-4 bg-gradient-to-b from-blue-600 via-purple-600 to-red-600 rounded-l-lg"></div>
        <div className="absolute -right-4 top-[15vh] h-[55vh] w-4 bg-gradient-to-b from-blue-600 via-purple-600 to-red-600 rounded-r-lg"></div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-gray-800 border-4 border-gray-600 text-white font-pixel p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-yellow-400 text-xl">PLAYER ACCOUNT</DialogTitle>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={setAuthTab} className="mt-4">
            <TabsList className="grid grid-cols-2 bg-gray-900">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-700">
                LOGIN
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-green-700">
                SIGNUP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-blue-300">
                  EMAIL
                </Label>
                <div className="flex">
                  <div className="bg-gray-700 p-2 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-blue-500"
                    placeholder="player@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-blue-300">
                  PASSWORD
                </Label>
                <div className="flex">
                  <div className="bg-gray-700 p-2 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && <div className="text-red-500 text-xs text-center animate-pulse">{authError}</div>}

              <Button
                onClick={() => handleAuth("login")}
                disabled={isAuthenticating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isAuthenticating ? "LOGGING IN..." : "LOGIN"}
              </Button>

              <Button
                type="button"
                onClick={() => handleGoogleAuth("login")}
                disabled={isGoogleAuthenticating}
                className="w-full bg-gray-900 text-white hover:bg-black text-xs font-bold border border-gray-600 flex items-center justify-center gap-2"
              >
                <GoogleLogo className="h-4 w-4" />
                {isGoogleAuthenticating ? "CONNECTING TO GOOGLE..." : "LOGIN WITH GOOGLE"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-xs text-green-300">
                  USERNAME
                </Label>
                <div className="flex">
                  <div className="bg-gray-700 p-2 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-green-500"
                    placeholder="ArcadeChampion"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-xs text-green-300">
                  EMAIL
                </Label>
                <div className="flex">
                  <div className="bg-gray-700 p-2 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-green-500"
                    placeholder="player@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-xs text-green-300">
                  PASSWORD
                </Label>
                <div className="flex">
                  <div className="bg-gray-700 p-2 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-900 border-gray-700 focus:border-green-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && <div className="text-red-500 text-xs text-center animate-pulse">{authError}</div>}

              <Button
                onClick={() => handleAuth("signup")}
                disabled={isAuthenticating}
                className="w-full bg-green-600 hover:bg-green-500 text-white"
              >
                {isAuthenticating ? "SIGNING UP..." : "CREATE ACCOUNT"}
              </Button>

              <Button
                type="button"
                onClick={() => handleGoogleAuth("signup")}
                disabled={isGoogleAuthenticating}
                className="w-full bg-gray-900 text-white hover:bg-black text-xs font-bold border border-gray-600 flex items-center justify-center gap-2"
              >
                <GoogleLogo className="h-4 w-4" />
                {isGoogleAuthenticating ? "CONNECTING TO GOOGLE..." : "SIGNUP WITH GOOGLE"}
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 text-center text-xs text-gray-400">
            <p>High scores and game progress will be saved to your account</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Developer credits */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10"></div>
    </div>
  )
}

interface GameCardProps {
  title: string
  description: string
  color: string
  onClick: () => void
}

function GameCard({ title, description, color, onClick }: GameCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${color} hover:brightness-110 transition-all duration-200 p-4 rounded-lg border-4 border-white flex flex-col items-center text-center group relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-xs mb-2">{description}</p>
      <div className="mt-auto flex items-center justify-center">
        <span className="text-xs mr-1">PLAY NOW</span>
        <ArrowRight className="h-3 w-3 animate-pulse" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rotate-12 transform group-hover:rotate-0 transition-transform"></div>
    </button>
  )
}
