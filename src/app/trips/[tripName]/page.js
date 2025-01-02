'use client'

import { useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import IdeasTab from './ideas-tab'
import PlanTab from './plan-tab'
import ShareTripModal from './share-trip-modal'

export default function TripPage({ params }) {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('ideas')
  const searchParams = useSearchParams()
  const spreadsheetId = searchParams.get('id')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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
          <h1 className="text-lg font-bold">{tripName}</h1>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-50"
            >
              Share
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
            Ideas
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`
                px-4 py-2 text-sm
                ${activeTab === 'plan'
                ? 'font-bold border-b-2 border-blue-500 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'}
                `}
          >
            Plan
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