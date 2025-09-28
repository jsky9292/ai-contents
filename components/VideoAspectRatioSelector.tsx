import React from 'react';

type VideoAspectRatio = '16:9' | '9:16';

interface VideoAspectRatioSelectorProps {
  selectedRatio: VideoAspectRatio;
  onRatioChange: (ratio: VideoAspectRatio) => void;
}

const ratioOptions: { value: VideoAspectRatio; label: string }[] = [
    { value: '16:9', label: "와이드스크린" },
    { value: '9:16', label: "세로 모드" },
];

const getAspectRatioBoxStyle = (ratio: VideoAspectRatio): React.CSSProperties => {
    const maxSize = 24; // max dimension in pixels
    switch (ratio) {
        case '16:9':
            return { width: `${maxSize}px`, height: `${maxSize * 9 / 16}px` };
        case '9:16':
            return { width: `${maxSize * 9 / 16}px`, height: `${maxSize}px` };
        default:
            return {};
    }
};

const VideoAspectRatioSelector: React.FC<VideoAspectRatioSelectorProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        비디오 비율
      </label>
      <div className="flex flex-wrap gap-2">
        {ratioOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onRatioChange(option.value)}
            className={`flex-1 min-w-[75px] flex flex-col items-center justify-center gap-y-1.5 p-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 ${
              selectedRatio === option.value
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-600'
            }`}
          >
            <div className="h-8 flex items-center justify-center" aria-hidden="true">
              <div 
                className="bg-current opacity-70 rounded-sm"
                style={getAspectRatioBoxStyle(option.value)}
              ></div>
            </div>
            <span className="text-xs font-semibold">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoAspectRatioSelector;