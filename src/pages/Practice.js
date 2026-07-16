// src/pages/Practice.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { resourceService } from '../services/resourceService';
import './Practice.css';

const Practice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [practice, setPractice] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        setLoading(true);
        
        // Get resource from location state or fetch by ID
        let practiceData = location.state?.resource;
        
        if (!practiceData) {
          const data = await resourceService.getResourceById(id);
          practiceData = data.resource;
        }
        
        if (practiceData) {
          setPractice(practiceData);
          
          // Parse problems from content
          let parsedProblems = [];
          try {
            // Check if content is a string or object
            let content = practiceData.content;
            if (typeof content === 'string') {
              // Try to parse as JSON
              try {
                content = JSON.parse(content);
              } catch (e) {
                // If not JSON, it might be plain text
                console.warn('Content is not JSON, using as is');
              }
            }
            
            // Try to get problems from content
            if (content && typeof content === 'object') {
              if (content.problems && Array.isArray(content.problems)) {
                parsedProblems = content.problems;
              }
            }
          } catch (e) {
            console.error('Error parsing practice content:', e);
          }
          
          setProblems(parsedProblems);
        } else {
          setError('Practice not found');
        }
      } catch (err) {
        console.error('Error fetching practice:', err);
        setError('Failed to load practice problems');
      } finally {
        setLoading(false);
      }
    };

    fetchPractice();
  }, [id, location.state]);

  // ===== IMPROVED ANSWER CHECKING =====
  const checkAnswer = (userAnswer, correctAnswer) => {
    if (!userAnswer || !correctAnswer) return false;
    
    // Normalize both answers for comparison
    const normalize = (str) => {
      return String(str)
        .toLowerCase()
        .trim()
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        // Remove common formatting like "x = " to just get the value
        .replace(/^[a-z]\s*=\s*/, '')
        // Remove parentheses
        .replace(/[()]/g, '')
        // Remove trailing punctuation
        .replace(/[.,;:]$/, '');
    };
    
    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);
    
    // Direct comparison
    if (normalizedUser === normalizedCorrect) return true;
    
    // Check if it's a numeric match (parse both as numbers)
    const numUser = parseFloat(normalizedUser);
    const numCorrect = parseFloat(normalizedCorrect);
    if (!isNaN(numUser) && !isNaN(numCorrect)) {
      if (numUser === numCorrect) return true;
    }
    
    // Check if the user answer contains the correct answer
    if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
      return true;
    }
    
    return false;
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const currentProblem = problems[currentProblemIndex];
    const isCorrect = checkAnswer(userAnswer, currentProblem.answer);
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    
    setShowAnswer(true);
  };

  const handleNextProblem = () => {
    setUserAnswer('');
    setShowAnswer(false);
    
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setCompleted(false);
  };

  const handleBack = () => {
    navigate('/resources');
  };

  if (loading) {
    return (
      <div className="practice-loading">
        <div className="loading-spinner"></div>
        <p>Loading practice problems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-error">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={handleBack}>Back to Resources</button>
      </div>
    );
  }

  if (!practice || problems.length === 0) {
    return (
      <div className="practice-empty">
        <span>📝</span>
        <h2>No Practice Problems</h2>
        <p>This practice set doesn't have any problems yet.</p>
        <button onClick={handleBack}>Back to Resources</button>
      </div>
    );
  }

  if (completed) {
    const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    
    return (
      <div className="practice-completed">
        <div className="completion-icon">🎉</div>
        <h2>Practice Complete!</h2>
        <div className="completion-score">
          <div className="score-circle">
            <span className="score-number">{percentage}%</span>
          </div>
          <p className="score-details">
            {score.correct} correct out of {score.total} problems
          </p>
        </div>
        <div className="completion-actions">
          <button className="btn-primary" onClick={handleReset}>Try Again</button>
          <button className="btn-secondary" onClick={handleBack}>Back to Resources</button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const progress = ((currentProblemIndex + 1) / problems.length) * 100;

  return (
    <div className="practice-container">
      <div className="practice-header">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <h1>{practice.name}</h1>
        <div className="practice-progress">
          <span>Problem {currentProblemIndex + 1} of {problems.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="practice-content">
        <div className="problem-card">
          <div className="problem-number">
            Question {currentProblemIndex + 1}
          </div>
          <div className="problem-text">
            {currentProblem.question}
          </div>
          
          {currentProblem.options && (
            <div className="problem-options">
              {currentProblem.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${userAnswer === option ? 'selected' : ''}`}
                  onClick={() => setUserAnswer(option)}
                  disabled={showAnswer}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}
          
          {!currentProblem.options && (
            <div className="problem-input">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                disabled={showAnswer}
                rows={4}
              />
            </div>
          )}

          {showAnswer && (
            <div className={`answer-feedback ${checkAnswer(userAnswer, currentProblem.answer) ? 'correct' : 'incorrect'}`}>
              <div className="feedback-icon">
                {checkAnswer(userAnswer, currentProblem.answer) ? '✅' : '❌'}
              </div>
              <div className="feedback-details">
                <p className="feedback-answer">
                  <strong>Answer:</strong> {currentProblem.answer}
                </p>
                {currentProblem.solution && (
                  <p className="feedback-explanation">
                    <strong>Solution:</strong> {currentProblem.solution}
                  </p>
                )}
                {currentProblem.hint && (
                  <p className="feedback-hint">
                    <strong>Hint:</strong> {currentProblem.hint}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="problem-actions">
            {!showAnswer ? (
              <button 
                className="btn-primary" 
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
              >
                Submit Answer
              </button>
            ) : (
              <button className="btn-primary" onClick={handleNextProblem}>
                {currentProblemIndex < problems.length - 1 ? 'Next Problem →' : 'See Results'}
              </button>
            )}
          </div>
        </div>

        <div className="practice-sidebar">
          <div className="score-display">
            <h3>Score</h3>
            <div className="score-numbers">
              <span className="correct">{score.correct}</span>
              <span className="separator">/</span>
              <span className="total">{score.total}</span>
            </div>
            <div className="score-percentage">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </div>
          </div>
          
          <div className="problem-list">
            <h3>Problems</h3>
            <div className="problem-dots">
              {problems.map((_, index) => (
                <div
                  key={index}
                  className={`problem-dot ${index === currentProblemIndex ? 'active' : ''} ${
                    index < currentProblemIndex ? 'completed' : ''
                  }`}
                  onClick={() => {
                    if (index < currentProblemIndex || showAnswer) {
                      setCurrentProblemIndex(index);
                      setUserAnswer('');
                      setShowAnswer(false);
                    }
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;