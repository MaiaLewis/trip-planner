'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import AddQuestionModal from './add-question-modal'
import { getSurveyQuestions, updateVote } from '@/utils/sheets'
import UserAvatar from '@/app/components/user-avatar'

export default function IdeasTab({ spreadsheetId }) {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState({})

  const fetchQuestions = async () => {
    if (session?.accessToken && spreadsheetId) {
      try {
        const fetchedQuestions = await getSurveyQuestions(session.accessToken, spreadsheetId)
        setQuestions(fetchedQuestions)
        setError(null)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Failed to load questions')
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [session, spreadsheetId])

  const handleQuestionAdded = () => {
    fetchQuestions()
    setIsModalOpen(false)
  }

  const handleVote = async (questionIndex, optionIndex) => {
    if (!session?.accessToken || isVoting) return;
    
    setIsVoting(true);
    setSelectedOptions(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));

    try {
      await updateVote(
        session.accessToken,
        spreadsheetId,
        questionIndex,
        optionIndex,
        session.user.name
      );
      await fetchQuestions();
    } catch (error) {
      console.error('Error voting:', error);
      setSelectedOptions(prev => ({
        ...prev,
        [questionIndex]: undefined
      }));
    } finally {
      setIsVoting(false);
    }
  };

  useEffect(() => {
    const newSelectedOptions = {};
    questions.forEach((question, qIndex) => {
      question.options.forEach((option, oIndex) => {
        if (option.voters.includes(session?.user?.name)) {
          newSelectedOptions[qIndex] = oIndex;
        }
      });
    });
    setSelectedOptions(newSelectedOptions);
  }, [questions, session?.user?.name]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Trip Survey</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <span className="mr-2">+</span> Question
        </button>
      </div>

      {isLoading ? (
        <div>Loading questions...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">{q.question}</h3>
              <div className="space-y-2 pl-4">
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        id={`option-${index}-${optIndex}`}
                        className="text-blue-500"
                        checked={selectedOptions[index] === optIndex}
                        onChange={() => handleVote(index, optIndex)}
                        disabled={isVoting}
                      />
                      <label htmlFor={`option-${index}-${optIndex}`}>
                        {option.text}
                      </label>
                    </div>
                    {option.voters.length > 0 && (
                      <div className="flex -space-x-1">
                        {option.voters.map((name, i) => (
                          <div key={i} className="relative" title={name}>
                            <UserAvatar name={name} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No questions yet. Add your first question!</p>
      )}

      <AddQuestionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleQuestionAdded}
        spreadsheetId={spreadsheetId}
        accessToken={session?.accessToken}
      />
    </div>
  )
} 