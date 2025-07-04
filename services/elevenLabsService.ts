import { TTSPlayback } from "../types";

const API_BASE_URL = "https://api.elevenlabs.io/v1";

export const playTTS = async (
    text: string, 
    voiceId: string, 
    apiKey: string
): Promise<HTMLAudioElement> => {
    if (!apiKey) {
        throw new Error("ElevenLabs API key is not set.");
    }
    if (!voiceId) {
        throw new Error("ElevenLabs voice ID is not set.");
    }

    const url = `${API_BASE_URL}/text-to-speech/${voiceId}/stream`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || "Failed to fetch TTS audio.");
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Audio playback failed:", e));

    return audio;
};

export const stopTTS = (playback: TTSPlayback) => {
    if (playback.audio) {
        playback.audio.pause();
        playback.audio.src = ''; // Release the object URL
    }
};
