'use client'

import { useState } from 'react'
import { getUrlMetadata } from '@/utils/metadata'
export default function AddItemForm({ onSave }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    headline: '',
    description: '',
    url: '',
    imageUrl: ''
  })

  const handleInputChange = async (e) => {
    const value = e.target.value
    
    // If the input looks like a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        // Try to fetch metadata
        const metadata = await getUrlMetadata(value)
        setFormData({
          headline: metadata.title || '',
          description: metadata.description || '',
          url: value,
          imageUrl: metadata.image || ''
        })
        setIsExpanded(true)
      } catch (error) {
        console.error('Error fetching metadata:', error)
        setFormData({ ...formData, headline: value })
        setIsExpanded(true)
      }
    } else {
      // If it's not a URL, just update the headline
      setFormData({ ...formData, headline: value })
      if (value && !isExpanded) {
        setIsExpanded(true)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      headline: '',
      description: '',
      url: '',
      imageUrl: ''
    })
    setIsExpanded(false)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50"
      >
        + Item
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-sm">
      <div className="space-y-3">
        <input
          type="text"
          value={formData.headline}
          onChange={handleInputChange}
          placeholder="Add item headline or paste url"
          className="w-full p-2 border-b focus:outline-none focus:border-blue-500"
          autoFocus
        />

        {isExpanded && (
          <>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add description (optional)"
              className="w-full p-2 border-b focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
            />

            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Add url (optional)"
              className="w-full p-2 border-b focus:outline-none focus:border-blue-500"
            />

            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="Add image url (optional)"
              className="w-full p-2 border-b focus:outline-none focus:border-blue-500"
            />
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false)
              setIsExpanded(false)
              setFormData({
                headline: '',
                description: '',
                url: '',
                imageUrl: ''
              })
            }}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
          <button
            type="submit"
            className="p-2 text-blue-500 hover:text-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  )
} 