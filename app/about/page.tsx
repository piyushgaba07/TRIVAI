"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LogIn, User, Lock, Mail, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleLogo } from "@/components/ui/google-logo"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { beginGoogleOAuth } from "@/lib/oauthClient"
import { useGoogleAuthComplete } from "@/hooks/use-google-auth-complete"

export default function LandingPage() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState("login")
  const [expandedSection, setExpandedSection] = useState<string | null>("jeopardy")

  // Mock authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")

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

      // Close dialog and transition to main page
      setShowAuthDialog(false)
      navigateWithTransition("/", "ARCADE TRIVIA")
    }, 1500)
  }

  const navigateWithTransition = (path: string, title: string) => {
    setIsTransitioning(true)

    // Store the title for transition
    localStorage.setItem("gameTitle", title)

    // Navigate after transition starts
    setTimeout(() => {
      router.push(path)
    }, 1000)
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const handleGoogleAuth = (mode: "login" | "signup") => {
    if (typeof window === "undefined") return

    setAuthError("")
    setIsGoogleAuthenticating(true)

    try {
      beginGoogleOAuth(mode, window.location.pathname)
    } catch (error) {
      console.error("Google auth error:", error)
      setAuthError("Google authentication is not configured")
      setIsGoogleAuthenticating(false)
    }
  }

  const handleGoogleOAuthSuccess = useCallback(
    ({ userName, redirectPath }: { userName: string; redirectPath: string | null }) => {
      setIsGoogleAuthenticating(false)
      setShowAuthDialog(false)
      setUsername(userName)
      navigateWithTransition(redirectPath || "/", "ARCADE TRIVIA")
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
            <div className="text-4xl text-yellow-400 animate-pulse">ARCADE TRIVIA</div>
          </div>
        </div>
      )}

      {/* Arcade Cabinet */}
      <div className="relative w-full max-w-6xl h-[95vh] flex flex-col items-center">
        {/* Marquee/Header */}
        <div className="w-full max-w-4xl h-[15vh] bg-gray-800 rounded-t-3xl border-8 border-b-0 border-gray-700 relative overflow-hidden arcade-glow">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl text-center text-yellow-400 font-bold tracking-wide">ARCADE TRIVIA</h1>
          </div>
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-green-500 via-green-300 to-green-500 opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-900"></div>

          {/* Info button */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button
              onClick={() => navigateWithTransition("/", "ARCADE TRIVIA")}
              className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Screen Area */}
        <div className="w-full max-w-4xl h-[55vh] bg-gray-800 border-x-8 border-gray-700 relative overflow-hidden">
          {/* Screen Bezel */}
          <div className="absolute inset-2 bg-black rounded-lg border-4 border-gray-900 overflow-hidden">
            {/* Actual Screen Content */}
            <div className="relative h-full w-full overflow-hidden scanlines">
              <div className="h-full flex flex-col p-4 overflow-y-auto">
                <div className="text-center mb-4">
                  <h2 className="text-xl md:text-2xl text-green-400 mb-2">WELCOME TO ARCADE TRIVIA</h2>
                  <p className="text-blue-300 text-sm">The ultimate retro-style trivia gaming experience</p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Jeopardy Section */}
                  <div className="bg-blue-900/30 border-2 border-blue-700 rounded-lg p-3">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection("jeopardy")}
                    >
                      <h3 className="text-lg text-blue-400 font-bold">JEOPARDY</h3>
                      {expandedSection === "jeopardy" ? (
                        <ChevronUp className="h-4 w-4 text-blue-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-400" />
                      )}
                    </div>

                    {expandedSection === "jeopardy" && (
                      <div className="mt-2 text-sm space-y-2 animate-accordion-down">
                        <p>Test your knowledge across various categories with our Jeopardy-style trivia game.</p>
                        <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                          <li>Choose from multiple themed question sets</li>
                          <li>Answer questions of increasing difficulty and value</li>
                          <li>Challenge yourself with Daily Doubles</li>
                          <li>Track your score and compete with friends</li>
                        </ul>
                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/jeopardy", "JEOPARDY!")}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 h-8"
                          >
                            PLAY JEOPARDY
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feud Section */}
                  <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-3">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection("feud")}
                    >
                      <h3 className="text-lg text-red-400 font-bold">FEUD</h3>
                      {expandedSection === "feud" ? (
                        <ChevronUp className="h-4 w-4 text-red-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>

                    {expandedSection === "feud" && (
                      <div className="mt-2 text-sm space-y-2 animate-accordion-down">
                        <p>
                          Can you guess the most popular answers? Our Feud game tests your ability to think like the
                          crowd.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                          <li>Survey-based questions with multiple possible answers</li>
                          <li>Points based on the popularity of each answer</li>
                          <li>Family-friendly categories for all ages</li>
                          <li>Perfect for group play and parties</li>
                        </ul>
                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/feud", "FEUD!")}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs py-1 h-8"
                          >
                            PLAY FEUD
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connections Section */}
                  <div className="bg-purple-900/30 border-2 border-purple-700 rounded-lg p-3">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection("connect")}
                    >
                      <h3 className="text-lg text-purple-400 font-bold">CONNECTIONS</h3>
                      {expandedSection === "connect" ? (
                        <ChevronUp className="h-4 w-4 text-purple-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-purple-400" />
                      )}
                    </div>

                    {expandedSection === "connect" && (
                      <div className="mt-2 text-sm space-y-2 animate-accordion-down">
                        <p>
                          Find the hidden connections between seemingly unrelated clues in this brain-teasing puzzle
                          game.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                          <li>Discover what connects four seemingly unrelated items</li>
                          <li>Progressive difficulty levels to challenge your mind</li>
                          <li>Cryptic visual clues and hieroglyphics</li>
                          <li>Test your lateral thinking abilities</li>
                        </ul>
                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/connect", "CONNECTIONS")}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 h-8"
                          >
                            PLAY CONNECTIONS
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coming Soon Section */}
                  <div className="bg-gray-800/50 border-2 border-gray-600 rounded-lg p-3">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSection("coming-soon")}
                    >
                      <h3 className="text-lg text-yellow-400 font-bold">COMING SOON</h3>
                      {expandedSection === "coming-soon" ? (
                        <ChevronUp className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>

                    {expandedSection === "coming-soon" && (
                      <div className="mt-2 text-sm space-y-2 animate-accordion-down">
                        <p>We're constantly developing new games and features for Arcade Trivia!</p>
                        <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                          <li>Multiplayer modes for all games</li>
                          <li>Custom question set creator</li>
                          <li>Weekly tournaments with leaderboards</li>
                          <li>More trivia games coming soon</li>
                        </ul>
                        <div className="pt-2 text-xs text-gray-400">Stay tuned for updates!</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto text-center">
                  <Button
                    onClick={() => setShowAuthDialog(true)}
                    className="bg-green-600 hover:bg-green-500 text-white border-2 border-white"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    LOGIN / SIGNUP
                  </Button>
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

        {/* Control Panel */}
        <div className="w-full max-w-4xl h-[25vh] bg-gray-800 rounded-b-3xl border-8 border-t-0 border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-900 rounded-b-xl"></div>

          {/* Arcade cabinet decoration */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-xs text-gray-400">ARCADE TRIVIA SYSTEM</div>
            <div className="mt-4 text-xs text-gray-500">© {new Date().getFullYear()} ARCADE TRIVIA</div>
          </div>

          {/* Coin Slot */}
          <div className="absolute top-4 right-4 flex flex-col items-center">
            <div className="w-12 h-3 bg-gray-700 border border-gray-600 rounded"></div>
            <div className="mt-1 text-xs text-gray-400">INSERT COIN</div>
          </div>
        </div>

        {/* Side Decorations */}
        <div className="absolute -left-4 top-[15vh] h-[55vh] w-4 bg-gradient-to-b from-green-600 via-green-500 to-green-600 rounded-l-lg"></div>
        <div className="absolute -right-4 top-[15vh] h-[55vh] w-4 bg-gradient-to-b from-green-600 via-green-500 to-green-600 rounded-r-lg"></div>
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
    </div>
  )
}
