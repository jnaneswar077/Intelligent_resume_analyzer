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

// Step Indicator Component
function StepIndicator({ currentStep, totalSteps = 4 }) {
  const steps = [
    { id: 1, label: 'Upload Resume' },
    { id: 2, label: 'Select Category' },
    { id: 3, label: 'Add Job Description' },
    { id: 4, label: 'View Results' }
  ];

  return (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400'
              }`}>
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="ml-3 text-center">
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`ml-6 w-16 h-0.5 transition-colors duration-300 ${
                  isCompleted ? 'bg-blue-500' : 'bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Step 1: Resume Upload Component
function Step1ResumeUpload({ onNext, onFileSelect, selectedFile }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-8 flex-1">
        <StepIndicator currentStep={1} />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Upload your resume to get started</h1>
          <p className="text-gray-400">Upload your resume in PDF or DOCX format</p>
        </div>

        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border-2 border-dashed border-blue-400 mb-8">
          <div 
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center ${
              dragActive 
                ? 'border-blue-400 bg-blue-900 bg-opacity-30' 
                : selectedFile
                ? 'border-green-400 bg-green-900 bg-opacity-30'
                : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">File Selected Successfully</h3>
                <p className="text-green-300 mb-4">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">Click here to select a different file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {dragActive ? 'Drop your resume here' : 'Upload your resume'}
                </h3>
                <p className="text-gray-400 mb-4">Drag & drop your resume here, or click to browse</p>
                <p className="text-gray-500 text-sm">as .pdf or .docx file</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onNext}
            disabled={!selectedFile}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedFile
                ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Category Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 2: Category Selection Component
function Step2CategorySelection({ onNext, onPrev, selectedCategory, onCategorySelect, availableRoles }) {
  const categories = Object.keys(availableRoles || {});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // Category icons mapping
  const categoryIcons = {
    "Software Development (SDE)": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    "DevOps & Cloud Engineering": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
    "Cybersecurity": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    "UI/UX & Design": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    "Artificial Intelligence & Machine Learning": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    "Data Engineering & Analytics": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    "Digital Marketing": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    "Product Management": (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  };
  
  // Category colors mapping
  const categoryColors = {
    "Software Development (SDE)": { border: "border-blue-500", bg: "bg-blue-900", icon: "text-blue-400" },
    "DevOps & Cloud Engineering": { border: "border-green-500", bg: "bg-green-900", icon: "text-green-400" },
    "Cybersecurity": { border: "border-red-500", bg: "bg-red-900", icon: "text-red-400" },
    "UI/UX & Design": { border: "border-purple-500", bg: "bg-purple-900", icon: "text-purple-400" },
    "Artificial Intelligence & Machine Learning": { border: "border-orange-500", bg: "bg-orange-900", icon: "text-orange-400" },
    "Data Engineering & Analytics": { border: "border-indigo-500", bg: "bg-indigo-900", icon: "text-indigo-400" },
    "Digital Marketing": { border: "border-pink-500", bg: "bg-pink-900", icon: "text-pink-400" },
    "Product Management": { border: "border-teal-500", bg: "bg-teal-900", icon: "text-teal-400" }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <StepIndicator currentStep={2} />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Select Job Category</h1>
          <p className="text-gray-400">Choose the category that best matches your target role</p>
        </div>

        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {categories.map((category) => {
              const roles = availableRoles[category] || {};
              const rolesList = Object.keys(roles);
              const colors = categoryColors[category] || { border: "border-gray-500", bg: "bg-gray-900", icon: "text-gray-400" };
              const isHovered = hoveredCategory === category;
              
              return (
                <div
                  key={category}
                  className="group h-80"
                  onMouseEnter={() => setHoveredCategory(category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{ perspective: '1000px' }}
                >
                  {/* Card Container with 3D flip effect */}
                  <div 
                    className={`relative w-full h-full transition-transform duration-700 cursor-pointer ${
                      isHovered ? 'transform' : ''
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                    onClick={() => onCategorySelect(category)}
                  >
                    {/* Front Face */}
                    <div 
                      className={`absolute inset-0 rounded-xl border-2 p-6 transition-all duration-300 ${
                        selectedCategory === category
                          ? `${colors.border} ${colors.bg} bg-opacity-30 shadow-lg`
                          : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-gray-500'
                      }`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg transition-colors ${
                          selectedCategory === category ? colors.bg : 'bg-gray-700'
                        } bg-opacity-50`}>
                          <div className={`transition-colors ${
                            selectedCategory === category ? colors.icon : 'text-gray-400 group-hover:text-gray-300'
                          }`}>
                            {categoryIcons[category]}
                          </div>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                          selectedCategory === category
                            ? `${colors.border} ${colors.bg} bg-opacity-80`
                            : 'border-gray-400'
                        }`}>
                          {selectedCategory === category && (
                            <svg className="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Category Title */}
                      <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                        selectedCategory === category ? 'text-white' : 'text-gray-200 group-hover:text-white'
                      }`}>
                        {category.replace(' (SDE)', '').replace('Software Development', 'SDE')}
                      </h3>
                      
                      {/* Roles Count */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium transition-colors ${
                            selectedCategory === category ? colors.icon : 'text-gray-400 group-hover:text-gray-300'
                          }`}>
                            {rolesList.length} available roles
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Back Face - Roles Display */}
                    <div 
                      className={`absolute inset-0 rounded-xl border-2 p-6 transition-all duration-300 ${
                        selectedCategory === category
                          ? `${colors.border} ${colors.bg} bg-opacity-30 shadow-lg`
                          : `${colors.border} ${colors.bg} bg-opacity-20`
                      }`}
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      {/* Selection checkbox in top right */}
                      <div className="flex justify-end mb-4">
                        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                          selectedCategory === category
                            ? `${colors.border} ${colors.bg} bg-opacity-80`
                            : `${colors.border}`
                        }`}>
                          {selectedCategory === category && (
                            <svg className="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Available Roles List - Full Height */}
                      <div className="space-y-2 h-56 overflow-y-auto">
                        <h4 className={`text-lg font-semibold mb-4 ${colors.icon}`}>
                          Available Roles ({rolesList.length})
                        </h4>
                        {rolesList.map((role, index) => (
                          <div 
                            key={role} 
                            className={`text-sm px-4 py-3 rounded-lg transition-all duration-200 ${
                              selectedCategory === category 
                                ? `${colors.bg} bg-opacity-60 text-gray-100` 
                                : `${colors.bg} bg-opacity-40 text-gray-200`
                            }`}
                          >
                            {role}
                          </div>
                        ))}
                      </div>
                      
                      {/* Click instruction */}
                      <div className="mt-4">
                        <div className={`text-xs px-3 py-2 rounded-full text-center ${
                          selectedCategory === category 
                            ? `${colors.bg} bg-opacity-60 text-white` 
                            : `${colors.bg} bg-opacity-40 text-gray-200`
                        }`}>
                          Click to select
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!selectedCategory}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              selectedCategory
                ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Job Description
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 3: Job Description Component
function Step3JobDescription({ onNext, onPrev, selectedCategory, availableRoles, jobDescription, onJobDescriptionChange, selectedSampleRole, onSampleRoleSelect }) {
  const roles = selectedCategory ? availableRoles[selectedCategory] || {} : {};
  const rolesList = Object.keys(roles);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' or 'sample'
  
  // Get category display name
  const getCategoryDisplayName = (category) => {
    if (category === "Software Development (SDE)") return "SDE";
    return category;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="max-w-6xl mx-auto px-6 py-8 flex-1">
        <StepIndicator currentStep={3} />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Add Job Description</h1>
          <p className="text-gray-400">
            Paste a job description or select from sample roles in 
            <span className="text-blue-400 font-medium">{getCategoryDisplayName(selectedCategory)}</span>
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl border border-gray-700 mb-8">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-600">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'text-white border-b-2 border-blue-500 bg-gray-700 bg-opacity-50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PASTE A JOB DESCRIPTION BELOW
              </div>
            </button>
            <div className="w-px bg-gray-600"></div>
            <button
              onClick={() => setActiveTab('sample')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'sample'
                  ? 'text-white border-b-2 border-blue-500 bg-gray-700 bg-opacity-50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-blue-400">OR</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                USE A SAMPLE JOB DESCRIPTION
              </div>
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'paste' ? (
              /* Paste Job Description */
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Description
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Paste the complete job description from the job posting
                  </p>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => onJobDescriptionChange(e.target.value)}
                  placeholder="Job Description...\n\nExample:\nWe are looking for a skilled Frontend Developer to join our team...\n\nRequirements:\n• 3+ years of experience with React\n• Strong knowledge of JavaScript, HTML, CSS\n• Experience with modern build tools"
                  className="w-full h-80 p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                {jobDescription && (
                  <div className="mt-2 text-xs text-gray-400">
                    {jobDescription.length} characters
                  </div>
                )}
              </div>
            ) : (
              /* Sample Job Descriptions */
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Available Roles in {getCategoryDisplayName(selectedCategory)}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Select a role to use its job description as a template for analysis
                  </p>
                </div>
                
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {rolesList.map((role) => {
                    const roleData = roles[role];
                    return (
                      <div
                        key={role}
                        onClick={() => onSampleRoleSelect(role)}
                        className={`p-5 rounded-lg border cursor-pointer transition-all duration-200 group ${
                          selectedSampleRole === role
                            ? 'border-blue-500 bg-blue-900 bg-opacity-30 shadow-lg'
                            : 'border-gray-600 bg-gray-700 bg-opacity-50 hover:border-gray-500 hover:bg-gray-600 hover:bg-opacity-50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className={`font-semibold transition-colors ${
                                selectedSampleRole === role ? 'text-white' : 'text-gray-200 group-hover:text-white'
                              }`}>
                                {role}
                              </h4>
                              {selectedSampleRole === role && (
                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                                  Selected
                                </span>
                              )}
                            </div>
                            
                            <p className={`text-sm mb-3 transition-colors ${
                              selectedSampleRole === role ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-300'
                            }`}>
                              {roleData.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {roleData.skills.slice(0, 6).map((skill) => (
                                <span key={skill} className={`px-2 py-1 rounded text-xs transition-colors ${
                                  selectedSampleRole === role 
                                    ? 'bg-blue-800 bg-opacity-50 text-blue-200' 
                                    : 'bg-gray-600 text-gray-300 group-hover:bg-gray-500'
                                }`}>
                                  {skill}
                                </span>
                              ))}
                              {roleData.skills.length > 6 && (
                                <span className={`px-2 py-1 rounded text-xs transition-colors ${
                                  selectedSampleRole === role 
                                    ? 'bg-blue-800 bg-opacity-30 text-blue-300' 
                                    : 'bg-gray-600 text-gray-400 group-hover:bg-gray-500'
                                }`}>
                                  +{roleData.skills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0 ml-4 ${
                            selectedSampleRole === role
                              ? 'bg-blue-500 border-blue-500 shadow-lg'
                              : 'border-gray-400 group-hover:border-gray-300'
                          }`}>
                            {selectedSampleRole === role && (
                              <svg className="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {rolesList.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      No sample roles available for this category
                    </div>
                    <p className="text-sm text-gray-500">Please use the "Paste Job Description" option instead</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!jobDescription && !selectedSampleRole}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              (jobDescription || selectedSampleRole)
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            SCAN
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 4: Loading and Results Component
function Step4LoadingResults({ onRestart, analysisData }) {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (analysisData) {
      // Simulate some processing time for visual effect
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [analysisData]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-8 flex-1">
          <StepIndicator currentStep={4} />
          
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700 text-center">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
              <h2 className="text-3xl font-bold text-white mb-4">Scanning your resume...</h2>
              <p className="text-gray-400 mb-8">Loading your results...</p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-md">
                <div className="bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show results when loading is complete
  return (
    <Results data={analysisData} onRestart={onRestart} />
  );
}

// Main Multi-Step Analysis Component
export default function MultiStepAnalysis({ onRestart }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableRoles, setAvailableRoles] = useState({});
  const [jobDescription, setJobDescription] = useState('');
  const [selectedSampleRole, setSelectedSampleRole] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Load available roles on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const roles = await api.getRoles();
        setAvailableRoles(roles);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadRoles();
  }, []);
  
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };
  
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSampleRole(''); // Reset sample role when category changes
    setJobDescription(''); // Reset job description when category changes
  };
  
  const handleSampleRoleSelect = (role) => {
    setSelectedSampleRole(role);
    // When a sample role is selected, clear custom job description
    setJobDescription('');
  };
  
  const handleJobDescriptionChange = (description) => {
    setJobDescription(description);
    // When custom job description is entered, clear sample role selection
    if (description.trim()) {
      setSelectedSampleRole('');
    }
  };
  
  const performAnalysis = async () => {
    if (!selectedFile || !selectedCategory) return;
    
    setLoading(true);
    setCurrentStep(4);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);
      
      // Use sample role description or custom job description
      let finalJobDescription = jobDescription;
      if (selectedSampleRole && !jobDescription) {
        const roleData = availableRoles[selectedCategory]?.[selectedSampleRole];
        finalJobDescription = roleData?.description || '';
      }
      
      if (finalJobDescription) {
        formData.append('job_description', finalJobDescription);
      }
      
      const result = await api.uploadAndAnalyze(formData);
      setAnalysisData(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      // TODO: Handle error state
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    if (currentStep < 4) {
      if (currentStep === 3) {
        // Trigger analysis when moving to step 4
        performAnalysis();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const restartAnalysis = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setSelectedCategory('');
    setJobDescription('');
    setSelectedSampleRole('');
    setAnalysisData(null);
    onRestart();
  };
  
  switch (currentStep) {
    case 1:
      return (
        <Step1ResumeUpload 
          onNext={nextStep} 
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      );
    case 2:
      return (
        <Step2CategorySelection 
          onNext={nextStep}
          onPrev={prevStep}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          availableRoles={availableRoles}
        />
      );
    case 3:
      return (
        <Step3JobDescription 
          onNext={nextStep}
          onPrev={prevStep}
          selectedCategory={selectedCategory}
          availableRoles={availableRoles}
          jobDescription={jobDescription}
          onJobDescriptionChange={handleJobDescriptionChange}
          selectedSampleRole={selectedSampleRole}
          onSampleRoleSelect={handleSampleRoleSelect}
        />
      );
    case 4:
      return (
        <Step4LoadingResults 
          onRestart={restartAnalysis}
          analysisData={analysisData}
        />
      );
    default:
      return null;
  }
}

// Keep the original Results component for the final results display
export function Results({ data, onRestart }) {
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