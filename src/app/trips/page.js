'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getTrips } from '@/utils/sheets'
import AddTripModal from './add-trip-form'
import Link from 'next/link'

export default function TripsPage() {
  const { data: session, status } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshTrips = async () => {
    if (session?.accessToken) {
      try {
        const fetchedTrips = await getTrips(session.accessToken)
        setTrips(fetchedTrips)
      } catch (err) {
        console.error('Error refreshing trips:', err)
        setError('Error refreshing trips. Please try again.')
      }
    }
  }

  useEffect(() => {
    if (session?.accessToken) {
      getTrips(session.accessToken)
        .then(fetchedTrips => {
          setTrips(fetchedTrips)
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Error getting trips:', err)
          setError('Error loading trips. Please try again.')
          setIsLoading(false)
        })
    }
  }, [session])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/')
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Trips</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <span className="mr-2">+</span> Trip
        </button>
      </div>
      
      {isLoading ? (
        <div>Loading trips...</div>
      ) : trips.length > 0 ? (
        <ul className="mb-8 space-y-2">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link 
                href={`/trips/${encodeURIComponent(trip.name)}?id=${trip.id}`}
                className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <span>{trip.name}</span>
                  <span className="text-sm text-gray-500">
                    {trip.isOwner ? 'Owner' : 'Shared'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 mb-8">No trips yet. Create your first trip!</p>
      )}

      <AddTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshTrips}
      />
    </div>
  )
}

