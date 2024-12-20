import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { getOrCreateTripSheet } from '@/utils/sheets'
import AddTripForm from './add-trip-form'

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/')
  }

  let sheetId
  try {
    console.log('session:', session)
    console.log('session.accessToken:', session.accessToken)
    sheetId = await getOrCreateTripSheet(session.accessToken)
  } catch (error) {
    console.error('Error setting up sheet:', error)
    return <div>Error setting up trips sheet. Please try again.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Trips</h1>
      <AddTripForm sheetId={sheetId} />
    </div>
  )
}

