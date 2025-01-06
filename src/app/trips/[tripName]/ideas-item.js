'use client'

import UserAvatar from '@/app/components/user-avatar'
import { useState } from 'react'

export default function IdeasItem({ 
  item, 
  onSave, 
  onVote, 
  session 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: item.label,
    description: item.details,
    url: item.link,
    imageUrl: item.image
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    if (formData.title) {
      const updatedItem = {
        ...item,
        label: formData.title,
        details: formData.description,
        link: formData.url,
        image: formData.imageUrl
      }
      onSave(updatedItem)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="mb-4 p-4 border border-[#000E40] rounded-lg">
        <div className="space-y-4">
          <div className="relative">
            <i className="fa-solid fa-heading absolute left-0 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              name="title"
              placeholder="Item headline"
              value={formData.title || ''}
              onChange={handleInputChange}
              className="text-md w-full py-1 pl-8 border-b focus:outline-none focus:border-[#000E40]"
            />
          </div>
          
          <div className="relative">
            <i className="fa-solid fa-align-left absolute left-0 top-2 text-gray-400"></i>
            <textarea
              name="description"
              placeholder="Add description (optional)"
              value={formData.description || ''}
              onChange={handleInputChange}
              className="text-md w-full py-1 pl-8 border-b focus:outline-none focus:border-[#000E40]"
              rows={3}
            />
          </div>
          
          <div className="relative">
            <i className="fa-solid fa-link absolute left-0 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              name="url"
              placeholder="Add url (optional)" 
              value={formData.url || ''}
              onChange={handleInputChange}
              className="text-md w-full py-1 pl-8 border-b focus:outline-none focus:border-[#000E40]"
            />
          </div>
          
          <div className="relative">
            <i className="fa-solid fa-image absolute left-0 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              name="imageUrl"
              placeholder="Add image url (optional)"
              value={formData.imageUrl || ''}
              onChange={handleInputChange}
              className="text-md w-full py-1 pl-8 border-b focus:outline-none focus:border-[#000E40]"
            />
          </div>
          
          <div className="flex justify-end gap-6">
            <button onClick={() => setIsEditing(false)}>
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
            <button
              className="flex items-center gap-2 disabled:opacity-50"
              onClick={handleSave}
              disabled={!formData.title}
            >
              <i className="fa-solid fa-check text-md"></i>
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 p-4 border rounded-lg group relative">
      <button
        onClick={() => setIsEditing(true)}
        className="w-10 h-10 absolute top-2 right-2 p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-sm"
      >
        <i className="fa-solid fa-pen text-sm"></i>
      </button>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-md font-semibold leading-snug hover:underline line-clamp-2">{item.label}</a>
            ) : (
              <h2 className="text-md font-semibold leading-snug line-clamp-2">{item.label}</h2>
            )}
          </div>
          <p className="text-gray-600 mt-1 text-sm leading-snug line-clamp-3">{item.details}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => onVote()}
              className="flex items-center gap-2 group"
              title={item.voters?.length > 0 ? `Voters: ${item.voters.join(', ')}` : 'No votes yet'}
            >
              <i className={`fa-solid fa-thumbs-up text-sm ${
                item.voters?.includes(session?.user?.name)
                  ? 'text-blue-[#000E40]'
                  : 'text-gray-400'
              }`}></i>
              <span className="text-sm text-gray-600 group-hover:text-[#000E40] transition-colors">
                {item.voters?.length || 0}
              </span>
            </button>
            <div className="flex -space-x-2">
              {item.voters?.map((voter, i) => (
                <div key={i} className="relative" title={voter}>
                  <UserAvatar name={voter} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {item.image && (
          <div className="w-24 h-24 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.label}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )
} 