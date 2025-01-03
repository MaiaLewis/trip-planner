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
    <div>
      <div className="sticky top-0 z-50 bg-white border-b px-8 pt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-4">
            <Link href="/trips" className="text-gray-600 hover:text-gray-800">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </Link>
            <h1 className="text-md font-bold">{tripName}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                {tripDetails?.owner && (
                  <div className="relative" title={`Owner: ${tripDetails.owner.name}`}>
                    <UserAvatar name={tripDetails.owner.name} />
                  </div>
                )}
                {tripDetails?.sharedWith?.slice(0, 3).map((user) => (
                  <div
                    key={user.email}
                    className="relative"
                    title={user.name}
                  >
                    <UserAvatar name={user.name} />
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
              className="flex space-x-2 items-center px-2 py-1 justify-center text-blue-500 bg-blue-100 rounded-full hover:bg-blue-200"
              title="Share trip"
            >
              <i className="fa-solid fa-user-plus text-xs"></i><span className="text-xs">Add user</span>
            </button>
          </div>
        </div>
        <nav className="flex space-x-4 bg-white">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`
                px-4 py-2 text-sm
                ${activeTab === 'ideas'
                ? 'font-bold border-b-2 border-blue-500 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'}
                `}
          >
            Idea Board
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`
                px-4 py-2 text-sm
                ${activeTab === 'itinerary'
                ? 'font-bold border-b-2 border-blue-500 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'}
                `}
          >
            Itinerary
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="m-8">
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