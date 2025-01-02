'use client'

import { useState } from 'react'
import Modal from '@/app/components/simple-modal'
import { addTripCollaborator } from '@/utils/sheets'

export default function ShareTripModal({ isOpen, onClose, spreadsheetId, accessToken }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await addTripCollaborator(accessToken, spreadsheetId, email)
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
    } catch (error) {
      console.error('Error sharing trip:', error)
      setError('Failed to share trip. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Share Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-green-500 bg-green-50 rounded">
            {success}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter email address"
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
            disabled={isLoading || !email.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </form>
    </Modal>
  )
} 