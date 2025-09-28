import React from 'react';
import { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
}

const orderedRatioOptions = [
    { value: AspectRatio.SQUARE, label: "정방형 1:1" }, // 1:1
    { value: AspectRatio.LANDSCAPE, label: "가로 4:3" }, // 4:3
    { value: AspectRatio.WIDE, label: "와이드 16:9" }, // 16:9
    { value: AspectRatio.PORTRAIT, label: "세로 3:4" }, // 3:4
    { value: AspectRatio.TALL, label: "세로 9:16" }, // 9:16
];

const getAspectRatioBoxStyle = (ratio: AspectRatio): React.CSSProperties => {
    const maxSize = 24; // max dimension in pixels
    switch (ratio) {
        case AspectRatio.SQUARE:    // 1:1
            return { width: `${maxSize}px`, height: `${maxSize}px` };
        case AspectRatio.WIDE:      // 16:9
            return { width: `${maxSize}px`, height: `${maxSize * 9 / 16}px` };
        case AspectRatio.TALL:      // 9:16
            return { width: `${maxSize * 9 / 16}px`, height: `${maxSize}px` };
        case AspectRatio.LANDSCAPE: // 4:3
            return { width: `${maxSize}px`, height: `${maxSize * 3 / 4}px` };
        case AspectRatio.PORTRAIT:  // 3:4
            return { width: `${maxSize * 3 / 4}px`, height: `${maxSize}px` };
        default:
            return {};
    }
};


const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        이미지 비율
      </label>
      <div className="flex flex-wrap gap-2">
        {orderedRatioOptions.map((option) => (
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

export default AspectRatioSelector;