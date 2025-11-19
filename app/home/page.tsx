"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { login, register } from "@/lib/api";
// Make sure we have the ArrowLeft icon imported
import { LogIn, User, Lock, Mail, Gamepad2, LogOut, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleLogo } from "@/components/ui/google-logo"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { beginGoogleOAuth } from "@/lib/oauthClient"
import { useGoogleAuthComplete } from "@/hooks/use-google-auth-complete"

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState("login")
  const [activeTab, setActiveTab] = useState("jeopardy")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [targetPath, setTargetPath] = useState("")

  // Mock authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")

  // Check if user is logged in on page load
  useEffect(() => {
    const loggedInUser = localStorage.getItem("arcadeTrivia_user")
    if (loggedInUser) {
      setIsLoggedIn(true)
      setUsername(loggedInUser)
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

const handleAuth = async (type: "login" | "signup") => {
  setAuthError("");
  setIsAuthenticating(true);

  try {
    if (type === "login") {
      const { access_token } = await login(email, password);
      localStorage.setItem("arcadeTrivia_token", access_token);
      localStorage.setItem("arcadeTrivia_user", email.split("@")[0]);
      setIsLoggedIn(true);
      setUsername(email.split("@")[0]);
    } else {
      const { access_token } = await register(signupUsername, email, password);
      localStorage.setItem("arcadeTrivia_token", access_token);
      localStorage.setItem("arcadeTrivia_user", signupUsername);
      setIsLoggedIn(true);
      setUsername(signupUsername);
    }

    setShowAuthDialog(false);
    toast({
      title: type === "login" ? "Login Successful" : "Account Created",
      description: `Welcome${type === "login" ? " back" : ""}, ${type === "login" ? email.split("@")[0] : signupUsername}!`,
      variant: "default",
    });

    if (targetPath) {
      navigateWithTransition(targetPath, getGameTitle(targetPath));
      setTargetPath("");
    }
  } catch (error) {
    console.error("Auth error:", error);
    
    // For login errors, redirect to /home page
    if (type === "login" && error.message) {
      router.push("/home");
      setAuthError(""); // Clear the error since we're redirecting
    } else {
      // For signup errors or other cases, show the error message
      setAuthError(error.message || "Authentication failed. Please try again.");
    }
  } finally {
    setIsAuthenticating(false);
  }
};
  
  const handleLogout = () => {
  localStorage.removeItem("arcadeTrivia_token");
  localStorage.removeItem("arcadeTrivia_user");
  setIsLoggedIn(false);
  setUsername("");

  toast({
    title: "Logged Out",
    description: "You have been logged out successfully.",
    variant: "default",
  });
};

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
    if (path.includes("connect")) return "ONLY CONNECT!"
    return "TRIVAI"
  }

  const navigateWithTransition = (path: string, title: string) => {
    // If not logged in, show auth dialog and save target path
    if (!isLoggedIn && path.includes("/games/")) {
      setTargetPath(path)
      setShowAuthDialog(true)
      return
    }

    setIsTransitioning(true)

    // Store the title for transition
    localStorage.setItem("gameTitle", title)

    // Navigate after transition starts
    setTimeout(() => {
      router.push(path)
    }, 1000)
  }

  // Then, add a function to navigate back to the start page
  const navigateToStart = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/")
    }, 1000)
  }

  const handleGoogleOAuthSuccess = useCallback(
    ({ userName, redirectPath }: { userName: string; redirectPath: string | null }) => {
      setIsGoogleAuthenticating(false)
      setIsLoggedIn(true)
      setUsername(userName)
      setShowAuthDialog(false)
      setTargetPath("")
      toast({
        title: "Login Successful",
        description: `Welcome, ${userName}!`,
        variant: "default",
      })

      if (
        redirectPath &&
        typeof window !== "undefined" &&
        redirectPath !== window.location.pathname
      ) {
        navigateWithTransition(redirectPath, getGameTitle(redirectPath))
      }
    },
    [navigateWithTransition, toast]
  )

  const handleGoogleOAuthError = useCallback(
    (message: string) => {
      setIsGoogleAuthenticating(false)
      const errorMessage = message || "Google authentication failed"
      setAuthError(errorMessage)
      toast({
        title: "Google Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      })
    },
    [toast]
  )

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
            <div className="text-4xl text-yellow-400 animate-pulse">TRIVAI</div>
          </div>
        </div>
      )}

      {/* Arcade Cabinet */}
      <div className="relative w-full max-w-6xl h-[95vh] flex flex-col items-center">
        {/* Marquee/Header */}
        <div className="w-full max-w-4xl h-[15vh] bg-gray-800 rounded-t-3xl border-8 border-b-0 border-gray-700 relative overflow-hidden arcade-glow">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl text-center text-yellow-400 font-bold tracking-wide">TRIVAI</h1>
          </div>
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-green-500 via-green-300 to-green-500 opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-900"></div>

          {/* User info / Play Games button / Back button */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center gap-2">
            {isLoggedIn && (
              <div className="bg-gray-700 px-3 py-1 rounded-full text-xs flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[80px]">{username}</span>
              </div>
            )}
            <button
              onClick={() => navigateWithTransition("/games", "TRIVAI GAMES")}
              className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <Gamepad2 className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={navigateToStart}
              className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              title="Back to Start"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Screen Area */}
        <div className="w-full max-w-4xl h-[55vh] bg-gray-800 border-x-8 border-gray-700 relative overflow-hidden">
          {/* Screen Bezel */}
          <div className="absolute inset-2 bg-black rounded-lg border-4 border-gray-900 overflow-hidden">
            {/* Actual Screen Content */}
            <div className="relative h-full w-full overflow-hidden scanlines">
              <div className="h-full flex flex-col p-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl md:text-2xl text-green-400 mb-2">WELCOME TO TRIVAI</h2>
                  <p className="text-blue-300 text-sm">The ultimate retro-style trivia gaming experience</p>
                </div>

                {/* Game Tabs */}
                <div className="w-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full bg-gray-800 p-1 gap-1">
                      <TabsTrigger value="jeopardy" className="bg-blue-900/50 data-[state=active]:bg-blue-700 text-xs">
                        JEOPARDY
                      </TabsTrigger>
                      <TabsTrigger value="feud" className="bg-red-900/50 data-[state=active]:bg-red-700 text-xs">
                        FEUD
                      </TabsTrigger>
                      <TabsTrigger
                        value="connect"
                        className="bg-purple-900/50 data-[state=active]:bg-purple-700 text-xs"
                      >
                        CONNECTIONS
                      </TabsTrigger>
                      <TabsTrigger
                        value="coming-soon"
                        className="bg-gray-700/50 data-[state=active]:bg-yellow-700 text-xs"
                      >
                        COMING SOON
                      </TabsTrigger>
                    </TabsList>

                    {/* Jeopardy Content */}
                    <TabsContent value="jeopardy" className="mt-4 overflow-y-auto max-h-[35vh] p-2">
                      <div className="bg-blue-900/30 border-2 border-blue-700 rounded-lg p-4 space-y-3">
                        <h3 className="text-lg text-blue-400 font-bold">JEOPARDY</h3>
                        <p className="text-sm">
                          Test your knowledge across various categories with our Jeopardy-style trivia game.
                        </p>

                        <div className="space-y-3">
                          <h4 className="text-sm text-blue-300 font-bold">HOW TO PLAY:</h4>
                          <p className="text-xs">
                            Select a category and point value from the game board. The higher the points, the more
                            difficult the question. Answer in the form of a question ("What is..." or "Who is...") for
                            maximum authenticity!
                          </p>

                          <h4 className="text-sm text-blue-300 font-bold">FEATURES:</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                            <li>Multiple themed question sets including General Knowledge, Movies, and Video Games</li>
                            <li>Classic game board with categories and increasing point values</li>
                            <li>Daily Doubles that let you wager points on your knowledge</li>
                            <li>Score tracking to compete with friends or beat your personal best</li>
                            <li>Authentic game show experience with pixel-perfect styling</li>
                            <li>Adjustable difficulty settings for players of all skill levels</li>
                          </ul>

                          <h4 className="text-sm text-blue-300 font-bold">STRATEGY TIPS:</h4>
                          <p className="text-xs">
                            Start with lower-value questions to build your score before tackling the harder ones. Be
                            strategic with Daily Doubles - if you're confident in a category, make a big wager!
                          </p>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/jeopardy", "JEOPARDY!")}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 h-8"
                          >
                            PLAY JEOPARDY
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Feud Content */}
                    <TabsContent value="feud" className="mt-4 overflow-y-auto max-h-[35vh] p-2">
                      <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-4 space-y-3">
                        <h3 className="text-lg text-red-400 font-bold">FEUD</h3>
                        <p className="text-sm">
                          Can you guess the most popular answers? Our Feud game tests your ability to think like the
                          crowd.
                        </p>

                        <div className="space-y-3">
                          <h4 className="text-sm text-red-300 font-bold">HOW TO PLAY:</h4>
                          <p className="text-xs">
                            Each round presents a survey question that was asked to 100 people. Your goal is to guess
                            the most popular answers. The more popular the answer, the more points you'll earn!
                          </p>

                          <h4 className="text-sm text-red-300 font-bold">FEATURES:</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                            <li>Survey-based questions with multiple possible answers ranked by popularity</li>
                            <li>Points awarded based on how many survey respondents gave each answer</li>
                            <li>Family-friendly categories suitable for players of all ages</li>
                            <li>Fast Money rounds where quick thinking is rewarded</li>
                            <li>Perfect for group play at parties or family gatherings</li>
                            <li>Competitive multiplayer mode to challenge friends (coming soon)</li>
                          </ul>

                          <h4 className="text-sm text-red-300 font-bold">STRATEGY TIPS:</h4>
                          <p className="text-xs">
                            Think about the most common or obvious answers first. Consider the demographics of survey
                            respondents when making your guesses. Sometimes the simplest answer is the most popular!
                          </p>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/feud", "FEUD!")}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs py-1 h-8"
                          >
                            PLAY FEUD
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Only Connect Content */}
                    <TabsContent value="connect" className="mt-4 overflow-y-auto max-h-[35vh] p-2">
                      <div className="bg-purple-900/30 border-2 border-purple-700 rounded-lg p-4 space-y-3">
                        <h3 className="text-lg text-purple-400 font-bold">CONNECTIONS</h3>
                        <p className="text-sm">
                          Find the hidden connections between seemingly unrelated clues in this brain-teasing puzzle
                          game.
                        </p>

                        <div className="space-y-3">
                          <h4 className="text-sm text-purple-300 font-bold">HOW TO PLAY:</h4>
                          <p className="text-xs">
                            You'll be presented with a set of four seemingly unrelated clues. Your task is to figure out
                            what connects them all. The connections can be based on wordplay, categories, sequences, or
                            other patterns.
                          </p>

                          <h4 className="text-sm text-purple-300 font-bold">FEATURES:</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                            <li>Challenging puzzles that test your lateral thinking abilities</li>
                            <li>Progressive difficulty levels from beginner to expert</li>
                            <li>Cryptic visual clues and hieroglyphics in advanced rounds</li>
                            <li>Sequence puzzles where you must identify the pattern and provide the next item</li>
                            <li>Missing vowels rounds where you decipher phrases with vowels removed</li>
                            <li>Timed challenges to test your quick thinking under pressure</li>
                          </ul>

                          <h4 className="text-sm text-purple-300 font-bold">STRATEGY TIPS:</h4>
                          <p className="text-xs">
                            Look for patterns in the clues - they might be related by category, wordplay, or sequences.
                            Don't overthink it - sometimes the connection is simpler than you expect. Work with others
                            to combine different perspectives!
                          </p>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={() => navigateWithTransition("/games/connect", "ONLY CONNECT!")}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 h-8"
                          >
                            PLAY CONNECTIONS
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Coming Soon Content */}
                    <TabsContent value="coming-soon" className="mt-4 overflow-y-auto max-h-[35vh] p-2">
                      <div className="bg-gray-800/50 border-2 border-gray-600 rounded-lg p-4 space-y-3">
                        <h3 className="text-lg text-yellow-400 font-bold">COMING SOON</h3>
                        <p className="text-sm">We're constantly developing new games and features for TRIVAI!</p>

                        <div className="space-y-3">
                          <h4 className="text-sm text-yellow-300 font-bold">UPCOMING GAMES:</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                            <li>
                              <span className="text-green-400 font-bold">WHEEL OF FORTUNE</span> - Solve word puzzles by
                              guessing letters and spinning the wheel
                            </li>
                            <li>
                              <span className="text-blue-400 font-bold">MILLIONAIRE</span> - Answer increasingly
                              difficult questions with lifelines to help
                            </li>
                            <li>
                              <span className="text-red-400 font-bold">COUNTDOWN</span> - Test your word and number
                              skills against the clock
                            </li>
                          </ul>

                          <h4 className="text-sm text-yellow-300 font-bold">NEW FEATURES:</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                            <li>Multiplayer modes for all games with real-time competition</li>
                            <li>Custom question set creator to build your own trivia challenges</li>
                            <li>Weekly tournaments with global leaderboards and prizes</li>
                            <li>Achievement system to track your progress across all games</li>
                            <li>Profile customization with avatars and badges</li>
                            <li>Mobile app version for gaming on the go</li>
                          </ul>

                          <h4 className="text-sm text-yellow-300 font-bold">RELEASE SCHEDULE:</h4>
                          <p className="text-xs">
                            We release new content and features every month. Follow our social media channels for
                            announcements and early access opportunities!
                          </p>
                        </div>

                        <div className="pt-2 text-xs text-gray-400 text-center">Stay tuned for updates!</div>
                      </div>
                    </TabsContent>
                  </Tabs>
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

          {/* Arcade cabinet decoration with login button */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
            <div className="text-xs text-gray-400 mb-4">TRIVAI SYSTEM</div>

            {isLoggedIn ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-green-400">LOGGED IN AS {username.toUpperCase()}</div>
                <Button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-500 text-white border-2 border-white mx-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  LOGOUT
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                className="bg-green-600 hover:bg-green-500 text-white border-2 border-white mx-auto"
              >
                <LogIn className="h-4 w-4 mr-2" />
                LOGIN / SIGNUP
              </Button>
            )}

            <div className="mt-4 text-xs text-gray-500">© {new Date().getFullYear()} TRIVAI</div>
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
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
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
