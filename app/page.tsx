'use client';

import React, { useState, useEffect } from 'react';
import data from '../public/data.json';

interface ExperimentalMethod {
  'Experimental Methods': string;
  Correct: string;
  'correctness of methods selection': string;
  fix1: string;
  'fix1 correct': string;
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
  'Causal Pathway': string;
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


export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMethodIndex, setSelectedMethodIndex] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFixes, setShowFixes] = useState(false);
  const [selectedFixIndex, setSelectedFixIndex] = useState<number | null>(null);
  const [fixReasoning, setFixReasoning] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [showMethodResponse, setShowMethodResponse] = useState(false);
  const questions: Question[] = data;

  // Initialize client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  const handleNext = () => {
    if (selectedMethodIndex !== null) {
      // Keep the old response format for local state tracking
      const userResponse: UserResponse = {
        questionIndex: currentQuestionIndex,
        selectedMethodIndex: selectedMethodIndex,
        reasoning: reasoning,
        isCorrect: isCorrectAnswer(selectedMethodIndex),
        question: questions[currentQuestionIndex]
      };
      
      setUserResponses(prev => [...prev, userResponse]);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedMethodIndex(null);
      setReasoning('');
      setShowFixes(false);
      setSelectedFixIndex(null);
      setFixReasoning('');
      setShowMethodResponse(false);
    }
  };

  const handleContinue = () => {
    setShowFixes(true);
    
    // Scroll to bottom after showing fixes
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleFixSelect = (fixIndex: number) => {
    setSelectedFixIndex(fixIndex);
    
    // If correct selection, scroll to bottom after DOM updates
    if (isCorrectFix(fixIndex)) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleRestart = () => {
    // Reset all state to restart the application
    setCurrentQuestionIndex(0);
    setSelectedMethodIndex(null);
    setReasoning('');
    setUserResponses([]);
    setLoading(false);
    setShowFixes(false);
    setSelectedFixIndex(null);
    setFixReasoning('');
    setShowMethodResponse(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedMethodIndex(null);
      setReasoning('');
      setShowFixes(false);
      setSelectedFixIndex(null);
      setFixReasoning('');
      setShowMethodResponse(false);
    }
  };

  const isCorrectFix = (fixIndex: number) => {
    if (selectedMethodIndex === null) return false;
    const method = questions[currentQuestionIndex].subElements[selectedMethodIndex];
    
    const correctness = [
      method['fix1 correct'] === 'Y',
      method['fix2 correct'] === 'Y', 
      method['fix3 correct'] === 'Y',
      method['fix4 correct'] === 'Y'
    ];
    
    return correctness[fixIndex] || false;
  };

  const handleMethodSelect = (methodIndex: number) => {
    setSelectedMethodIndex(methodIndex);
    if (showMethodResponse) {
      setShowMethodResponse(false);
    }
  };

  const handleSubmitMethodChoice = () => {
    setShowMethodResponse(true);
    // Delay scroll to allow DOM to update with reasoning box
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const isCorrectAnswer = (methodIndex: number) => {
    if (!questions[currentQuestionIndex]?.subElements[methodIndex]) return false;
    return questions[currentQuestionIndex].subElements[methodIndex].Correct === 'Y';
  };


  const getMethodStyle = (methodIndex: number) => {
    if (selectedMethodIndex === methodIndex) {
      return {
        backgroundColor: isCorrectAnswer(methodIndex) ? '#f0fdf4' : '#fef2f2',
        border: isCorrectAnswer(methodIndex) ? '3px solid #22c55e' : '3px solid #ef4444',
        boxShadow: isCorrectAnswer(methodIndex) ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)',
        transform: 'scale(1.02)'
      };
    }
    return {
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      boxShadow: 'none',
      transform: 'scale(1)'
    };
  };

  const getFixStyle = (fixIndex: number) => {
    if (selectedFixIndex === fixIndex) {
      return {
        backgroundColor: isCorrectFix(fixIndex) ? '#f0fdf4' : '#fef2f2',
        border: isCorrectFix(fixIndex) ? '3px solid #22c55e' : '3px solid #ef4444',
        boxShadow: isCorrectFix(fixIndex) ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)',
        transform: 'scale(1.02)'
      };
    }
    return {
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      boxShadow: 'none',
      transform: 'scale(1)'
    };
  };

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        No questions available.
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
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', textWrap: 'wrap' }}><strong>Causal Pathway:</strong> {currentQuestion['Causal Pathway']}</p>
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0 0 10px 0', textWrap: 'wrap' }}><strong>Independent Variable:</strong> {currentQuestion['Independent Variable']}</p>
            <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', textWrap: 'wrap' }}><strong>Dependent Variable:</strong> {currentQuestion['Dependent Variable']}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Experimental Methods</h2>
        <div style={{ display: 'flex', border: '1px solid #ccc', padding: '15px', flexDirection: 'column', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select a step of the methods that can be improved:</h3>
          
          {questions[currentQuestionIndex].subElements.map((method, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                padding: '12px', 
                marginBottom: index === questions[currentQuestionIndex].subElements.length - 1 ? '0' : '12px', 
                cursor: showFixes || (showMethodResponse && selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex)) ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                opacity: showFixes || (showMethodResponse && selectedMethodIndex !== null && isCorrectAnswer(selectedMethodIndex)) ? 0.6 : 1,
                ...getMethodStyle(index)
              }}
              onMouseEnter={(e) => {
                if (selectedMethodIndex !== index && !showFixes && (!showMethodResponse || (selectedMethodIndex !== null && !isCorrectAnswer(selectedMethodIndex)))) {
                  e.currentTarget.style.backgroundColor = '#e8f5e8';
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMethodIndex !== index && !showFixes && (!showMethodResponse || (selectedMethodIndex !== null && !isCorrectAnswer(selectedMethodIndex)))) {
                  const baseStyle = getMethodStyle(index);
                  e.currentTarget.style.backgroundColor = baseStyle.backgroundColor;
                  e.currentTarget.style.transform = baseStyle.transform;
                  e.currentTarget.style.boxShadow = baseStyle.boxShadow;
                }
              }}
              onClick={() => !showFixes && (!showMethodResponse || (selectedMethodIndex !== null && !isCorrectAnswer(selectedMethodIndex))) && handleMethodSelect(index)}
            >
              <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>
                {method['Experimental Methods']}
              </p>
            </div>
          ))}

          {selectedMethodIndex !== null && !showMethodResponse && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                className="button"
                onClick={handleSubmitMethodChoice}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                SUBMIT CHOICE
              </button>
            </div>
          )}

          {selectedMethodIndex !== null && showMethodResponse && (
            <div style={{ 
              display: 'flex', 
              border: isCorrectAnswer(selectedMethodIndex) ? '2px solid #22c55e' : '2px solid #ef4444',
              borderRadius: '12px',
              padding: '20px', 
              marginTop: '20px', 
              flexDirection: 'column', 
              backgroundColor: isCorrectAnswer(selectedMethodIndex) ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              boxShadow: isCorrectAnswer(selectedMethodIndex) ? '0 4px 12px rgba(34, 197, 94, 0.15)' : '0 4px 12px rgba(239, 68, 68, 0.15)',
              background: isCorrectAnswer(selectedMethodIndex) ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCorrectAnswer(selectedMethodIndex) ? '#22c55e' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {isCorrectAnswer(selectedMethodIndex) ? '✓' : '✗'}
                </div>
                <h4 style={{ 
                  margin: '0', 
                  textAlign: 'left', 
                  color: isCorrectAnswer(selectedMethodIndex) ? '#15803d' : '#dc2626',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {isCorrectAnswer(selectedMethodIndex) ? 'Correct!' : 'Incorrect'}
                </h4>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                border: `1px solid ${isCorrectAnswer(selectedMethodIndex) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <p style={{ 
                  margin: '0', 
                  textAlign: 'left', 
                  lineHeight: '1.6',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  {questions[currentQuestionIndex].subElements[selectedMethodIndex]['correctness of methods selection']}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {showFixes && selectedMethodIndex !== null && (
        <div style={{ marginBottom: '30px' }}>
          <h2>How would you modify this step?</h2>
          <div style={{ display: 'flex', border: '1px solid #ccc', padding: '15px', flexDirection: 'column', backgroundColor: 'white' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select an appropriate modification to the chosen method to make it a more direct test of the causal pathway:</h3>
            
            {selectedMethodIndex !== null && (
              <>
                {[
                  questions[currentQuestionIndex].subElements[selectedMethodIndex].fix1,
                  questions[currentQuestionIndex].subElements[selectedMethodIndex].fix2,
                  questions[currentQuestionIndex].subElements[selectedMethodIndex].fix3,
                  questions[currentQuestionIndex].subElements[selectedMethodIndex].fix4
                ].map((fix, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      padding: '12px', 
                      marginBottom: index === 3 ? '0' : '12px', 
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      ...getFixStyle(index)
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFixIndex !== index) {
                        e.currentTarget.style.backgroundColor = '#e8f5e8';
                        e.currentTarget.style.transform = 'scale(1.01)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFixIndex !== index) {
                        const baseStyle = getFixStyle(index);
                        e.currentTarget.style.backgroundColor = baseStyle.backgroundColor;
                        e.currentTarget.style.transform = baseStyle.transform;
                        e.currentTarget.style.boxShadow = baseStyle.boxShadow;
                      }
                    }}
                    onClick={() => handleFixSelect(index)}
                  >
                    <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>
                      {fix}
                    </p>
                  </div>
                ))}

              </>
            )}
          </div>
        </div>
      )}

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
            PREVIOUS STUDY
          </button>
        )}

        {!showFixes ? (
          <button 
            className="button"
            onClick={handleContinue}
            disabled={selectedMethodIndex === null || !showMethodResponse || !isCorrectAnswer(selectedMethodIndex)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedMethodIndex !== null && showMethodResponse && isCorrectAnswer(selectedMethodIndex) ? 'pointer' : 'not-allowed',
              opacity: selectedMethodIndex !== null && showMethodResponse && isCorrectAnswer(selectedMethodIndex) ? 1 : 0.5
            }}
          >
            CONTINUE
          </button>
        ) : (
          currentQuestionIndex < questions.length - 1 ? (
            <button 
              className="button"
              onClick={handleNext}
              disabled={!showFixes || selectedFixIndex === null || !isCorrectFix(selectedFixIndex)}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '5px',
                cursor: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) ? 'pointer' : 'not-allowed',
                opacity: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) ? 1 : 0.5
              }}
            >
              NEXT STUDY
            </button>
          ) : (
            <button 
              className="button"
              onClick={handleRestart}
              disabled={!showFixes || selectedFixIndex === null || !isCorrectFix(selectedFixIndex)}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '5px',
                cursor: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) ? 'pointer' : 'not-allowed',
                opacity: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) ? 1 : 0.5
              }}
            >
              RESTART ACTIVITY
            </button>
          )
        )}
      </div>
    </div>
  );
}