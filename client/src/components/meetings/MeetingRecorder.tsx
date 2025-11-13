import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MeetingRecorderProps {
  householdId: number;
  clientName: string;
  onNotesGenerated?: (notes: string) => void;
}

export default function MeetingRecorder({ householdId, clientName, onNotesGenerated }: MeetingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const transcribeMutation = trpc.meetings.transcribeAndGenerateNotes.useMutation();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success("Recording stopped");
    }
  };

  const processRecording = async () => {
    if (!audioBlob) {
      toast.error("No recording available");
      return;
    }

    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        try {
          const result = await transcribeMutation.mutateAsync({
            householdId,
            audioData: base64Audio,
            clientName,
          });

          setGeneratedNotes(result.notes);
          if (onNotesGenerated) {
            onNotesGenerated(result.notes);
          }

          toast.success("Meeting notes generated successfully!");
        } catch (error) {
          console.error("Error processing recording:", error);
          toast.error("Failed to generate meeting notes");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error("Error processing recording:", error);
      toast.error("Failed to process recording");
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Meeting Recorder
        </CardTitle>
        <CardDescription>
          Record your meeting and automatically generate structured notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-4">
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2" />
                Recording
              </Badge>
            )}
            {audioBlob && !isRecording && (
              <Badge variant="default">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ready to Process
              </Badge>
            )}
            <span className="text-2xl font-mono font-bold">
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className="flex gap-2">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button 
                  onClick={() => {
                    setAudioBlob(null);
                    setRecordingTime(0);
                    setGeneratedNotes("");
                  }} 
                  variant="outline"
                >
                  Clear
                </Button>
                <Button 
                  onClick={processRecording} 
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Generate Notes"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Generated Notes */}
        {generatedNotes && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Generated Meeting Notes</h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedNotes);
                  toast.success("Notes copied to clipboard");
                }}
              >
                Copy Notes
              </Button>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg whitespace-pre-wrap text-sm">
              {generatedNotes}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !audioBlob && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Click "Start Recording" to begin capturing your meeting. The AI will automatically transcribe and generate structured notes including key discussion points and action items.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
