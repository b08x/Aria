
import React, { useState } from 'react';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { BotIcon } from './icons/BotIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface TutorialProps {
  onClose: () => void;
}

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.188-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.188a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.188.398a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const tutorialSteps = [
  {
    icon: <AcademicCapIcon className="w-16 h-16 text-accent" />,
    title: 'Welcome to ARIA!',
    description: 'This quick tour will guide you through the main features to get you started on your learning journey.',
  },
  {
    icon: <BookOpenIcon className="w-16 h-16 text-accent" />,
    title: '1. Your Personal Curriculum',
    description: 'The "Learn" panel on the left is your mission control. Here you\'ll find your generated lesson plan and related topics. Click any item to start a lesson.',
  },
  {
    icon: <BotIcon className="w-16 h-16 text-accent" />,
    title: '2. Interactive Chat',
    description: 'The central area is your main chat interface. Ask questions, request explanations, and generate diagrams or images directly from the conversation.',
  },
  {
    icon: <MagnifyingGlassIcon className="w-16 h-16 text-accent" />,
    title: '3. Automatic Research',
    description: 'When you start a lesson, the "Research" panel on the right automatically fills with relevant web resources, giving you context and deeper insights.',
  },
   {
    icon: <SparklesIcon className="w-16 h-16 text-accent" />,
    title: 'You\'re All Set!',
    description: 'You\'re ready to start learning with your new AI assistant. Enjoy your personalized experience!',
  },
];

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const { icon, title, description } = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div
        className="bg-surface rounded-lg shadow-2xl border border-muted w-full max-w-lg flex flex-col max-h-[90vh] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-4 -mr-4">
           <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-secondary hover:text-primary"
            >
              Skip
            </button>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center">
            <div className="mb-6">{icon}</div>
            <h2 className="text-3xl font-bold text-primary mb-4">{title}</h2>
            <p className="text-secondary text-lg leading-relaxed">{description}</p>
        </div>
        
        <footer className="mt-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep ? 'bg-accent' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-muted/50 text-primary font-semibold rounded-lg hover:bg-muted disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-accent-dark text-background font-semibold rounded-lg hover:bg-accent"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Tutorial;
