import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const styleDescriptions = [
    { name: '피규어', description: '장난감 피규어 디오라마 사진처럼 변환' },
    { name: '디오라마', description: '정교한 미니어처 디오라마 스타일' },
    { name: '미니어처', description: '틸트시프트 효과로 작은 모형 세계처럼' },
    { name: '픽셀 아트', description: '16비트 레트로 게임 스타일' },
    { name: '양모 인형', description: '펠트 양모로 만든 인형 스타일' },
    { name: '클레이메이션', description: '점토 애니메이션 스타일' },
    { name: '실사화', description: '일러스트를 실제 사진처럼 변환' },
    { name: '페이퍼 아트', description: '종이를 겹쳐 만든 입체 작품' },
    { name: '스티커', description: '귀여운 다이컷 스티커 스타일' },
    { name: '로고', description: '심플한 벡터 로고 디자인' },
    { name: '미니멀리스트', description: '극도로 단순화된 미술 스타일' },
    { name: '스테인드글라스', description: '색유리 창문 예술 스타일' },
    { name: '자수', description: '실로 수놓은 자수 작품' },
    { name: '청사진', description: '기술 도면 설계도 스타일' },
    { name: '모자이크', description: '작은 타일로 만든 모자이크 예술' },
    { name: '복셀 아트', description: '3D 큐브 블록 스타일 (마인크래프트)' },
    { name: '유화', description: '고전적인 유화 그림 스타일' },
    { name: '연필 스케치', description: '손으로 그린 연필 드로잉' },
    { name: '네온사인', description: '빛나는 네온 간판 스타일' },
    { name: '한국수묵화', description: '전통 한국 먹그림 스타일' }
  ];

  const processDescriptions = [
    { name: '배경 제거', description: '이미지 배경을 투명하게 제거' },
    { name: '부분 삭제', description: '마우스로 선택한 영역을 지능적으로 제거' },
    { name: '이미지 합성', description: '여러 이미지를 자연스럽게 합성' },
    { name: '증명사진', description: '일반 사진을 증명사진 스타일로 변환' },
    { name: '평면도 3D', description: '2D 평면도를 3D 렌더링으로 변환' },
    { name: '복원', description: '오래된 사진을 깨끗하게 복원' },
    { name: '컬러화', description: '흑백 사진에 자연스러운 색상 추가' },
    { name: '채색하기', description: '스케치나 선화에 색상 입히기' },
    { name: '업스케일', description: '이미지 해상도와 선명도 향상' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">🎨 기능 설명서</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* 빠른 작업 섹션 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">✨ 빠른 작업</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {processDescriptions.map(item => (
                  <div key={item.name} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-20 font-medium text-blue-600">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 스타일 변환 섹션 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">🎭 스타일 변환</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styleDescriptions.map(item => (
                  <div key={item.name} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-24 font-medium text-purple-600">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 사용 방법 섹션 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">📖 사용 방법</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. <strong>이미지 업로드:</strong> '이미지 업로드' 버튼을 클릭하거나 드래그 앤 드롭</p>
                <p>2. <strong>작업 선택:</strong> 원하는 스타일이나 처리 방식을 선택</p>
                <p>3. <strong>프롬프트 입력:</strong> 추가 요청사항이 있다면 입력 (선택사항)</p>
                <p>4. <strong>생성 실행:</strong> '생성' 버튼을 클릭하여 AI 처리 시작</p>
                <p>5. <strong>결과 다운로드:</strong> 생성된 이미지 위에 마우스를 올려 다운로드 버튼 클릭</p>
              </div>
            </section>

            {/* 팁 섹션 */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">💡 팁</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 여러 스타일을 조합할 수 있습니다</p>
                <p>• 프롬프트를 구체적으로 작성하면 더 좋은 결과를 얻을 수 있습니다</p>
                <p>• 배경 제거 후 다른 스타일을 적용하면 더 깔끔한 결과를 얻을 수 있습니다</p>
                <p>• 고해상도 이미지일수록 더 좋은 품질의 결과물이 생성됩니다</p>
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3">
          <p className="text-xs text-gray-500 text-center">
            Google Gemini API를 사용하여 AI 이미지 처리를 수행합니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;