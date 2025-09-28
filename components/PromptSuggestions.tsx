import React from 'react';

interface PromptSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
  suggestions: { title: string; prompt: string }[];
  disabled: boolean;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectSuggestion, suggestions, disabled }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">프롬프트 예시</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion.prompt)}
            disabled={disabled}
            className="text-left p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <p className="text-sm font-medium text-gray-800">{suggestion.title}</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{suggestion.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;