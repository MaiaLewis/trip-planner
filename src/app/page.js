
import { getServerSession } from "next-auth/next";
import SignInButton from "./components/SignInButton";

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">
          Trip Planner
        </h1>
        <SignInButton />
        {session && (
          <div className="mt-4">
            Signed in as {session.user?.email}
          </div>
        )}
      </main>
    </div>
  );
}

