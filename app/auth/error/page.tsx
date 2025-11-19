'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error)
    }
  }, [error])

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Authentication Error
        </h1>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || 'An unknown error occurred during authentication.'}
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={() => router.push('/')}
          className="w-full max-w-xs"
        >
          Return to Home
        </Button>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center text-gray-700 dark:text-gray-200">
            Loading error details...
          </div>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
