'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { addTrip } from '@/utils/sheets'

export default function AddTripForm({ sheetId }) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await addTrip(session.accessToken, sheetId, {
        ...formData,
        createdBy: session.user.email,
      })
      
      // Reset form
      setFormData({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
      })
    } catch (error) {
      console.error('Error adding trip:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <label htmlFor="name">Trip Name</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="startDate">Start Date</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="endDate">End Date</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Adding Trip...' : 'Add Trip'}
      </button>
    </form>
  )
}

