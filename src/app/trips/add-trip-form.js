'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { addTrip } from '@/utils/sheets'
import Modal from '@/app/components/simple-modal'

export default function AddTripModal({ isOpen, onClose, onSuccess }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tripName, setTripName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      await addTrip(session.accessToken, {
        name: tripName,
        createdBy: session.user.email,
      })
      
      // Reset form
      setTripName('')
      
      // Show success message
      setMessage('Trip created successfully!')
      
      // Refresh the trips list
      await onSuccess()
      
      // Close the modal
      onClose()
    } catch (error) {
      console.error('Error adding trip:', error)
      setMessage('Failed to create trip. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Add New Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className={`p-4 rounded ${message.includes('Failed') ? 'bg-red-100' : 'bg-green-100'}`}>
            {message}
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Trip Name
          </label>
          <input
            id="name"
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter trip name"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !tripName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Trip'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

