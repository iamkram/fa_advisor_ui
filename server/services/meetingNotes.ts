/**
 * Meeting Notes Service
 * 
 * Transcribes meeting audio using Whisper API and generates
 * structured meeting notes using Claude.
 */

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
}

interface MeetingNotes {
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  nextSteps: string[];
  notes: string;
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioBase64: string): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Convert base64 to buffer
    const base64Data = audioBase64.split(',')[1] || audioBase64;
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Create form data
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'meeting.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    const result = await response.json();
    
    return {
      text: result.text,
      language: result.language || 'en',
      duration: result.duration || 0,
    };
  } catch (error) {
    console.error('[MeetingNotes] Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error}`);
  }
}

/**
 * Generate structured meeting notes from transcript using Claude
 */
export async function generateMeetingNotes(
  transcript: string,
  clientName: string
): Promise<MeetingNotes> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  try {
    const prompt = `You are an expert financial advisor assistant. Analyze the following meeting transcript and generate structured meeting notes.

Client: ${clientName}

Transcript:
${transcript}

Please provide:
1. A concise summary (2-3 sentences)
2. Key discussion points (bullet points)
3. Action items with owners
4. Next steps and follow-ups

Format the output as a professional meeting note that the advisor can save and reference later.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const result = await response.json();
    const notesText = result.content[0].text;

    // Parse the structured notes
    const summaryMatch = notesText.match(/Summary:?\s*\n([\s\S]*?)(?=\n\n|Key Points|$)/);
    const keyPointsMatch = notesText.match(/Key (?:Discussion )?Points:?\s*\n([\s\S]*?)(?=\n\n|Action Items|$)/);
    const actionItemsMatch = notesText.match(/Action Items:?\s*\n([\s\S]*?)(?=\n\n|Next Steps|$)/);
    const nextStepsMatch = notesText.match(/Next Steps:?\s*\n([\s\S]*?)$/);

    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const keyPoints = keyPointsMatch 
      ? keyPointsMatch[1].split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•')).map((line: string) => line.replace(/^[-•]\s*/, '').trim())
      : [];
    const actionItems = actionItemsMatch
      ? actionItemsMatch[1].split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•')).map((line: string) => line.replace(/^[-•]\s*/, '').trim())
      : [];
    const nextSteps = nextStepsMatch
      ? nextStepsMatch[1].split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•')).map((line: string) => line.replace(/^[-•]\s*/, '').trim())
      : [];

    return {
      transcript,
      summary,
      keyPoints,
      actionItems,
      nextSteps,
      notes: notesText,
    };
  } catch (error) {
    console.error('[MeetingNotes] Note generation error:', error);
    throw new Error(`Failed to generate meeting notes: ${error}`);
  }
}

/**
 * Complete pipeline: transcribe audio and generate structured notes
 */
export async function transcribeAndGenerateNotes(
  audioBase64: string,
  clientName: string
): Promise<MeetingNotes> {
  console.log('[MeetingNotes] Starting transcription and note generation');
  
  // Step 1: Transcribe audio
  const transcription = await transcribeAudio(audioBase64);
  console.log(`[MeetingNotes] Transcription complete: ${transcription.text.length} characters`);
  
  // Step 2: Generate structured notes
  const notes = await generateMeetingNotes(transcription.text, clientName);
  console.log('[MeetingNotes] Note generation complete');
  
  return notes;
}
