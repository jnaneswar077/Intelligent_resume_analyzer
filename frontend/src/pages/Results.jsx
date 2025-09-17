import MatchResults from '../components/MatchResults';
import Suggestions from '../components/Suggestions';
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

// Component to render Gemini response with proper styling
function GeminiResponseRenderer({ text }) {
  if (!text) return null;

  // Parse the markdown-like content and convert to styled JSX
  const parseContent = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];
    let currentSection = null;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-3 mb-6">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <span className="text-blue-400 mt-1 flex-shrink-0 text-sm">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        if (inList) flushList();
        return;
      }

      // Handle markdown headers (### Header)
      if (trimmed.startsWith('###')) {
        if (inList) flushList();
        const title = trimmed.replace(/^###\s*/, '').trim();
        
        // Different colors and icons for different sections
        let headerColor = 'text-white';
        let iconColor = 'text-blue-400';
        let bgColor = 'bg-blue-900 bg-opacity-30 border-blue-700';
        let icon = null;
        
        if (title.toLowerCase().includes('strength')) {
          headerColor = 'text-green-300';
          iconColor = 'text-green-400';
          bgColor = 'bg-green-900 bg-opacity-30 border-green-700';
          icon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('weakness')) {
          headerColor = 'text-orange-300';
          iconColor = 'text-orange-400';
          bgColor = 'bg-orange-900 bg-opacity-30 border-orange-700';
          icon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('improvement')) {
          headerColor = 'text-blue-300';
          iconColor = 'text-blue-400';
          bgColor = 'bg-blue-900 bg-opacity-30 border-blue-700';
          icon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('example')) {
          headerColor = 'text-purple-300';
          iconColor = 'text-purple-400';
          bgColor = 'bg-purple-900 bg-opacity-30 border-purple-700';
          icon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('recommendation') || title.toLowerCase().includes('suggestion')) {
          headerColor = 'text-indigo-300';
          iconColor = 'text-indigo-400';
          bgColor = 'bg-indigo-900 bg-opacity-30 border-indigo-700';
          icon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          );
        }
        
        // Store current list state for next section
        let nextListItems = [];
        
        elements.push(
          <div key={`section-${index}`} className={`rounded-lg p-6 border ${bgColor} mb-6 mt-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={iconColor}>{icon}</div>
              <h3 className={`text-xl font-bold ${headerColor}`}>{title}</h3>
            </div>
            <div className="section-content" data-section={title.toLowerCase()}>
              {/* Content will be added by subsequent iterations */}
            </div>
          </div>
        );
        
        currentSection = title;
        return;
      }

      // Handle section headers (like **Strengths**, **Weaknesses**)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (inList) flushList();
        const title = trimmed.replace(/\*\*/g, '');
        
        // Different colors for different sections
        let headerColor = 'text-white';
        let iconColor = 'text-blue-400';
        let icon = null;
        
        if (title.toLowerCase().includes('strength')) {
          headerColor = 'text-green-300';
          iconColor = 'text-green-400';
          icon = (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('weakness')) {
          headerColor = 'text-orange-300';
          iconColor = 'text-orange-400';
          icon = (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('improvement')) {
          headerColor = 'text-blue-300';
          iconColor = 'text-blue-400';
          icon = (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          );
        } else if (title.toLowerCase().includes('example')) {
          headerColor = 'text-purple-300';
          iconColor = 'text-purple-400';
          icon = (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          );
        }
        
        elements.push(
          <div key={`header-${index}`} className="flex items-center gap-3 mb-4 mt-6">
            <div className={iconColor}>{icon}</div>
            <h3 className={`text-xl font-bold ${headerColor}`}>{title}</h3>
          </div>
        );
        currentSection = title;
        return;
      }

      // Handle bullet points (lines starting with * or -)
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        let content = trimmed.replace(/^[*-]\s*/, '').trim();
        
        // Remove bold markdown and handle nested bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        
        if (!inList) {
          inList = true;
        }
        
        listItems.push(
          <span dangerouslySetInnerHTML={{ __html: content }} />
        );
        return;
      }

      // Handle regular text
      if (inList) flushList();
      
      // Handle bold text in regular content
      let content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      
      elements.push(
        <p key={`text-${index}`} className="text-gray-300 mb-4 leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: content }} />
      );
    });

    // Flush any remaining list
    if (inList) flushList();

    return elements;
  };

  // Alternative approach: render as structured sections
  const renderStructuredContent = (content) => {
    const sections = content.split(/###\s+/);
    
    return sections.map((section, index) => {
      if (index === 0 && !section.trim()) return null; // Skip empty intro
      
      const lines = section.trim().split('\n');
      if (lines.length === 0) return null;
      
      const title = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();
      
      if (!title) return null;
      
      // Determine section styling based on title
      let headerColor = 'text-white';
      let iconColor = 'text-blue-400';
      let bgColor = 'bg-gray-800 bg-opacity-40 border-gray-600';
      let icon = null;
      
      if (title.toLowerCase().includes('strength')) {
        headerColor = 'text-green-300';
        iconColor = 'text-green-400';
        bgColor = 'bg-green-900 bg-opacity-30 border-green-700';
        icon = (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      } else if (title.toLowerCase().includes('weakness')) {
        headerColor = 'text-orange-300';
        iconColor = 'text-orange-400';
        bgColor = 'bg-orange-900 bg-opacity-30 border-orange-700';
        icon = (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      } else if (title.toLowerCase().includes('improvement')) {
        headerColor = 'text-blue-300';
        iconColor = 'text-blue-400';
        bgColor = 'bg-blue-900 bg-opacity-30 border-blue-700';
        icon = (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      } else if (title.toLowerCase().includes('example')) {
        headerColor = 'text-purple-300';
        iconColor = 'text-purple-400';
        bgColor = 'bg-purple-900 bg-opacity-30 border-purple-700';
        icon = (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      } else if (title.toLowerCase().includes('recommendation') || title.toLowerCase().includes('suggestion')) {
        headerColor = 'text-indigo-300';
        iconColor = 'text-indigo-400';
        bgColor = 'bg-indigo-900 bg-opacity-30 border-indigo-700';
        icon = (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      }
      
      // Parse body content for bullet points
      const renderBody = (bodyText) => {
        if (!bodyText) return null;
        
        const bodyLines = bodyText.split('\n');
        const elements = [];
        let listItems = [];
        
        bodyLines.forEach((line, lineIndex) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            let content = trimmed.replace(/^[*-]\s*/, '').trim();
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
            listItems.push(
              <li key={lineIndex} className="flex items-start gap-3 text-gray-300">
                <span className="text-current mt-1 flex-shrink-0 text-sm opacity-70">•</span>
                <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
              </li>
            );
          } else {
            if (listItems.length > 0) {
              elements.push(
                <ul key={`list-${elements.length}`} className="space-y-3 mb-4">
                  {listItems}
                </ul>
              );
              listItems = [];
            }
            const content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
            elements.push(
              <p key={lineIndex} className="text-gray-300 mb-3 leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: content }} />
            );
          }
        });
        
        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="space-y-3">
              {listItems}
            </ul>
          );
        }
        
        return elements;
      };
      
      return (
        <div key={index} className={`rounded-lg p-6 border ${bgColor} mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={iconColor}>{icon}</div>
            <h3 className={`text-xl font-bold ${headerColor}`}>{title}</h3>
          </div>
          <div className="text-gray-300">
            {renderBody(body)}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // Check if content has ### headers to decide rendering approach
  const hasMarkdownHeaders = text.includes('###');

  return (
    <div className="gemini-response">
      {hasMarkdownHeaders ? renderStructuredContent(text) : parseContent(text)}
    </div>
  );
}

// ATS Score Circle Component
function ATSScoreCircle({ score }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return { primary: '#10B981', secondary: '#34D399', bg: '#065F46' }; // Green
    if (score >= 60) return { primary: '#F59E0B', secondary: '#FBBF24', bg: '#92400E' }; // Yellow
    if (score >= 40) return { primary: '#EF4444', secondary: '#F87171', bg: '#991B1B' }; // Red
    return { primary: '#6B7280', secondary: '#9CA3AF', bg: '#374151' }; // Gray
  };
  
  const colors = getScoreColor(score);
  
  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">ATS Match Rate</h2>
      <div className="relative w-64 h-64 mx-auto">
        {/* Background circle */}
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#374151"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.primary}
            strokeWidth="12"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${colors.secondary})`,
            }}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-1">
              {Math.round(score)}
              <span className="text-3xl text-gray-300">%</span>
            </div>
            <div className="text-gray-400 text-sm font-medium">
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'}
            </div>
          </div>
        </div>
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{
            background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          }}
        ></div>
      </div>
    </div>
  );
}

// Step-by-step loading animation component
function DetailedAnalysisLoader({ isVisible, onComplete, apiCompleted = false }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showWaitingForAPI, setShowWaitingForAPI] = useState(false);
  
  const steps = [
    "Please wait...",
    "Loading your resume...",
    "Parsing your resume...",
    "Identifying work experiences...",
    "Identifying other experiences...",
    "Evaluating resume length...",
    "Identifying bullet points...",
    "Analyzing resume depth..."
  ];
  
  useEffect(() => {
    if (!isVisible) {
      // Reset all state when loader becomes invisible
      setCurrentStep(-1);
      setCompletedSteps(new Set());
      setProgress(0);
      setShowWaitingForAPI(false);
      setHasStarted(false);
      return;
    }
    
    // If becoming visible and we haven't started, reset everything
    if (isVisible && !hasStarted) {
      setCurrentStep(-1);
      setCompletedSteps(new Set());
      setProgress(0);
      setShowWaitingForAPI(false);
    }
    
    // Mark that we've started the animation
    setHasStarted(true);
    
    let stepIndex = 0; // Always start from step 0 for new animations
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(prevStep => Math.max(prevStep, stepIndex));
        
        // Update progress bar to always move forward
        const newProgress = ((stepIndex + 1) / steps.length) * 100;
        setProgress(prevProgress => Math.max(prevProgress, newProgress));
        
        // Mark previous step as completed after a delay
        if (stepIndex > 0) {
          setTimeout(() => {
            setCompletedSteps(prev => {
              const newSet = new Set(prev);
              newSet.add(stepIndex - 1);
              return newSet;
            });
          }, 400); // Faster completion timing
        }
        
        stepIndex++;
      } else {
        // Mark last step as completed
        setProgress(100);
        setTimeout(() => {
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.add(steps.length - 1);
            return newSet;
          });
          // After all steps complete, show waiting for API if not done yet
          setTimeout(() => {
            if (!apiCompleted) {
              setShowWaitingForAPI(true);
            } else {
              onComplete();
            }
          }, 500);
        }, 400);
        clearInterval(interval);
      }
    }, 600); // Faster timing: 600ms instead of 1200ms
    
    return () => clearInterval(interval);
  }, [isVisible, hasStarted, currentStep, apiCompleted, onComplete]);
  
  // If API completes while we're showing waiting state, hide immediately
  useEffect(() => {
    if (apiCompleted && showWaitingForAPI) {
      onComplete();
    }
  }, [apiCompleted, showWaitingForAPI, onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-lg mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Detailed Analysis in Progress
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Resume</h2>
          <p className="text-gray-400">Our AI is performing a comprehensive analysis</p>
        </div>
        
        {showWaitingForAPI ? (
          /* Waiting for API Response State */
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <svg className="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="text-xl font-medium text-white">
                Preparing your resume review, just a second
                <span className="ml-1 inline-flex">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </span>
              </div>
            </div>
            <p className="text-gray-400 mb-8">Our AI is finalizing the detailed analysis...</p>
            
            {/* Keep the progress bar at 100% */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          /* Step-by-step Progress State */
          <>
            <div className="relative h-40 overflow-hidden flex flex-col items-center justify-center">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.has(index);
                const isCurrent = currentStep === index;
                const isNext = index === currentStep + 1;
                const isVisible = index <= currentStep + 1; // Show current and next
                
                // Calculate position relative to current step
                const positionFromCurrent = index - currentStep;
                
                let opacity = 0;
                let translateY = 0;
                let scale = 0.8;
                
                if (positionFromCurrent < -2) {
                  // Steps that are far in the past: completely hidden
                  opacity = 0;
                  translateY = -100;
                } else if (positionFromCurrent === -2) {
                  // Two steps back: fading out upward
                  opacity = 0.2;
                  translateY = -80;
                  scale = 0.7;
                } else if (positionFromCurrent === -1) {
                  // Previous step: moving up
                  opacity = 0.4;
                  translateY = -60;
                  scale = 0.8;
                } else if (positionFromCurrent === 0) {
                  // Current step: center, bright
                  opacity = 1;
                  translateY = 0;
                  scale = 1;
                } else if (positionFromCurrent === 1) {
                  // Next step: below center, transparent preview
                  opacity = 0.3;
                  translateY = 60;
                  scale = 0.9;
                } else {
                  // Future steps: hidden
                  opacity = 0;
                  translateY = 100;
                }
                
                return (
                  <div 
                    key={index}
                    className={`absolute flex items-center gap-4 transition-all duration-700 ease-in-out w-full max-w-md ${
                      isVisible ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                    style={{
                      opacity: isVisible ? opacity : 0,
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      zIndex: positionFromCurrent === 0 ? 10 : Math.max(0, 10 + positionFromCurrent)
                    }}
                  >
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isCurrent 
                        ? 'border-purple-500 bg-purple-500 bg-opacity-20' 
                        : isNext
                        ? 'border-gray-500 bg-gray-700 bg-opacity-50'
                        : 'border-gray-600 bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      ) : isNext ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full opacity-60"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Step Text */}
                    <div className={`text-lg font-medium transition-all duration-500 text-center ${
                      isCompleted 
                        ? 'text-green-300' 
                        : isCurrent 
                        ? 'text-white font-semibold' 
                        : isNext
                        ? 'text-gray-400 font-normal'
                        : 'text-gray-500'
                    }`}>
                      {step}
                      {isCurrent && (
                        <span className="ml-2 inline-flex">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                        </span>
                      )}
                      {isNext && (
                        <span className="block text-xs text-gray-500 mt-1">Next</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Results({ data, onRestart }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoleKey, setLoadingRoleKey] = useState('');
  const [showDetailedLoader, setShowDetailedLoader] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [apiCompleted, setApiCompleted] = useState(false);
  const detailAnalysisRef = useRef(null);
  
  if (!data) return null;

  async function handleSelectRole(r) {
    const key = `${r.category}-${r.role}`;
    setLoadingRoleKey(key);
    setShowDetailedLoader(true);
    setSelectedRole(r); // Store the selected role
    setApiCompleted(false); // Reset API completion status
    
    // This will be triggered when the loading animation completes
    const performAnalysis = async () => {
      setLoading(true);
      try {
        const res = await api.getDetailedAnalysis({ resume_id: data.resume_id, category: r.category, role: r.role });
        
        // Mark API as completed
        setApiCompleted(true);
        // Immediately hide the loading animation when results arrive
        setShowDetailedLoader(false);
        setDetail(res);
        
        // Auto-scroll to detailed analysis section after a short delay
        setTimeout(() => {
          if (detailAnalysisRef.current) {
            detailAnalysisRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 300);
      } finally {
        setLoading(false);
        setLoadingRoleKey('');
      }
    };
    
    // Start the actual API call immediately (not after animation)
    performAnalysis();
  }
  
  const handleLoaderComplete = () => {
    setShowDetailedLoader(false);
  };

  return (
    <div className="min-h-screen bg-dark-blue">
      {/* Detailed Analysis Loader Overlay */}
      <DetailedAnalysisLoader 
        key={selectedRole ? `${selectedRole.category}-${selectedRole.role}` : 'default'}
        isVisible={showDetailedLoader} 
        onComplete={handleLoaderComplete}
        apiCompleted={apiCompleted}
      />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          {/* AI-Powered Tag */}
          <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Analysis Complete
          </div>
          <button 
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
            onClick={onRestart}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Run Again
          </button>
        </div>

        {/* ATS Score Circle */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Your Resume Analysis</h1>
          <div className="flex justify-center">
            <ATSScoreCircle score={data.ats_score} />
          </div>
        </div>

        {/* Top Role Matches */}
        <div className="mb-12">
          <MatchResults topRoles={data.top_roles} ats={data.ats_score} onSelectRole={handleSelectRole} loadingRoleKey={loadingRoleKey} />
        </div>

        {/* Suggestions */}
        <div className="mb-8">
          <Suggestions shortText={data.suggestions_short} skills={data.extracted_skills} missing={data.missing_skills_union} />
        </div>

        {/* Detailed Analysis */}
        {detail && (
          <div ref={detailAnalysisRef} className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                Detailed Analysis for {selectedRole ? selectedRole.role : 'Selected Role'}
              </h3>
              {loading && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              )}
            </div>
            
            {detail.llm_polished_text && (
              <div className="mb-8 p-6 bg-gray-800 bg-opacity-50 rounded-xl border border-gray-600">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-semibold text-white flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    AI-Generated Summary
                  </h4>
                  {detail.gemini_timestamp && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium px-3 py-1 bg-green-900 bg-opacity-30 rounded-full border border-green-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Generated: {detail.gemini_timestamp}</span>
                    </div>
                  )}
                </div>
                <GeminiResponseRenderer text={detail.llm_polished_text} />
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border border-green-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-green-300">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {(detail.strengths||[]).map((s,i)=>(
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1.5 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-900 bg-opacity-30 rounded-lg p-6 border border-orange-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-orange-300">Areas for Improvement</h4>
                </div>
                <ul className="space-y-2">
                  {(detail.weaknesses||[]).map((s,i)=>(
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-orange-400 mt-1.5 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-6 border border-blue-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-blue-300">Actionable Recommendations</h4>
                </div>
                <ul className="space-y-2">
                  {(detail.actionable_recs||[]).map((s,i)=>(
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-1.5 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 border border-purple-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-purple-300">Example Bullets</h4>
                </div>
                <ul className="space-y-2">
                  {(detail.example_bullets||[]).map((s,i)=>(
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400 mt-1.5 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}