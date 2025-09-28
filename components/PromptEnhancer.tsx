import React, { useState } from 'react';

interface PromptEnhancerProps {
  prompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  mode: 'generate' | 'edit';
  disabled?: boolean;
}

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  prompt,
  onPromptUpdate,
  mode,
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 나노바나나 스타일의 프롬프트 개선 제안
  const generateSuggestions = (): string[] => {
    if (!prompt) return [];

    const suggestions: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // 기본 품질 개선 제안
    if (!lowerPrompt.includes('quality') && !lowerPrompt.includes('detailed')) {
      suggestions.push(`${prompt}, ultra detailed, high quality, 8k resolution`);
    }

    // 조명 개선 제안
    if (!lowerPrompt.includes('lighting') && !lowerPrompt.includes('light')) {
      suggestions.push(`${prompt}, perfect lighting, golden hour, cinematic lighting`);
    }

    // 스타일별 제안
    if (lowerPrompt.includes('portrait') || lowerPrompt.includes('사람') || lowerPrompt.includes('인물')) {
      suggestions.push(`${prompt}, professional portrait, bokeh background, sharp focus on face`);
    }

    if (lowerPrompt.includes('landscape') || lowerPrompt.includes('풍경')) {
      suggestions.push(`${prompt}, wide angle, dramatic sky, volumetric fog, epic scenery`);
    }

    if (lowerPrompt.includes('food') || lowerPrompt.includes('음식')) {
      suggestions.push(`${prompt}, food photography, appetizing, macro lens, soft lighting`);
    }

    if (lowerPrompt.includes('anime') || lowerPrompt.includes('만화')) {
      suggestions.push(`${prompt}, anime style, cel shading, vibrant colors, studio quality`);
    }

    // 편집 모드 전용 제안
    if (mode === 'edit') {
      if (lowerPrompt.includes('합성') || lowerPrompt.includes('combine')) {
        suggestions.push(`${prompt}, seamlessly blend, match lighting and perspective, natural integration`);
      }
      if (lowerPrompt.includes('배경') || lowerPrompt.includes('background')) {
        suggestions.push(`${prompt}, preserve subject, professional background replacement, perfect edges`);
      }
    }

    // 캐릭터 일관성 제안
    if (lowerPrompt.includes('character') || lowerPrompt.includes('캐릭터')) {
      suggestions.push(`${prompt}, consistent character features, maintain identity, same person`);
    }

    return suggestions.slice(0, 3); // 최대 3개 제안
  };

  const suggestions = generateSuggestions();

  const handleSuggestionClick = (suggestion: string) => {
    onPromptUpdate(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          프롬프트 개선 도우미
        </label>
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {showSuggestions ? '제안 숨기기' : '제안 보기'}
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600 mb-2">
            💡 프롬프트를 개선하여 더 나은 결과를 얻으세요:
          </p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              className="w-full text-left p-2 bg-white rounded border border-gray-200 hover:bg-blue-100 hover:border-blue-300 transition-colors text-sm disabled:opacity-50"
            >
              <span className="text-blue-600 font-medium mr-2">제안 {index + 1}:</span>
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {prompt && suggestions.length === 0 && (
        <div className="text-xs text-green-600 mt-1">
          ✨ 프롬프트가 이미 잘 작성되었습니다!
        </div>
      )}
    </div>
  );
};

export default PromptEnhancer;