import React, { useState, useEffect, useCallback } from 'react';

import ApiKeyModal from './components/ApiKeyModal';
import ImageDisplay from './components/ImageDisplay';
import VideoDisplay from './components/VideoDisplay';
import AspectRatioSelector from './components/AspectRatioSelector';
import NumberOfImagesSelector from './components/NumberOfImagesSelector';
import ImageUploader from './components/ImageUploader';
import DualImageUploader from './components/DualImageUploader';
import PromptSuggestions from './components/PromptSuggestions';
import PromptEnhancer from './components/PromptEnhancer';
import HelpModal from './components/HelpModal';
import { generateImages, editImage, generateVideo } from './services/geminiService';
import { AspectRatio } from './types';
import { stylePrompts, processPrompts } from './services/bananaService';
import { applyMaskToImage, fileToImageData, ImageData, GeneratedPart } from './utils/imageProcessing';
import VideoAspectRatioSelector from './components/VideoAspectRatioSelector';
import { ImageEditor } from './components/ImageEditor';

type Mode = 'generate' | 'edit' | 'video';
type UploadedImage = { file: File; base64: string };
type VideoAspectRatio = '16:9' | '9:16';

const suggestionSets = {
  generate: [
    { title: "로봇", prompt: "빨간색 스케이트보드를 들고 있는 로봇." },
    { title: "고양이", prompt: "왕관을 쓴 태비 고양이의 클로즈업 초상화, 영화 같은 조명." },
    { title: "풍경", prompt: "일몰의 산맥과 그 사이를 흐르는 강이 있는 아름다운 풍경." },
    { title: "음식", prompt: "나무 테이블 위에 놓인, 치즈와 페퍼로니가 듬뿍 들어간 먹음직스러운 피자." },
  ],
  edit: [
    { title: "라마 추가", prompt: "사람 옆에 라마를 추가해줘" },
    { title: "배경 변경", prompt: "배경을 미래 도시로 바꿔줘" },
    { title: "선글라스 추가", prompt: "고양이에게 선글라스를 씌워줘" },
    { title: "흑백으로", prompt: "이미지를 흑백으로 만들어줘" },
  ],
  video: [
    { title: "해변의 드론 샷", prompt: "아름다운 일몰을 배경으로 해변을 걷고 있는 서퍼의 모습을 와이드 샷, 시네마틱 영상으로 만들어 줘." },
    { title: "타임랩스", prompt: "밤에서 낮으로 바뀌는 도시의 스카이라인 타임랩스, 분주한 교통의 흐름." },
    { title: "항공 뷰", prompt: "눈 덮인 산 위를 나는 독수리의 시점에서 본 항공 뷰." },
    { title: "우주", prompt: "화려한 성운을 통과하여 비행하는 우주선의 내부에서 본 조종석 시점 샷." },
  ]
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isEditingInpaint, setIsEditingInpaint] = useState(false);
  const [inpaintMask, setInpaintMask] = useState<ImageData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [imageUrls, setImageUrls] = useState<string[] | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [resultParts, setResultParts] = useState<GeneratedPart[] | null>(null);

  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [secondUploadedImage, setSecondUploadedImage] = useState<UploadedImage | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [videoReferenceImage, setVideoReferenceImage] = useState<UploadedImage | null>(null);
  const [synthesisImages, setSynthesisImages] = useState<{ id: number; image: UploadedImage | null }[]>([]);
  const [compositionPrompt, setCompositionPrompt] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      // 디버깅용: 사용 가능한 모델 확인
      (window as any).testVideoAPI = async () => {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models';
        const response = await fetch(`${url}?key=${savedApiKey}`);
        const data = await response.json();
        console.log('Available models:', data);
        return data;
      };
      console.log('테스트: window.testVideoAPI() 실행으로 사용 가능한 모델 확인');
    }
  }, []);

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini_api_key', newApiKey);
  };

  const handleModeChange = (newMode: Mode) => {
    if (isLoading) return;
    setMode(newMode);
    setError(null);
    setPrompt('');
    setImageUrls(null);
    setVideoBlob(null);
    setUploadedImage(null);
    setSecondUploadedImage(null);
    setVideoReferenceImage(null);
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // 배경 제거 기능
  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);

    try {
      const prompt = `Generate a precise binary mask for background removal. Output ONLY a black and white mask where:
- WHITE pixels (#FFFFFF) = the main subject to KEEP
- BLACK pixels (#000000) = the background to REMOVE
Create clean edges with proper anti-aliasing for hair and fine details. The mask dimensions must match the input exactly.`;

      const maskImages = await editImage(
        apiKey,
        prompt,
        uploadedImage.base64,
        uploadedImage.file.type,
        undefined // 합성 이미지 없음
      );

      if (maskImages && maskImages.length > 0) {
        // 마스크 이미지를 사용하여 배경 제거
        const originalImageData = await fileToImageData(uploadedImage.file);
        const maskImageData: ImageData = {
          mimeType: 'image/png',
          data: maskImages[0].split(',')[1] || maskImages[0]
        };

        const finalImage = await applyMaskToImage(originalImageData, maskImageData);
        // PNG 형식으로 투명 배경 유지
        setImageUrls([`data:image/png;base64,${finalImage.data}`]);
      } else {
        throw new Error('마스크 생성에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '배경 제거 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 증명사진 변환 기능
  const handleProofPhoto = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);

    try {
      const prompt = `[TASK] Convert the provided photograph into a professional, Korean-style ID photo.

[STRICT INSTRUCTIONS]
1. **Identity Preservation (Top Priority)**: The facial features MUST be identical to the original.
2. **Mandatory Wardrobe Change**: The subject's clothing MUST be changed to a formal business suit.
3. **Background**: The background MUST be a solid, pure white color (#FFFFFF).
4. **Pose & Gaze**: The subject MUST face directly forward, looking at the camera.
5. **Lighting**: Apply soft, even studio lighting typical of professional portraiture.
6. **Framing**: The final output image MUST be generated with a perfect 3:4 aspect ratio.`;

      const images = await editImage(
        apiKey,
        prompt,
        uploadedImage.base64,
        uploadedImage.file.type,
        undefined // 합성 이미지 없음
      );

      setImageUrls(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : '증명사진 변환 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 평면도 3D 변환 기능
  const handleFloorplan3D = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);

    try {
      const prompt = `[TASK] Transform 2D floorplan to 3D visualization.

[STRICT REQUIREMENTS]
1. LAYOUT ACCURACY: Maintain exact room dimensions and wall positions
2. 3D PERSPECTIVE: Create isometric or perspective view
3. REALISTIC MATERIALS: Add appropriate textures (wood floors, painted walls)
4. PROPER LIGHTING: Natural lighting with accurate shadows
5. FURNITURE PLACEMENT: Add contextually appropriate furniture
6. NO ARTIFACTS: Clean output without borders or patterns
7. PROFESSIONAL QUALITY: Real estate visualization standard
8. PRESERVE STRUCTURE: Keep all architectural elements accurate`;

      const images = await editImage(
        apiKey,
        prompt,
        uploadedImage.base64,
        uploadedImage.file.type,
        undefined // 합성 이미지 없음
      );

      setImageUrls(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : '평면도 3D 변환 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Inpaint 마스크 적용 함수
  const handleInpaintApply = async (mask: ImageData) => {
    setInpaintMask(mask);
    setIsEditingInpaint(false);

    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);

    try {
      const prompt = `You are an expert image inpainting model. You will receive two images followed by this text prompt. 1. The first image is the original image. 2. The second image is a mask. The white area in this mask indicates the region that needs to be removed and realistically filled. Your task is to remove the content within the white masked area from the first image and intelligently fill it in so it blends seamlessly with the surrounding pixels. Output only the final, single, inpainted image.`;

      // 마스크를 합성 이미지로 전달
      const images = await editImage(
        apiKey,
        prompt,
        uploadedImage.base64,
        uploadedImage.file.type,
        [{ base64: `data:${mask.mimeType};base64,${mask.data}`, mimeType: mask.mimeType }]
      );

      setImageUrls(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : '부분 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !prompt || isLoading) {
        if (!apiKey) {
            setError('API 키를 설정해주세요.');
            setIsModalOpen(true);
        }
        return;
    }

    setIsLoading(true);
    setError(null);
    setImageUrls(null);
    setVideoBlob(null);
    setLoadingMessage('');

    try {
      if (mode === 'generate') {
        const images = await generateImages(apiKey, prompt, numberOfImages, aspectRatio);
        setImageUrls(images);
      } else if (mode === 'edit') {
        if (!uploadedImage) {
          throw new Error('편집할 이미지를 업로드하세요.');
        }
        const images = await editImage(
          apiKey,
          prompt,
          uploadedImage.base64,
          uploadedImage.file.type,
          secondUploadedImage ? [{ base64: secondUploadedImage.base64, mimeType: secondUploadedImage.file.type }] : undefined
        );
        setImageUrls(images);
      } else if (mode === 'video') {
        const imagePayload = videoReferenceImage ? { imageBytes: videoReferenceImage.base64, mimeType: videoReferenceImage.file.type } : undefined;
        const blob = await generateVideo(apiKey, prompt, setLoadingMessage, videoAspectRatio, imagePayload);
        setVideoBlob(blob);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [apiKey, prompt, mode, numberOfImages, aspectRatio, uploadedImage, secondUploadedImage, isLoading, videoAspectRatio, videoReferenceImage]);

  // 이미지 합성 기능
  const handleSynthesisGenerate = async () => {
    if (!uploadedImage || synthesisImages.length === 0 || !compositionPrompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);

    try {
      // 모든 합성 이미지 데이터 준비
      const synthesisImagesData = synthesisImages
        .filter(item => item.image)
        .map(item => ({
          base64: item.image!.base64,
          mimeType: item.image!.file.type
        }));

      if (synthesisImagesData.length === 0) {
        throw new Error('합성할 이미지를 업로드해주세요.');
      }

      const enhancedPrompt = `[FASHION/PRODUCT SYNTHESIS MISSION]

[CRITICAL RULES]:
1. BASE IMAGE (First): Contains the PERSON whose identity MUST be 100% preserved
2. SOURCE IMAGES: Contains CLOTHING/PRODUCTS to transfer to the person

[USER REQUEST]: ${compositionPrompt}

[EXECUTION]:
- KEEP: Person's face, body, pose, expression from BASE image
- TRANSFER: Clothing, accessories, or products from SOURCE images
- COMBINE: If multiple source images, intelligently combine elements
- RESULT: Person from BASE wearing/using items from SOURCES
- QUALITY: Natural fit, realistic shadows, professional photography

[OUTPUT]: Single synthesized image ONLY`;

      const images = await editImage(
        apiKey,
        enhancedPrompt,
        uploadedImage.base64,
        uploadedImage.file.type,
        synthesisImagesData
      );

      setImageUrls(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 합성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 합성 이미지 추가/제거
  const handleSynthesisImageChange = (newImage: UploadedImage | null, id: number) => {
    if (newImage === null) {
      setSynthesisImages(prev => prev.filter(item => item.id !== id));
    } else {
      setSynthesisImages(prev => {
        const exists = prev.find(item => item.id === id);
        if (exists) {
          return prev.map(item => item.id === id ? { ...item, image: newImage } : item);
        }
        return [...prev, { id, image: newImage }];
      });
    }
  };

  const addSynthesisImage = () => {
    const newId = Date.now();
    setSynthesisImages(prev => [...prev, { id: newId, image: null } as any]);
  };

  const renderResult = () => {
    if (mode === 'video') {
      return <VideoDisplay videoBlob={videoBlob} isLoading={isLoading} loadingMessage={loadingMessage} />;
    }
    return <ImageDisplay imageUrls={imageUrls} isLoading={isLoading} />;
  };
  
  const renderSettings = () => {
    switch(mode) {
      case 'generate':
        return (
          <div className="space-y-4">
            <NumberOfImagesSelector selectedNumber={numberOfImages} onNumberChange={setNumberOfImages} disabled={isLoading} />
            <AspectRatioSelector selectedRatio={aspectRatio} onRatioChange={setAspectRatio} />
          </div>
        );
      case 'edit':
        return (
          <div className="space-y-4">
            {/* ImageEditor 모달 */}
            {isEditingInpaint && uploadedImage && (
              <ImageEditor
                image={{
                  mimeType: uploadedImage.file.type,
                  data: uploadedImage.base64.split(',')[1]
                }}
                onApply={handleInpaintApply}
                onCancel={() => setIsEditingInpaint(false)}
                isDisabled={isLoading}
              />
            )}

            {!isEditingInpaint && (
              <>
                <DualImageUploader
                  mainImage={uploadedImage}
                  secondImage={secondUploadedImage}
                  onMainImageUpload={setUploadedImage}
                  onSecondImageUpload={setSecondUploadedImage}
                  disabled={isLoading}
                />
                {uploadedImage && !secondUploadedImage && (
              <div className="space-y-4">
                {/* 핵심 기능 버튼들 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">핵심 기능</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={handleRemoveBackground}
                      disabled={isLoading}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform">✂️</span>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">배경 제거</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsEditingInpaint(true)}
                      disabled={isLoading}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform">🎨</span>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">부분 삭제</span>
                      </div>
                    </button>
                    <button
                      onClick={handleProofPhoto}
                      disabled={isLoading}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform">🆔</span>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">증명사진 변환</span>
                      </div>
                    </button>
                    <button
                      onClick={handleFloorplan3D}
                      disabled={isLoading}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform">🏢</span>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">평면도 3D</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">빠른 작업</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setPrompt('Remove the background completely, keeping only the main subject with clean edges. The background must be fully transparent (alpha channel), not white or black.')}
                      disabled={isLoading}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform">✂️</span>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">배경 제거</span>
                      </div>
                    </button>
                    {processPrompts.map(process => (
                      <button
                        key={process.name}
                        onClick={() => setPrompt(process.prompt)}
                        disabled={isLoading}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {process.name === '복원' ? '🔧' : process.name === '컬러화' ? '🌈' : process.name === '채색하기(스케치전용)' ? '🖌️' : '⬆️'}
                          </span>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{process.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">스타일 변환</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {stylePrompts.slice(0, 6).map(style => (
                      <button
                        key={style.name}
                        onClick={() => setPrompt(style.prompt)}
                        disabled={isLoading}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {style.name === '피규어' ? '🎭' :
                             style.name === '디오라마' ? '🏛️' :
                             style.name === '미니어처' ? '🔍' :
                             style.name === '픽셀 아트' ? '👾' :
                             style.name === '양모 인형' ? '🧸' :
                             style.name === '클레이메이션' ? '🎬' : '🎨'}
                          </span>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{style.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">더 많은 스타일 보기</summary>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {stylePrompts.slice(6).map(style => (
                        <button
                          key={style.name}
                          onClick={() => setPrompt(style.prompt)}
                          disabled={isLoading}
                          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {style.name === '실사화' ? '📸' :
                               style.name === '페이퍼 아트' ? '📄' :
                               style.name === '스티커' ? '⭐' :
                               style.name === '로고' ? '💼' :
                               style.name === '미니멀리스트' ? '⚪' :
                               style.name === '스테인드글라스' ? '🪟' :
                               style.name === '자수' ? '🪡' :
                               style.name === '청사진' ? '📐' :
                               style.name === '모자이크' ? '🧩' :
                               style.name === '복셀 아트' ? '🎲' :
                               style.name === '유화' ? '🎨' :
                               style.name === '연필 스케치' ? '✏️' :
                               style.name === '네온사인' ? '💡' :
                               style.name === '한국수묵화' ? '🖼️' : '🎨'}
                            </span>
                            <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{style.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>

                {/* 이미지 합성 섹션 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">이미지 합성 (패션/제품 합성)</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    기본 이미지의 인물에게 합성 이미지의 의상이나 제품을 입혀줍니다.
                  </p>
                  <div className="space-y-3">
                    {synthesisImages.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 w-20">소스 #{index + 1}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = reader.result as string;
                                handleSynthesisImageChange({ file, base64 }, item.id);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                        <button
                          onClick={() => handleSynthesisImageChange(null, item.id)}
                          className="text-red-500 hover:text-red-700 text-sm p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addSynthesisImage}
                      className="w-full p-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      + 합성 이미지 추가
                    </button>

                    <textarea
                      value={compositionPrompt}
                      onChange={(e) => setCompositionPrompt(e.target.value)}
                      placeholder="합성 방식을 설명하세요... (예: 마네킹의 옷을 입혀주세요, 제품을 들고 있게 해주세요)"
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={2}
                      disabled={isLoading}
                    />

                    <button
                      onClick={handleSynthesisGenerate}
                      disabled={isLoading || !compositionPrompt.trim() || synthesisImages.length === 0}
                      className="w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      합성 실행
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            <VideoAspectRatioSelector selectedRatio={videoAspectRatio} onRatioChange={setVideoAspectRatio} />
            <ImageUploader onImageUpload={setVideoReferenceImage} uploadedImage={videoReferenceImage} disabled={isLoading} />
             <p className="text-sm text-gray-500 text-center">선택적으로 이미지를 업로드하여 비디오 생성의 기준으로 삼을 수 있습니다.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tabMode: Mode; label: string }> = ({ tabMode, label }) => (
    <button
      onClick={() => handleModeChange(tabMode)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === tabMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      disabled={isLoading}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white text-gray-800 min-h-screen font-sans">
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKey={apiKey}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">AI콘텐츠 생성기</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="도움말"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="API 키 설정"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <TabButton tabMode="generate" label="이미지 생성" />
              <TabButton tabMode="edit" label="이미지 편집" />
              <TabButton tabMode="video" label="비디오 생성" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                  <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 mb-2">프롬프트</label>
                  <textarea
                    id="prompt-input"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    placeholder={
                      mode === 'generate' ? "생성할 이미지에 대해 설명해주세요..." :
                      mode === 'edit' ? "이미지를 어떻게 편집할지 설명해주세요..." :
                      "생성할 비디오에 대해 설명해주세요..."
                    }
                    disabled={isLoading}
                  />
              </div>

              {mode !== 'video' && prompt && (
                <PromptEnhancer
                  prompt={prompt}
                  onPromptUpdate={setPrompt}
                  mode={mode === 'generate' ? 'generate' : 'edit'}
                  disabled={isLoading}
                />
              )}

              {renderSettings()}

              <button type="submit" disabled={isLoading || !prompt} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        생성 중...
                    </>
                ) : '생성'}
              </button>
            </form>
            
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
                <pre className="whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            )}

            <PromptSuggestions 
                onSelectSuggestion={handleSelectSuggestion} 
                suggestions={suggestionSets[mode]}
                disabled={isLoading}
            />

          </div>
          <div className="h-full">
            {renderResult()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;