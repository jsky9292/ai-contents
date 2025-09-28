import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface VideoDisplayProps {
  videoBlob: Blob | null;
  isLoading: boolean;
  loadingMessage: string;
}

const VideoPlaceholder: React.FC = () => (
    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55a2.25 2.25 0 01.95 1.95v.1A2.25 2.25 0 0118.25 14H15M3 8v8a2 2 0 002 2h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 001.414 0l2.414-2.414A1 1 0 0117.414 18H19a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="font-semibold text-gray-700">생성된 비디오가 여기에 표시됩니다</p>
        <p className="text-sm text-gray-500">프롬프트를 입력하고 '생성'을 클릭하세요.</p>
    </div>
);


const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoBlob, isLoading, loadingMessage }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setVideoUrl(null);
      };
    }
  }, [videoBlob]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-4 transition-all duration-300 min-h-[300px] lg:min-h-0">
      {isLoading ? (
        <div className="flex flex-col items-center text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 animate-pulse">{loadingMessage}</p>
        </div>
      ) : videoUrl ? (
        <div className="relative group w-full h-full flex items-center justify-center">
          <video src={videoUrl} controls className="max-w-full max-h-full object-contain rounded-lg" />
          <button 
            onClick={handleDownload}
            className="absolute top-4 right-4 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-blue-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Download video"
            title="비디오 다운로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      ) : (
        <VideoPlaceholder />
      )}
    </div>
  );
};

export default VideoDisplay;