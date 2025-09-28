// 이미지 처리 유틸리티 함수들

export interface ImageData {
  mimeType: string;
  data: string; // base64
}

export interface GeneratedPart {
  text?: string;
  inlineData?: ImageData;
}

/**
 * 마스크를 사용하여 배경 제거
 * 흰색 부분은 유지, 검은색 부분은 투명하게 처리
 */
export const applyMaskToImage = (original: ImageData, mask: ImageData): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    const maskImg = new Image();

    let loadedCount = 0;
    const onBothLoaded = () => {
      if (++loadedCount < 2) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Canvas context를 가져올 수 없습니다'));
      }

      const width = originalImg.naturalWidth;
      const height = originalImg.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      // 1. 원본 이미지 그리기
      ctx.drawImage(originalImg, 0, 0);
      const originalData = ctx.getImageData(0, 0, width, height);

      // 2. 마스크 이미지 데이터 가져오기
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(maskImg, 0, 0, width, height);
      const maskData = ctx.getImageData(0, 0, width, height);

      // 3. 결과 이미지 데이터 생성
      const resultData = ctx.createImageData(width, height);

      // 4. 픽셀별로 마스크 적용
      for (let i = 0; i < originalData.data.length; i += 4) {
        // 마스크의 밝기를 알파값으로 사용
        const alpha = maskData.data[i];

        // RGB는 원본 이미지에서 복사
        resultData.data[i] = originalData.data[i];       // Red
        resultData.data[i + 1] = originalData.data[i + 1]; // Green
        resultData.data[i + 2] = originalData.data[i + 2]; // Blue
        resultData.data[i + 3] = alpha;                    // Alpha
      }

      // 5. 캔버스에 결과 그리기
      ctx.putImageData(resultData, 0, 0);

      const finalDataUrl = canvas.toDataURL('image/png');
      const finalBase64 = finalDataUrl.split(',')[1];

      resolve({
        mimeType: 'image/png',
        data: finalBase64,
      });
    };

    originalImg.onload = onBothLoaded;
    maskImg.onload = onBothLoaded;
    originalImg.onerror = () => reject(new Error('원본 이미지 로드 실패'));
    maskImg.onerror = () => reject(new Error('마스크 이미지 로드 실패'));

    originalImg.src = `data:${original.mimeType};base64,${original.data}`;
    maskImg.src = `data:${mask.mimeType};base64,${mask.data}`;
  });
};

/**
 * File을 ImageData로 변환
 */
export const fileToImageData = async (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * ImageData를 File로 변환
 */
export const imageDataToFile = (imageData: ImageData, fileName: string = 'image.png'): File => {
  const byteCharacters = atob(imageData.data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], fileName, { type: imageData.mimeType });
};