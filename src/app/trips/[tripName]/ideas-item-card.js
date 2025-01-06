'use client'

import { useState, useEffect } from 'react'
import { getUrlMetadata } from '@/utils/metadata'
import UserAvatar from '@/app/components/user-avatar'
import UserTopBar from '@/app/components/user-top-bar'
import { useSession } from 'next-auth/react'
import IdeasItem from './ideas-item'

export default function IdeasItemCard({ 
  question = '', 
  options = [], 
  creator = '',
  onSave,
  onVote,
  isNew = false 
}) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(isNew)
  const [topic, setTopic] = useState(question)
  const [items, setItems] = useState(() => 
    options.filter(opt => opt.label || opt.details || opt.image)
  )
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({})
  const [showAllFields, setShowAllFields] = useState(false)

  // Only update items when options change AND it's not a new card
  useEffect(() => {
    if (!isNew && options.length > 0) {
      setItems(options.filter(opt => opt.label || opt.details || opt.image))
    }
  }, [options, isNew])

  // Reset state when isNew changes
  useEffect(() => {
    if (isNew) {
      setTopic('')
      setItems([])
      setFormData({})
      setShowAllFields(false)
      setIsEditing(true)
    }
  }, [isNew])

  const handleInputChange = async (e) => {
    const { name, value } = e.target
    
    if (name === 'title' && value.startsWith('http')) {
      const metadata = await getUrlMetadata(value)
      if (metadata) {
        setFormData({
          title: metadata.title,
          description: metadata.description,
          url: metadata.url,
          imageUrl: metadata.image
        })
        setShowAllFields(true)
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      if (name === 'title' && value && !value.startsWith('http')) {
        setShowAllFields(true)
      }
    }
  }

  const handleSave = () => {
    if (formData.title) {
      const newItem = { 
        id: Date.now().toString(), 
        label: formData.title,
        details: formData.description,
        link: formData.url,
        image: formData.imageUrl,
        voters: []
      }
      
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      setFormData({});
      setIsAdding(false);
      setShowAllFields(false);

      // Call parent save handler with updated data
      if (onSave) {
        onSave({
          question: topic,
          options: updatedItems,
          creator
        })
      }
    }
  }

  const handleTopicSave = () => {
    if (topic.trim()) {
      setIsEditing(false)
      if (onSave) {
        console.log('Saving topic:', { question: topic, options: items, creator });
        onSave({
          question: topic,
          options: items,
          creator
        })
      }
    }
  }

  const handleVote = async (index) => {
    if (!session?.user?.name) return;
    
    if (onVote) {
      // Optimistically update the UI
      const updatedItems = items.map((item, i) => {
        if (i === index) {
          const currentVoters = item.voters || [];
          const hasVoted = currentVoters.includes(session.user.name);
          
          return {
            ...item,
            voters: hasVoted
              ? currentVoters.filter(v => v !== session.user.name)
              : [...currentVoters, session.user.name]
          };
        }
        return item;
      });
      
      setItems(updatedItems);
      
      // Call the parent's vote handler
      await onVote(index);
    }
  }

  const handleItemSave = (updatedItem, index) => {
    const updatedItems = items.map((item, i) => 
      i === index ? updatedItem : item
    )
    setItems(updatedItems)
    
    // Call parent save handler with updated data
    if (onSave) {
      onSave({
        question: topic,
        options: updatedItems,
        creator
      })
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg bg-white shadow-lg overflow-hidden">
        <UserTopBar name={creator} />
        <div className="p-4">
      
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Topic or question"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="text-md mb-4 w-full py-1 border-b focus:outline-none focus:border-[#000E40]"
          />
          <button
            onClick={handleTopicSave}
            className="p-2"
            disabled={!topic.trim()}
          >
            <i className="fa-solid fa-check text-md"></i>
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-4 group">
          <h2 className="text-lg font-bold">{topic}</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <i className="fa-solid fa-pen text-sm"></i>
          </button>
        </div>
      )}
      
      {items.map((item, index) => (
        <IdeasItem
          key={item.id || `item-${index}`}
          item={item}
          onSave={updatedItem => handleItemSave(updatedItem, index)}
          onVote={() => handleVote(index)}
          session={session}
        />
      ))}

      {isAdding ? (
        <div className="p-4 border border-[#000E40] rounded-lg">
          <div className="space-y-4">
            <div className="relative">
              <i className="fa-solid fa-plus absolute left-0 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                name="title"
                placeholder="Add item headline or paste url"
                value={formData.title || ''}
                onChange={handleInputChange}
                className="text-md w-full py-1 pl-8 border-b focus:outline-none focus:border-[#000E40]"
              />
            </div>
            
            {showAllFields && (
              <>
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
              </>
            )}
            
            <div className="flex justify-end gap-6">
              <button
                onClick={() => {
                  setIsAdding(false)
                  setFormData({})
                  setShowAllFields(false)
                }}
              >
                <i className="fa-solid fa-trash text-sm"></i>
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
      ) : (
        <button
          className="flex items-center gap-2 "
          onClick={() => setIsAdding(true)}
        >
          <i className="fa-solid fa-plus text-lg"></i>
          Item
        </button>
      )}
    </div>
    </div>
  )
}
