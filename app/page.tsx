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
  const [shuffledMethods, setShuffledMethods] = useState<ExperimentalMethod[]>([]);
  const [shuffledFixes, setShuffledFixes] = useState<Array<{text: string, index: number}>>([]);
  const [isClient, setIsClient] = useState(false);
  const questions: Question[] = data;

  // Initialize shuffled methods only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const shuffleArray = (array: ExperimentalMethod[]) => {
      const shuffled = [...array];
      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    if (questions[currentQuestionIndex]?.subElements) {
      setShuffledMethods(shuffleArray(questions[currentQuestionIndex].subElements));
    }
  }, [currentQuestionIndex, questions]);

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
    }
  };

  const handleContinue = () => {
    setShowFixes(true);
    
    // Shuffle the fixes for the selected method
    if (selectedMethodIndex !== null && shuffledMethods[selectedMethodIndex]) {
      const method = shuffledMethods[selectedMethodIndex];
      const fixes = [
        { text: method.fix1, index: 0 },
        { text: method.fix2, index: 1 },
        { text: method.fix3, index: 2 },
        { text: method.fix4, index: 3 }
      ];
      
      // Fisher-Yates shuffle algorithm
      const shuffled = [...fixes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      setShuffledFixes(shuffled);
    }
    
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
    }
  };

  const isCorrectFix = (shuffledFixIndex: number) => {
    if (!shuffledFixes[shuffledFixIndex] || !shuffledMethods[selectedMethodIndex!]) return false;
    const method = shuffledMethods[selectedMethodIndex!];
    const originalFixIndex = shuffledFixes[shuffledFixIndex].index;
    
    const correctness = [
      method['fix1 correct'] === 'Y',
      method['fix2 correct'] === 'Y', 
      method['fix3 correct'] === 'Y',
      method['fix4 correct'] === 'Y'
    ];
    
    return correctness[originalFixIndex] || false;
  };

  const handleMethodSelect = (methodIndex: number) => {
    setSelectedMethodIndex(methodIndex);
    // Delay scroll to allow DOM to update with reasoning box
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const isCorrectAnswer = (methodIndex: number) => {
    if (!shuffledMethods[methodIndex]) return false;
    return shuffledMethods[methodIndex].Correct === 'Y';
  };


  const getBackgroundColor = (methodIndex: number) => {
    if (selectedMethodIndex === methodIndex) {
      return isCorrectAnswer(methodIndex) ? '#e6ffe6' : '#ffe6e6';
    }
    return '#f9f9f9';
  };

  const getFixBackgroundColor = (fixIndex: number) => {
    if (selectedFixIndex === fixIndex) {
      return isCorrectFix(fixIndex) ? '#e6ffe6' : '#ffe6e6';
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
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select which Experimental Method is correct:</h3>
          
          {shuffledMethods.map((method, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                border: '1px solid #ddd', 
                padding: '10px', 
                marginBottom: index === shuffledMethods.length - 1 ? '0' : '10px', 
                cursor: showFixes ? 'not-allowed' : 'pointer',
                backgroundColor: getBackgroundColor(index),
                transition: 'background-color 0.2s ease',
                opacity: showFixes ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (selectedMethodIndex !== index && !showFixes) {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMethodIndex !== index && !showFixes) {
                  e.currentTarget.style.backgroundColor = getBackgroundColor(index);
                }
              }}
              onClick={() => !showFixes && handleMethodSelect(index)}
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
                onChange={(e) => !showFixes && setReasoning(e.target.value)}
                placeholder="Please explain why you selected this answer (minimum 10 characters)..."
                disabled={showFixes}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  opacity: showFixes ? 0.6 : 1,
                  cursor: showFixes ? 'not-allowed' : 'text'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {showFixes && selectedMethodIndex !== null && (
        <div style={{ marginBottom: '30px' }}>
          <h2>How would you modify this step?</h2>
          <div style={{ display: 'flex', border: '1px solid #ccc', padding: '15px', flexDirection: 'column', backgroundColor: 'white' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Select which Modification is correct:</h3>
            
            {shuffledFixes.length > 0 && (
              <>
                {shuffledFixes.map((fix, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      border: '1px solid #ddd', 
                      padding: '10px', 
                      marginBottom: index === shuffledFixes.length - 1 ? '0' : '10px', 
                      cursor: 'pointer',
                      backgroundColor: getFixBackgroundColor(index),
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFixIndex !== index) {
                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFixIndex !== index) {
                        e.currentTarget.style.backgroundColor = getFixBackgroundColor(index);
                      }
                    }}
                    onClick={() => handleFixSelect(index)}
                  >
                    <p style={{ textAlign: 'left', lineHeight: '1.6', margin: '0', flex: '1', width: '100%', textWrap: 'wrap' }}>
                      {fix.text}
                    </p>
                  </div>
                ))}

                {selectedFixIndex !== null && isCorrectFix(selectedFixIndex) && (
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
                      value={fixReasoning}
                      onChange={(e) => setFixReasoning(e.target.value)}
                      placeholder="Please explain why you selected this modification (minimum 10 characters)..."
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
            CONTINUE
          </button>
        ) : (
          currentQuestionIndex < questions.length - 1 ? (
            <button 
              className="button"
              onClick={handleNext}
              disabled={!showFixes || selectedFixIndex === null || !isCorrectFix(selectedFixIndex) || fixReasoning.length < 10}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '5px',
                cursor: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) && fixReasoning.length >= 10 ? 'pointer' : 'not-allowed',
                opacity: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) && fixReasoning.length >= 10 ? 1 : 0.5
              }}
            >
              NEXT STUDY
            </button>
          ) : (
            <button 
              className="button"
              onClick={handleRestart}
              disabled={!showFixes || selectedFixIndex === null || !isCorrectFix(selectedFixIndex) || fixReasoning.length < 10}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '5px',
                cursor: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) && fixReasoning.length >= 10 ? 'pointer' : 'not-allowed',
                opacity: showFixes && selectedFixIndex !== null && isCorrectFix(selectedFixIndex) && fixReasoning.length >= 10 ? 1 : 0.5
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