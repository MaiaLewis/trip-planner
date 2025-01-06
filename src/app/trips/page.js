'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getTrips } from '@/utils/sheets'
import AddTripModal from './add-trip-form'
import Link from 'next/link'
import UserAvatar from '@/app/components/user-avatar'

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
          console.log('Fetched trips:', fetchedTrips)
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
    return <div className="text-gray-500">Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/')
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="p-8 bg-[#000E40] h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl text-white font-bold">Trip Planner</h1>
      </div>
      
      {isLoading ? (
        <div>Loading trips...</div>
      ) : trips.length > 0 ? (
        <ul className="mb-8 space-y-4">
          {trips.map((trip) => {
            console.log('Trip data:', trip)
            return (
              <li key={trip.id}>
                <Link 
                  href={`/trips/${encodeURIComponent(trip.name)}?id=${trip.id}`}
                  className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow "
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{trip.name}</span>
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-2">
                        {/* Show owner first */}
                        {trip.owner && (
                          <div className="relative" title={`Owner: ${trip.owner.name}`}>
                            <UserAvatar name={trip.owner.name} size={30} />
                          </div>
                        )}
                        {/* Show shared users */}
                        {trip.sharedWith?.map((user) => (
                          <div
                            key={user.email}
                            className="relative"
                            title={user.name}
                          >
                            <UserAvatar name={user.name}  size={30}/>
                          </div>
                        ))}
                      </div>
                      {/* Show count if there are more users */}
                      {trip.sharedWith && trip.sharedWith.length > 3 && (
                        <span className="text-sm text-gray-500">
                          +{trip.sharedWith.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-gray-600 mb-8">No trips yet. Create your first trip!</p>
      )}

      <AddTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshTrips}
      />
      <div className="flex justify-end">
        <button
            onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-18 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 z-50 flex items-center gap-2"
        >
           <i className="fa-solid fa-plus text-lg"></i>
          Trip
        </button>
      </div>
    </div>
  )
}

