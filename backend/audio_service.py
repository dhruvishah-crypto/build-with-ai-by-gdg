import os
import logging
from typing import Dict, Any

logger = logging.getLogger("audio_service")

# GCP Speech-to-Text and Translate imports
speech_client = None
translate_client = None

google_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
google_creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")

if google_creds or google_creds_json:
    try:
        from google.cloud import speech
        from google.cloud import translate_v2 as translate
        from google.oauth2 import service_account
        
        creds = None
        if google_creds_json:
            import json
            creds_dict = json.loads(google_creds_json)
            creds = service_account.Credentials.from_service_account_info(creds_dict)
            
        speech_client = speech.SpeechClient(credentials=creds)
        translate_client = translate.Client(credentials=creds)
        logger.info("Initialized Google Cloud Speech and Translation clients.")
    except Exception as e:
        logger.warning(f"Could not initialize GCP Speech/Translate clients: {e}. Falling back to simulation.")
else:
    logger.info("Using local Speech and Translation simulations.")

# Simulation mapping for regional voices
SIMULATED_RESPONSES = [
    {
        "detected_language": "hi",
        "original_transcript": "हमारे यहाँ पेरासिटामोल खत्म हो गया है और आज दो डॉक्टर अनुपस्थित हैं।",
        "translated_text": "We have run out of paracetamol here and two doctors are absent today.",
        "confidence": 0.94
    },
    {
        "detected_language": "te",
        "original_transcript": "మాకు వెంటనే ఇన్సులిన్ మరియు ఒఆర్ఎస్ ప్యాకెట్లు కావాలి, స్టాక్ తక్కువగా ఉంది.",
        "translated_text": "We need insulin and ORS packets immediately, the stock is running low.",
        "confidence": 0.91
    },
    {
        "detected_language": "hi",
        "original_transcript": "अस्पताल में सभी बेड भर चुके हैं, नए मरीजों के लिए जगह नहीं है।",
        "translated_text": "All beds in the hospital are full, there is no space for new patients.",
        "confidence": 0.96
    }
]

def transcribe_and_translate_audio(audio_content: bytes, filename: str = "") -> Dict[str, Any]:
    """
    Transcribes audio bytes, detects language, and translates to English.
    """
    # If GCP clients are active
    if speech_client and translate_client:
        try:
            # 1. Speech to Text
            audio = speech.RecognitionAudio(content=audio_content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="hi-IN", # default, can list alternative codes
                alternative_language_codes=["te-IN", "ta-IN", "en-US"]
            )
            
            response = speech_client.recognize(config=config, audio=audio)
            
            if not response.results:
                return {"error": "No speech detected in audio."}
                
            transcript = response.results[0].alternatives[0].transcript
            confidence = response.results[0].alternatives[0].confidence
            
            # 2. Translation to English
            translation = translate_client.translate(transcript, target_language="en")
            
            return {
                "detected_language": translation.get("detected_source_language", "unknown"),
                "original_transcript": transcript,
                "translated_text": translation.get("translatedText", transcript),
                "confidence": round(confidence, 2)
            }
        except Exception as e:
            logger.error(f"Error calling Cloud Speech/Translate API: {e}. Falling back to simulation.")
            
    # Fallback simulation
    # We pick a simulation based on the length of filename or audio_content
    index = len(audio_content) % len(SIMULATED_RESPONSES)
    simulated = SIMULATED_RESPONSES[index]
    logger.info(f"Simulating audio transcription for regional note (mocking language '{simulated['detected_language']}').")
    return simulated
