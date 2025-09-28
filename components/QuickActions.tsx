import React, { useState } from 'react';

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
  disabled?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect, disabled = false }) => {
  console.log('QuickActions component rendered!');
  const [showMore, setShowMore] = useState(false);

  const quickActions = [
    {
      id: 'remove-bg',
      name: '배경 제거',
      description: '이미지의 배경을 제거하고 투명하게 만듭니다',
      icon: '🎨',
      prompt: '메인 피사체만 남기고 배경을 100% 투명하게 제거해주세요. 배경은 완전히 비어있어야 하고(fully transparent alpha channel), 어떤 색상도 없어야 합니다. 피사체 가장자리를 정교하게 추출하고, 머리카락이나 세밀한 부분도 자연스럽게 처리해주세요. 결과물은 투명 배경의 PNG 형식이어야 합니다.'
    },
    {
      id: 'restore',
      name: '복원',
      description: '오래된 사진을 고품질로 복원합니다',
      icon: '🔧',
      prompt: '이 이미지를 고품질로 복원해주세요. 스크래치, 노이즈, 손상된 부분을 모두 수정하고 선명도를 높여주세요.'
    },
    {
      id: 'colorize',
      name: '컬러화',
      description: '흑백 이미지에 자연스러운 색상을 입힙니다',
      icon: '🌈',
      prompt: '이 흑백 이미지에 자연스럽고 생동감 있는 색상을 입혀주세요. 현실적인 색감으로 컬러화해주세요.'
    },
    {
      id: 'upscale',
      name: '고화질 향상',
      description: '이미지를 고화질로 업스케일하고 디테일을 개선합니다',
      icon: '⬆️',
      prompt: '이 이미지를 초고해상도로 업스케일해주세요. 픽셀을 늘리는 것이 아니라 AI로 디테일을 재생성하여 더 선명하고 세밀하게 만들어주세요. 흐릿한 부분은 선명하게, 노이즈는 제거하고, 텍스처와 디테일을 향상시켜 4K/8K 품질로 만들어주세요.'
    },
    {
      id: 'sketch-to-color',
      name: '채색하기',
      description: '스케치나 라인아트에 색상을 입힙니다',
      icon: '🖌️',
      prompt: '이 스케치나 선화에 생동감 있는 색상을 입혀서 완성된 컬러 일러스트로 만들어주세요.'
    },
    {
      id: 'to-figure',
      name: '피규어 스타일',
      description: '이미지를 피규어 디오라마 스타일로 변환',
      icon: '🎭',
      prompt: '이 장면 전체를 정교한 플라스틱 장난감 피규어 디오라마 사진처럼 재현해주세요.'
    },
    {
      id: 'to-pixelart',
      name: '픽셀 아트',
      description: '16비트 픽셀 아트 스타일로 변환',
      icon: '👾',
      prompt: '이 이미지 전체를 구성을 유지하면서 디테일한 16비트 픽셀 아트 스타일로 변환해주세요.'
    },
    {
      id: 'to-realistic',
      name: '실사화',
      description: '일러스트를 사실적인 사진으로 변환',
      icon: '📸',
      prompt: '이 일러스트를 자연스러운 조명과 질감을 가진 사실적인 사진으로 변환해주세요.'
    },
    {
      id: 'to-sticker',
      name: '스티커',
      description: '귀여운 스티커 스타일로 변환',
      icon: '⭐',
      prompt: '주요 피사체를 다이컷 스티커로 만들어주세요. 두꺼운 흰색 비닐 테두리와 광택 효과를 넣고, 단순화된 귀여운 치비 스타일로 흰 배경에 만들어주세요.'
    },
    {
      id: 'to-oil-painting',
      name: '유화',
      description: '클래식한 유화 스타일로 변환',
      icon: '🎨',
      prompt: '이 장면 전체를 풍부한 질감과 붓터치가 보이는 고전적인 유화 스타일로 재현해주세요.'
    },
    {
      id: 'to-pencil',
      name: '연필 스케치',
      description: '세밀한 연필 스케치로 변환',
      icon: '✏️',
      prompt: '이 이미지 전체를 질감이 있는 종이 위에 손으로 그린 세밀한 연필 스케치로 변환해주세요.'
    },
    {
      id: 'to-korean-ink',
      name: '한국 수묵화',
      description: '전통 한국 수묵화 스타일로 변환',
      icon: '🖼️',
      prompt: '이 장면 전체를 한지 위에 미니멀한 구성과 표현적인 붓터치를 강조한 전통 한국 수묵화(먹그림) 스타일로 재현해주세요.'
    }
  ];

  const mainActions = quickActions.slice(0, 6);
  const moreActions = quickActions.slice(6);

  const handleActionClick = (action: typeof quickActions[0]) => {
    onActionSelect(action.prompt);
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">빠른 작업</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {mainActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={disabled}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            title={action.description}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">
                {action.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {!showMore && moreActions.length > 0 && (
        <button
          onClick={() => setShowMore(true)}
          disabled={disabled}
          className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          더 많은 스타일 보기 ({moreActions.length}개)
        </button>
      )}

      {showMore && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {moreActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={disabled}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                title={action.description}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {action.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">
                    {action.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMore(false)}
            disabled={disabled}
            className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
          >
            접기
          </button>
        </>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>팁:</strong> 이미지를 업로드한 후 원하는 작업을 클릭하면 자동으로 적용됩니다.
          프롬프트를 직접 수정하여 더 세밀한 조정도 가능합니다.
        </p>
      </div>
    </div>
  );
};

export default QuickActions;