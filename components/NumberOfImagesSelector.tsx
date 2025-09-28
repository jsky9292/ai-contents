import React from 'react';

interface NumberOfImagesSelectorProps {
  selectedNumber: number;
  onNumberChange: (num: number) => void;
  disabled: boolean;
}

const numberOptions = [1, 2, 3, 4];

const NumberOfImagesSelector: React.FC<NumberOfImagesSelectorProps> = ({ selectedNumber, onNumberChange, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        이미지 개수
      </label>
      <div className="grid grid-cols-4 gap-2">
        {numberOptions.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onNumberChange(num)}
            disabled={disabled}
            className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedNumber === num
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="font-bold text-lg">{num}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NumberOfImagesSelector;