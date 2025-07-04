
import React from 'react';
import { AcademicCapIcon } from './icons/AcademicCapIcon';

interface LandingPageProps {
  onStart: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-surface/50 p-6 rounded-lg border border-secondary/50">
        <div className="flex items-center gap-4 mb-3">
            <div className="bg-accent/20 p-2 rounded-full">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-primary">{title}</h3>
        </div>
        <p className="text-primary/80">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto text-center">
        
        <header className="mb-12">
            <div className="inline-flex flex-col items-center gap-2 mb-4">
                <div className="flex items-center gap-4">
                    <AcademicCapIcon className="w-16 h-16 text-accent" />
                    <h1 className="text-6xl font-bold tracking-tighter">ARIA</h1>
                </div>
                <p className="text-2xl text-primary/80 font-light">Adaptive Research & Information Assistant</p>
            </div>
            <p className="text-xl text-primary/70 max-w-3xl mx-auto">
                ARIA is an interactive AI assistant designed for structured learning. It personalizes your experience, generates dynamic curricula, and helps you synthesize information effectively.
            </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 text-left mb-12">
            <FeatureCard icon={<SparklesIcon className="w-6 h-6 text-accent"/>} title="Guided Onboarding">
                A step-by-step wizard helps you choose your AI engine and personalize your assistant's style before you even start.
            </FeatureCard>
            <FeatureCard icon={<DocumentTextIcon className="w-6 h-6 text-accent"/>} title="Dynamic Curriculum">
                Automatically generate a structured lesson plan, discover related topics for deeper context, and test your knowledge with AI-generated quizzes.
            </FeatureCard>
             <FeatureCard icon={<WrenchScrewdriverIcon className="w-6 h-6 text-accent"/>} title="SFL-Powered Personalization">
                Leverage the power of Systemic Functional Linguistics to meticulously control the AI's persona, tone, and response format.
            </FeatureCard>
            <FeatureCard icon={<SparklesIcon className="w-6 h-6 text-accent"/>} title="Interactive Content">
                Elaborate on concepts, generate diagrams instantly from text, and interact with a rich, responsive chat interface.
            </FeatureCard>
        </div>

        <button 
            onClick={onStart} 
            className="px-8 py-4 bg-accent text-background text-lg font-semibold rounded-lg hover:bg-accent-dark transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-accent/50"
        >
            Get Started
        </button>

      </div>
    </div>
  );
};

export default LandingPage;

// Add new icons used on this page
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.188-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.188a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.188.398a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 00-4.773-4.773L6.75 10.5M11.42 15.17L6.75 10.5m4.67 4.67L6.75 10.5" />
    </svg>
);