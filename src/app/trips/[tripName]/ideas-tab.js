'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import AddQuestionModal from './add-question-modal'
import { getSurveyQuestions, updateVote } from '@/utils/sheets'
import UserAvatar from '@/app/components/user-avatar'
import StickyNote from '@/app/components/sticky-note'

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
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Question
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((q, index) => (
          <StickyNote
            key={index}
            creator={q.creator || 'Anonymous'}
            className="h-full"
          >
            <div className="space-y-4">
              <div className="font-medium">{q.question}</div>
              <div className="space-y-2">
                {q.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleVote(index, optIndex)}
                    className={`w-full text-left p-2 rounded ${
                      option.voters.includes(session?.user?.name)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.label}</span>
                        <div className="flex -space-x-1">
                          {option.voters.map((voter, i) => (
                            <div key={i} className="relative" title={voter}>
                              <UserAvatar name={voter} />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {option.details && (
                        <p className="text-sm text-gray-600">{option.details}</p>
                      )}
                      
                      <div className="flex gap-2 text-sm">
                        {option.link && (
                          <a 
                            href={option.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Link
                          </a>
                        )}
                        {option.image && (
                          <a 
                            href={option.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Image
                          </a>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </StickyNote>
        ))}
      </div>

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