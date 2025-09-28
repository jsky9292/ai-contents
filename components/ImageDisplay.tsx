import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ImageDisplayProps {
  imageUrls: string[] | null;
  isLoading: boolean;
}

const ImagePlaceholder: React.FC = () => (
    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-semibold text-gray-700">생성된 이미지가 여기에 표시됩니다</p>
        <p className="text-sm text-gray-500">프롬프트를 입력하고 '생성'을 클릭하세요.</p>
    </div>
);

const ImageWithDownload: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      // MIME 타입에 따라 확장자 결정
      let extension = 'jpg';
      if (imageUrl.includes('image/png')) {
        extension = 'png';
      } else if (imageUrl.includes('image/webp')) {
        extension = 'webp';
      } else if (imageUrl.includes('image/gif')) {
        extension = 'gif';
      }

      // 타임스탬프로 고유한 파일명 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `AI_생성이미지_${timestamp}.${extension}`;

      // base64를 Blob으로 변환
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // File System Access API 지원 확인
      if ('showSaveFilePicker' in window) {
        try {
          // 파일 저장 위치 선택 다이얼로그
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Images',
              accept: {
                'image/*': [`.${extension}`],
              },
            }],
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          // 사용자가 취소한 경우 무시
          if ((err as Error).name !== 'AbortError') {
            console.error('파일 저장 오류:', err);
            // 폴백: 기본 다운로드
            fallbackDownload(imageUrl, fileName);
          }
        }
      } else {
        // File System Access API를 지원하지 않는 브라우저에서 기본 다운로드
        fallbackDownload(imageUrl, fileName);
      }
    } catch (error) {
      console.error('다운로드 처리 오류:', error);
      // 에러 시 기본 다운로드로 폴백
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `AI_생성이미지_${timestamp}.jpg`;
      fallbackDownload(imageUrl, fileName);
    }
  };

  const fallbackDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG 이미지인 경우에만 체커보드 패턴 표시
  const isPng = imageUrl.includes('image/png');

  return (
    <div className="relative group aspect-square">
      <div
        className="w-full h-full rounded-lg overflow-hidden bg-white"
        style={isPng ? {
          backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%)',
          backgroundSize: '20px 20px'
        } : {}}
      >
        <img src={imageUrl} alt="생성된 이미지" className="w-full h-full object-contain rounded-lg" />
      </div>
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-blue-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
        aria-label="Download image"
        title="이미지 다운로드"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
};


const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrls, isLoading }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-4 transition-all duration-300 min-h-[300px] lg:min-h-0">
      {isLoading ? (
        <LoadingSpinner />
      ) : imageUrls && imageUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
            {imageUrls.map((url, index) => (
                <ImageWithDownload key={index} imageUrl={url} />
            ))}
        </div>
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  );
};

export default ImageDisplay;