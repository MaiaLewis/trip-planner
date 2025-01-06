'use client'

import { useState, use, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import IdeasTab from './ideas-tab'
import PlanTab from './plan-tab'
import ShareTripModal from './share-trip-modal'
import Link from 'next/link'
import UserAvatar from '@/app/components/user-avatar'
import { getTrips } from '@/utils/sheets'

export default function TripPage({ params }) {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('ideas')
  const searchParams = useSearchParams()
  const spreadsheetId = searchParams.get('id')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [tripDetails, setTripDetails] = useState(null)

  useEffect(() => {
    if (session?.accessToken && spreadsheetId) {
      getTrips(session.accessToken)
        .then(trips => {
          const trip = trips.find(t => t.id === spreadsheetId)
          setTripDetails(trip)
        })
        .catch(err => console.error('Error fetching trip details:', err))
    }
  }, [session, spreadsheetId])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/')
  }

  const tripParams = use(params)
  const tripName = decodeURIComponent(tripParams.tripName)

  return (
    <div className="bg-[#000E40] h-full">
      <div className="sticky bg-[#000E40] top-0 z-50 px-8 pt-8 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/trips" className="text-white cursor-pointer hover:opacity-70">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </Link>
            <h1 className="text-2xl font-bold text-white">{tripName}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                {tripDetails?.owner && (
                  <div className="relative" title={`Owner: ${tripDetails.owner.name}`}>
                    <UserAvatar name={tripDetails.owner.name} size={30}/>
                  </div>
                )}
                {tripDetails?.sharedWith?.slice(0, 3).map((user) => (
                  <div
                    key={user.email}
                    className="relative"
                    title={user.name}
                  >
                    <UserAvatar name={user.name} size={30}/>
                  </div>
                ))}
              </div>
              {tripDetails?.sharedWith && tripDetails.sharedWith.length > 3 && (
                <span className="text-sm text-gray-500">
                  +{tripDetails.sharedWith.length - 3}
                </span>
              )}
            </div>
            
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="h-8 w-8 items-center justify-center text-blue-500 bg-blue-100 rounded-full hover:bg-blue-200"
              title="Share trip"
            >
              <i className="fa-solid fa-user-plus text-xs"></i><span className="text-xs"></span>
            </button>
          </div>
        </div>
        <nav className="flex space-x-4 text-white font-bold">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`
                px-4 py-2 text-sm
                ${activeTab === 'ideas'
                ? 'bg-white bg-opacity-20 rounded-full'
                : 'hover:opacity-70'}
                `}
          >
            Idea Board
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`
                px-4 py-2 text-sm
                ${activeTab === 'itinerary'
                ? 'bg-white bg-opacity-20 rounded-full'
                : 'hover:opacity-70'}
                `}
          >
            Itinerary
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mx-8 bg-white rounded-lg h-screen p-8">
        {activeTab === 'ideas' ? (
          <IdeasTab spreadsheetId={spreadsheetId} />
        ) : (
          <PlanTab />
        )}
      </div>

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        spreadsheetId={spreadsheetId}
        accessToken={session?.accessToken}
      />
    </div>
  )
} 