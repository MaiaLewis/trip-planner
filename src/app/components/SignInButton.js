'use client'

import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session && session.user) {
    return (
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    );
  }

  return (
    <button onClick={() => signIn("google")}>
      Sign In with Google
    </button>
  );
}

