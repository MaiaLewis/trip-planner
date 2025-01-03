'use client'

import { useState } from 'react'
import Modal from '@/app/components/simple-modal'
import { addSurveyQuestion } from '@/utils/sheets'
import { useSession } from 'next-auth/react'

export default function AddQuestionModal({ isOpen, onClose, onSuccess, spreadsheetId, accessToken }) {
  const { data: session } = useSession()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([{ label: '', details: '', link: '', image: '' }])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddOption = () => {
    setOptions([...options, { label: '', details: '', link: '', image: '' }])
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await addSurveyQuestion(
        session.accessToken,
        spreadsheetId,
        question,
        options,
        session.user.name
      )
      setQuestion('')
      setOptions([{ label: '', details: '', link: '', image: '' }])
      onSuccess()
    } catch (error) {
      console.error('Error adding question:', error)
      setError('Failed to add question. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Add Survey Question</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Type your question here"
            required
          />
        </div>

        <div className="space-y-6">
          <label className="block text-sm font-medium text-gray-700">
            Options
          </label>
          {options.map((option, index) => (
            <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Option label"
                required
              />
              <textarea
                value={option.details}
                onChange={(e) => handleOptionChange(index, 'details', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Additional details (optional)"
                rows={2}
              />
              <input
                type="url"
                value={option.link}
                onChange={(e) => handleOptionChange(index, 'link', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Link URL (optional)"
              />
              <input
                type="url"
                value={option.image}
                onChange={(e) => handleOptionChange(index, 'image', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Image URL (optional)"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            + Add Option
          </button>
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
            disabled={isLoading || !question.trim() || options.some(opt => !opt.label.trim())}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </form>
    </Modal>
  )
} 