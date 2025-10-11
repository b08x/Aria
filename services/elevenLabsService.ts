// This service now uses the browser's native Web Speech API for Text-to-Speech.
// It does not require any API keys or external services.

// Keep track of the current utterance to manage event listeners properly.
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks the given text using the browser's TTS engine.
 * @param text The text to speak.
 * @param onStart Callback fired when speech begins.
 * @param onEnd Callback fired when speech finishes.
 * @param onError Callback fired on a speech error.
 */
export const playTTS = (
    text: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (event: SpeechSynthesisErrorEvent) => void
) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error("Browser does not support the Web Speech API.");
        // Fix: The SpeechSynthesisErrorEvent constructor requires an 'utterance' property.
        // We must check if the necessary constructors are available before creating the event.
        if (typeof SpeechSynthesisUtterance !== 'undefined' && typeof SpeechSynthesisErrorEvent !== 'undefined') {
            const utterance = new SpeechSynthesisUtterance(text);
            onError(new SpeechSynthesisErrorEvent('error', { error: 'synthesis-unavailable', utterance }));
        }
        return;
    }

    // Ensure any previous speech is stopped before starting a new one.
    stopTTS();

    currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Assign event handlers
    currentUtterance.onstart = onStart;
    currentUtterance.onend = onEnd;
    currentUtterance.onerror = onError;

    window.speechSynthesis.speak(currentUtterance);
};

/**
 * Stops any currently active speech synthesis.
 */
export const stopTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        // By removing listeners before cancelling, we prevent the 'onend' event
        // from firing, which would incorrectly update the application state.
        if (currentUtterance) {
            currentUtterance.onstart = null;
            currentUtterance.onend = null;
            currentUtterance.onerror = null;
            currentUtterance = null;
        }
        window.speechSynthesis.cancel();
    }
};
