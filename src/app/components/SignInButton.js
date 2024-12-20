'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return <button disabled>Loading...</button>
  }

  if (session) {
    return (
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    )
  }

  return (
    <button onClick={() => signIn('google', { callbackUrl: '/trips' })}>
      Sign in with Google
    </button>
  )
}

