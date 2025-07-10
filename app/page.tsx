'use client';

import React, { useState, useEffect } from 'react';
import data from '../public/data.json';

interface Question {
  Question: string;
  Example: string;
  'Study Description': string;
  Methodology1: string;
  Methodology2: string;
  Results1: string;
  Results2: string;
  'Level of Explanation': string;
}

interface UserResponse {
  questionIndex: number;
  selectedAnswer: string;
  reasoning: string;
  isCorrect: boolean;
  question: Question;
}

interface Submission {
  _id: string;
  responses: UserResponse[];
  timestamp: string;
}

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [otherResponses, setOtherResponses] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const questions: Question[] = data;

  // Define the 4 selection options
  const selectionOptions = [
    {
      key: 'Correlational',
      title: 'Correlational',
      description: 'The study shows a statistical association between two variables but cannot establish causation or prediction.'
    },
    {
      key: 'Predictive',
      title: 'Predictive', 
      description: 'The study demonstrates that one variable can be used to forecast or predict levels of another variable.'
    },
    {
      key: 'Causal',
      title: 'Causal',
      description: 'The study establishes that changes in one variable directly cause changes to another variable.'
    },
    {
      key: 'Mechanistic',
      title: 'Mechanistic',
      description: 'The study demonstrates causation and characterizes the type of relationship between variables (linear, curvilinear, etc.).'
    }
  ];

  // Get shuffled options for current question (deterministic based on question index)
  const getShuffledOptions = (questionIndex: number) => {
    // Simple seeded random using question index
    const seed = questionIndex * 9301 + 49297; // Simple linear congruential generator
    const shuffled = [...selectionOptions];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const random = ((seed * (i + 1)) % 233280) / 233280; // Normalize to 0-1
      const j = Math.floor(random * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledOptions = getShuffledOptions(currentQuestionIndex);

  const handleNext = () => {
    if (selectedAnswer) {
      // Save current response
      const response: UserResponse = {
        questionIndex: currentQuestionIndex,
        selectedAnswer: selectedAnswer,
        reasoning: reasoning,
        isCorrect: isCorrectAnswer(selectedAnswer),
        question: questions[currentQuestionIndex]
      };
      
      setUserResponses(prev => [...prev, response]);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setReasoning('');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setReasoning('');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    // Delay scroll to allow DOM to update with reasoning box
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const isCorrectAnswer = (answer: string) => {
    return answer === currentQuestion['Level of Explanation'];
  };

  const handleReviewResponses = async () => {
    try {
      setLoading(true);
      
      // Save final response for last question if it exists
      if (selectedAnswer && currentQuestionIndex === questions.length - 1) {
        const finalResponse: UserResponse = {
          questionIndex: currentQuestionIndex,
          selectedAnswer: selectedAnswer,
          reasoning: reasoning,
          isCorrect: isCorrectAnswer(selectedAnswer),
          question: questions[currentQuestionIndex]
        };
        
        const allResponses = [...userResponses, finalResponse];
        
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'causalLevel',
            responses: allResponses
          }),
        });
        
        if (response.ok) {
          console.log('Responses saved successfully');
        } else {
          console.error('Failed to save responses');
        }
      }
      
      // Fetch last 15 responses
      const fetchResponse = await fetch('/api/submissions');
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setOtherResponses(data.submissions || []);
      }
      
      setShowReviewScreen(true);
      setLoading(false);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error saving responses:', error);
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    // Reset all state to initial values
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setReasoning('');
    setUserResponses([]);
    setShowReviewScreen(false);
    setOtherResponses([]);
    setActiveTab(0);
    setLoading(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBackgroundColor = (answer: string) => {
    if (selectedAnswer === answer) {
      return isCorrectAnswer(answer) ? '#e6ffe6' : '#ffe6e6';
    }
    return '#f9f9f9';
  };

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        No questions available.
      </div>
    );
  }

  if (showReviewScreen) {
    if (loading) {
      return (
        <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Loading responses...</h2>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Review Other Responses</h1>
          
          {/* Question Tabs */}
          <div style={{ display: 'flex', marginBottom: '20px', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {questions.map((_, index) => (
              <button
                key={index}
                className="button"
                onClick={() => setActiveTab(index)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === index ? '#6F00FF' : '#020202',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                STUDY {index + 1}
              </button>
            ))}
          </div>

          {/* Active Question Content */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>
              {questions[activeTab]?.Example}
            </h2>
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h3 style={{ marginBottom: '10px', color: '#666', fontSize: '16px' }}>Study Description:</h3>
              <p style={{ margin: '0', lineHeight: '1.5' }}>{questions[activeTab]?.['Study Description']}</p>
            </div>
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px', border: '1px solid #28a745' }}>
              <p style={{ margin: '0', lineHeight: '1.5', color: '#28a745' }}>
                <strong>Correct Answer: {questions[activeTab]?.['Level of Explanation']}</strong> - {selectionOptions.find(option => option.key === questions[activeTab]?.['Level of Explanation'])?.description}
              </p>
            </div>
          </div>

          {/* Other Responses */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>Other Reasonings for Study: {questions[activeTab]?.Example}</h3>
            <div style={{ 
              maxHeight: '264px', 
              overflowY: 'auto', 
              border: '1px solid #dee2e6', 
              borderRadius: '5px',
              padding: '10px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                {otherResponses.length > 0 ? (
                  otherResponses
                    .map((submission, submissionIndex) => {
                      const responseForCurrentQuestion = submission.responses?.find(r => r.questionIndex === activeTab);
                      if (!responseForCurrentQuestion) return null;
                      
                      return (
                        <div key={submissionIndex} style={{ 
                          padding: '15px', 
                          border: '1px solid #dee2e6', 
                          borderRadius: '5px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: '0', fontStyle: 'italic', color: '#666', lineHeight: '1.5' }}>
                            {responseForCurrentQuestion.reasoning}
                          </p>
                        </div>
                      );
                    })
                    .filter(Boolean)
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No other reasoning available for this study.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Start Over Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              className="button"
              onClick={handleStartOver}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              START OVER
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div style={{ padding: '20px', width: '80%', margin: '0 auto', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        {currentQuestion.Example}
      </h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Study Description</h2>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white' }}>
          <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>{currentQuestion['Study Description']}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Methodology</h2>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '10px', flexDirection: 'column', backgroundColor: 'white' }}>
          <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', flex: '1', width: '100%', textWrap: 'wrap' }}>{currentQuestion.Methodology1}</p>
          <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>{currentQuestion.Methodology2}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Results</h2>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '10px', flexDirection: 'column', backgroundColor: 'white' }}>
          <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', flex: '1', width: '100%', textWrap: 'wrap' }}>{currentQuestion.Results1}</p>
          <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>{currentQuestion.Results2}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '15px', flexDirection: 'column', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select the level of explanation that best describes this study:</h3>
          
          {shuffledOptions.map((option, index) => (
            <div 
              key={option.key}
              style={{ 
                display: 'flex', 
                border: '1px solid #ddd', 
                padding: '10px', 
                marginBottom: index === shuffledOptions.length - 1 ? '0' : '10px', 
                cursor: 'pointer',
                backgroundColor: getBackgroundColor(option.key),
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedAnswer !== option.key) {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAnswer !== option.key) {
                  e.currentTarget.style.backgroundColor = getBackgroundColor(option.key);
                }
              }}
              onClick={() => handleAnswerSelect(option.key)}
            >
              <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>
                <strong>{option.title}</strong> - {option.description}
              </p>
            </div>
          ))}

          {selectedAnswer && isCorrectAnswer(selectedAnswer) && (
            <div style={{ 
              display: 'flex', 
              border: '1px solid #ddd', 
              padding: '15px', 
              marginTop: '15px', 
              flexDirection: 'column', 
              backgroundColor: '#f9f9f9' 
            }}>
              <h4 style={{ margin: '0 0 10px 0', textAlign: 'left' }}>Explain your reasoning:</h4>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Please explain why you selected this answer (minimum 10 characters)..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        {currentQuestionIndex > 0 && (
          <button 
            className="button"
            onClick={handleBack}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            BACK
          </button>
        )}

        {currentQuestionIndex < questions.length - 1 ? (
          <button 
            className="button"
            onClick={handleNext}
            disabled={!selectedAnswer || !isCorrectAnswer(selectedAnswer) || reasoning.length < 10}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedAnswer && isCorrectAnswer(selectedAnswer) && reasoning.length >= 10 ? 'pointer' : 'not-allowed',
              opacity: selectedAnswer && isCorrectAnswer(selectedAnswer) && reasoning.length >= 10 ? 1 : 0.5
            }}
          >
            NEXT
          </button>
        ) : (
          <button 
            className="button"
            onClick={handleReviewResponses}
            disabled={!selectedAnswer || !isCorrectAnswer(selectedAnswer) || reasoning.length < 10}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedAnswer && isCorrectAnswer(selectedAnswer) && reasoning.length >= 10 ? 'pointer' : 'not-allowed',
              opacity: selectedAnswer && isCorrectAnswer(selectedAnswer) && reasoning.length >= 10 ? 1 : 0.5
            }}
          >
            REVIEW RESPONSES
          </button>
        )}
      </div>
    </div>
  );
}