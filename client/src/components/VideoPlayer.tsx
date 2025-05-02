import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Lesson } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  MinusCircle,
  CheckCircle,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  lesson: Lesson;
  courseId: number;
  nextLesson?: Lesson;
  previousLesson?: Lesson;
  onLessonChange?: (lessonId: number) => void;
}

const VideoPlayer = ({ lesson, courseId, nextLesson, previousLesson, onLessonChange }: VideoPlayerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<ReactPlayer>(null);
  
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Mutation for updating lesson progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ completed }: { completed: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      return apiRequest("PUT", `/api/enrollments/${courseId}/progress`, {
        lessonId: lesson.id,
        completed
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch the enrollment data
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
      
      if (!isCompleted) {
        toast({
          title: "Progress saved",
          description: "Your progress has been updated.",
        });
        setIsCompleted(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle toggling play/pause
  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  // Handle playback progress
  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    // Update progress state
    setProgress(state.playedSeconds);

    // Mark as completed if user watched most of the video (90%)
    if (state.played > 0.9 && !isCompleted && user) {
      updateProgressMutation.mutate({ completed: true });
    }
  };

  // Handle video duration loaded
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value[0], 'seconds');
    }
  };

  // Handle mute toggle
  const handleMute = () => {
    setMuted(!muted);
    if (muted) {
      setVolume(0.5); // Restore previous volume
    }
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen().catch(err => {
          toast({
            title: "Error",
            description: `Fullscreen not available: ${err.message}`,
            variant: "destructive",
          });
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Mark lesson as complete
  const markAsComplete = () => {
    updateProgressMutation.mutate({ completed: true });
  };

  // Navigate to next or previous lesson
  const handleNavigate = (lessonId: number) => {
    if (onLessonChange) {
      onLessonChange(lessonId);
    }
  };

  return (
    <Card className="bg-black text-white overflow-hidden">
      <div ref={playerContainerRef} className="relative">
        <ReactPlayer
          ref={playerRef}
          url={lesson.videoUrl}
          width="100%"
          height="auto"
          style={{ aspectRatio: '16/9' }}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          controls={false}
          pip
          className="react-player"
        />
        
        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Slider
                value={[progress]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="w-full cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white">
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                
                {previousLesson && (
                  <Button variant="ghost" size="icon" onClick={() => handleNavigate(previousLesson.id)} className="text-white">
                    <SkipBack size={20} />
                  </Button>
                )}
                
                {nextLesson && (
                  <Button variant="ghost" size="icon" onClick={() => handleNavigate(nextLesson.id)} className="text-white">
                    <SkipForward size={20} />
                  </Button>
                )}
                
                <span className="text-xs md:text-sm text-white">
                  {formatTime(progress)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex items-center w-28 space-x-2">
                  <Button variant="ghost" size="icon" onClick={handleMute} className="text-white">
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
                
                <Button variant="ghost" size="icon" onClick={handleFullscreen} className="text-white">
                  <Maximize size={20} />
                </Button>
                
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAsComplete}
                    disabled={isCompleted || updateProgressMutation.isPending}
                    className="text-white hidden md:flex"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        Completed
                      </>
                    ) : (
                      <>
                        <MinusCircle size={16} className="mr-1" />
                        Mark as complete
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 bg-white text-gray-900">
        <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
        <p className="text-gray-600 mb-4">{lesson.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Duration: {lesson.durationMinutes} minutes</div>
          
          {user && (
            <Button
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              onClick={markAsComplete}
              disabled={isCompleted || updateProgressMutation.isPending}
              className="md:hidden"
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={16} className="mr-1 text-green-500" />
                  Completed
                </>
              ) : (
                <>
                  <MinusCircle size={16} className="mr-1" />
                  Mark as complete
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
