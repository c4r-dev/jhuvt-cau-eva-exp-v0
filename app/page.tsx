'use client';

import React, { useState, useEffect } from 'react';
import data from '../public/data.json';

interface ExperimentalMethod {
  'Experimental Methods': string;
  Correct: string;
  'correctness of methods selection': string;
  fix1: string;
  fix1correct: string;
  fix2: string;
  'fix2 correct': string;
  fix3: string;
  'fix3 correct': string;
  fix4: string;
  'fix4 correct': string;
}

interface Question {
  Example: string;
  'Study Description': string;
  'Independent Variable': string;
  'Dependent Variable': string;
  subElements: ExperimentalMethod[];
}

interface UserResponse {
  questionIndex: number;
  selectedMethodIndex: number;
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
  const [selectedMethodIndex, setSelectedMethodIndex] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [otherResponses, setOtherResponses] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const questions: Question[] = data;

  // Get shuffled experimental methods for current question (deterministic based on question index)
  const getShuffledMethods = (questionIndex: number) => {
    if (!questions[questionIndex]?.subElements) return [];
    
    // Simple seeded random using question index
    const seed = questionIndex * 9301 + 49297; // Simple linear congruential generator
    const shuffled = [...questions[questionIndex].subElements];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const random = ((seed * (i + 1)) % 233280) / 233280; // Normalize to 0-1
      const j = Math.floor(random * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledMethods = getShuffledMethods(currentQuestionIndex);

  const handleNext = () => {
    if (selectedMethodIndex !== null) {
      // Save current response
      const response: UserResponse = {
        questionIndex: currentQuestionIndex,
        selectedMethodIndex: selectedMethodIndex,
        reasoning: reasoning,
        isCorrect: isCorrectAnswer(selectedMethodIndex),
        question: questions[currentQuestionIndex]
      };
      
      setUserResponses(prev => [...prev, response]);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedMethodIndex(null);
      setReasoning('');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedMethodIndex(null);
      setReasoning('');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  const handleMethodSelect = (methodIndex: number) => {
    setSelectedMethodIndex(methodIndex);
    // Delay scroll to allow DOM to update with reasoning box
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const isCorrectAnswer = (methodIndex: number) => {
    if (!questions[currentQuestionIndex]?.subElements?.[methodIndex]) return false;
    return questions[currentQuestionIndex].subElements[methodIndex].Correct === 'Y';
  };

  const handleReviewResponses = async () => {
    try {
      setLoading(true);
      
      // Save final response for last question if it exists
      if (selectedMethodIndex !== null && currentQuestionIndex === questions.length - 1) {
        const finalResponse: UserResponse = {
          questionIndex: currentQuestionIndex,
          selectedMethodIndex: selectedMethodIndex,
          reasoning: reasoning,
          isCorrect: isCorrectAnswer(selectedMethodIndex),
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
    setSelectedMethodIndex(null);
    setReasoning('');
    setUserResponses([]);
    setShowReviewScreen(false);
    setOtherResponses([]);
    setActiveTab(0);
    setLoading(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBackgroundColor = (methodIndex: number) => {
    if (selectedMethodIndex === methodIndex) {
      return isCorrectAnswer(methodIndex) ? '#e6ffe6' : '#ffe6e6';
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
                <strong>Correct Experimental Methods:</strong>
              </p>
              {questions[activeTab]?.subElements?.filter(method => method.Correct === 'Y').map((method, index) => (
                <p key={index} style={{ margin: '5px 0', lineHeight: '1.5', color: '#28a745' }}>
                  • {method['Experimental Methods']}
                </p>
              ))}
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
          <div style={{ flex: '1', width: '100%' }}>
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', textWrap: 'wrap' }}>{currentQuestion['Study Description']}</p>
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', textWrap: 'wrap' }}><strong>Independent Variable:</strong> {currentQuestion['Independent Variable']}</p>
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', textWrap: 'wrap' }}><strong>Dependent Variable:</strong> {currentQuestion['Dependent Variable']}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Experimental Methods</h2>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '15px', flexDirection: 'column', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select which Experimental Methods is correct:</h3>
          
          {shuffledMethods.map((method, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                border: '1px solid #ddd', 
                padding: '10px', 
                marginBottom: index === shuffledMethods.length - 1 ? '0' : '10px', 
                cursor: 'pointer',
                backgroundColor: getBackgroundColor(index),
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedMethodIndex !== index) {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMethodIndex !== index) {
                  e.currentTarget.style.backgroundColor = getBackgroundColor(index);
                }
              }}
              onClick={() => handleMethodSelect(index)}
            >
              <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>
                {method['Experimental Methods']}
              </p>
            </div>
          ))}

          {selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex) && (
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
            disabled={selectedMethodIndex === null || !isCorrectAnswer(selectedMethodIndex) || reasoning.length < 10}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex) && reasoning.length >= 10 ? 'pointer' : 'not-allowed',
              opacity: selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex) && reasoning.length >= 10 ? 1 : 0.5
            }}
          >
            NEXT
          </button>
        ) : (
          <button 
            className="button"
            onClick={handleReviewResponses}
            disabled={selectedMethodIndex === null || !isCorrectAnswer(selectedMethodIndex) || reasoning.length < 10}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex) && reasoning.length >= 10 ? 'pointer' : 'not-allowed',
              opacity: selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex) && reasoning.length >= 10 ? 1 : 0.5
            }}
          >
            REVIEW RESPONSES
          </button>
        )}
      </div>
    </div>
  );
}