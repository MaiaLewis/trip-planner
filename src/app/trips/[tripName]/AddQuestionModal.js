'use client'

import { useState } from 'react'
import Modal from '@/app/components/Modal'
import { addSurveyQuestion } from '@/utils/sheets'

export default function AddQuestionModal({ isOpen, onClose, onSuccess, spreadsheetId, accessToken }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await addSurveyQuestion(accessToken, spreadsheetId, question, options)
      setQuestion('')
      setOptions([''])
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
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Options
          </label>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="w-full p-2 border rounded"
              placeholder={`Option ${index + 1}`}
              required
            />
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
            disabled={isLoading || !question.trim() || options.some(opt => !opt.trim())}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </form>
    </Modal>
  )
} 