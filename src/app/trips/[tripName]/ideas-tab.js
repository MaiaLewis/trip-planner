'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSurveyQuestions, updateVote, addNewQuestion } from '@/utils/sheets'
import UserAvatar from '@/app/components/user-avatar'
import IdeasItemCard from './ideas-item-card'

export default function IdeasTab({ spreadsheetId }) {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [showNewCard, setShowNewCard] = useState(false)

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

  const handleVote = async (questionIndex, optionIndex) => {
    if (!session?.accessToken || isVoting) return;
    
    setIsVoting(true);
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

  const handleSaveQuestion = async (questionData) => {
    if (!session?.accessToken) return;
    
    try {
      await addNewQuestion(session.accessToken, spreadsheetId, questionData);
      await fetchQuestions();
      setShowNewCard(false);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewCard(true)}
          className="fixed bottom-8 right-18 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 z-50 flex items-center gap-2"
        >
           <i className="fa-solid fa-plus text-lg"></i>
          Topic
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {showNewCard && (
          <div className="h-full">
            <IdeasItemCard 
              key="new-card"
              isNew={true}
              creator={session?.user?.name}
              onSave={handleSaveQuestion}
              options={[]}
            />
          </div>
        )}
        
        {questions.map((question, index) => (
          <IdeasItemCard
            key={index}
            question={question.question}
            options={question.options}
            creator={question.creator}
            onSave={(updatedQuestion) => handleSaveQuestion({ ...updatedQuestion, index })}
            onVote={async (optionIndex) => {
              await handleVote(index, optionIndex);
              await fetchQuestions();
            }}
          />
        ))}
      </div>
    </div>
  )
}