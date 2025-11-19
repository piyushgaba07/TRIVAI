"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StartScreen() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const [insertCoin, setInsertCoin] = useState(false)

  // Handle transition effect
  const navigateToHome = () => {
    setIsButtonPressed(true)

    // Simulate coin insertion
    setTimeout(() => {
      setInsertCoin(true)

      // After coin insertion animation, start transition
      setTimeout(() => {
        // Navigate after transition starts
        router.push("/home")
      }, 1500)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-black text-white font-pixel flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Full-screen CRT effects */}
      <div className="absolute inset-0 pointer-events-none scanlines"></div>
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

      {/* Perpetual flicker animation */}
      <div className="absolute inset-0 bg-black opacity-0 animate-flicker pointer-events-none"></div>

      {/* Main content */}
      <div className="z-10 flex flex-col items-center justify-center gap-16">
        {/* Title with enhanced styling */}
        <div className="relative">
          <div className="text-7xl md:text-9xl text-center font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 animate-pulse">
            TRIVAI
          </div>
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
          <div
            className="absolute -bottom-12 -right-12 w-24 h-24 bg-red-500 rounded-full opacity-20 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-10 blur-xl"></div>
        </div>

        {/* Larger start button with better styling */}
        <button
          onClick={navigateToHome}
          disabled={isButtonPressed}
          className={`
            relative w-64 h-64 rounded-full 
            ${isButtonPressed ? "bg-red-800" : "bg-red-600 hover:bg-red-500"} 
            border-8 border-red-900 
            flex items-center justify-center 
            transform transition-all duration-100
            ${isButtonPressed ? "scale-95" : "hover:scale-105"}
            shadow-2xl glow-effect
          `}
        >
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-red-400 to-red-700 opacity-50"></div>
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-red-400"></div>
          <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3/4 h-3/4 rounded-full border-4 border-dashed border-red-300 opacity-20 animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
          </div>
          <span className="text-5xl font-bold text-white drop-shadow-lg relative z-10">START</span>
        </button>

        {/* Insert coin animation */}
        {insertCoin && <div className="text-2xl text-yellow-400 animate-bounce mt-8">INSERT COIN</div>}

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-blue-500 opacity-10 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-red-500 opacity-10 rounded-lg transform -rotate-12"></div>
      </div>

      {/* Developer credits */}
      <div className="absolute bottom-4 text-xs text-gray-500 z-10">
        © {new Date().getFullYear()} TRIVAI 
      </div>
    </div>
  )
}
