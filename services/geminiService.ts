import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio } from "../types";
import { generateSmartMergePrompt } from "./imageAnalyzer";

// 재시도 로직 유틸리티 함수
const retryWithDelay = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            console.warn(`시도 ${i + 1}/${maxRetries} 실패:`, error.message);

            // 마지막 시도면 에러 발생
            if (i === maxRetries - 1) {
                throw error;
            }

            // 429 (rate limit) 에러인 경우에만 재시도
            if (error.message?.includes('429') || error.message?.includes('quota')) {
                console.log(`${delay}ms 후 재시도...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 지수 백오프
            } else {
                // 다른 에러는 즉시 발생
                throw error;
            }
        }
    }
    throw new Error('최대 재시도 횟수 초과');
};

// API 키 유효성 검증 함수
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey });

        // 간단한 텍스트 생성으로 API 키 테스트
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: {
                parts: [{ text: 'Hello' }],
            },
        });

        return { valid: !!response };
    } catch (error: any) {
        console.error('API Key validation error:', error);

        if (error.message?.includes('API key not valid')) {
            return { valid: false, error: 'API 키가 유효하지 않습니다.' };
        }
        if (error.message?.includes('quota')) {
            return { valid: false, error: 'API 할당량이 초과되었습니다.' };
        }
        if (error.message?.includes('403')) {
            return { valid: false, error: 'API 키 권한이 없습니다.' };
        }

        return { valid: false, error: error.message || '알 수 없는 오류' };
    }
};

const handleApiError = (error: unknown): Error => {
    console.error("API Error:", error);

    // 에러 응답 본문 확인
    const errorStr = JSON.stringify(error);

    if (errorStr.includes('503') || errorStr.includes('UNAVAILABLE')) {
        return new Error(
            '⚠️ Gemini API 서비스가 일시적으로 사용 불가능합니다.\n\n' +
            '다음을 시도해보세요:\n' +
            '1. 잠시 후(1-2분) 다시 시도하세요\n' +
            '2. 브라우저를 새로고침하세요\n' +
            '3. VPN을 사용중이라면 미국 서버로 변경해보세요\n' +
            '4. API 키가 올바른지 확인하세요'
        );
    }

    if (error instanceof Error) {
        // FIX: Updated error messages to remove references to user-managed API keys.
        if (error.message.includes('API key not valid') || error.message.includes('API key is missing')) {
            return new Error('API 키가 유효하지 않거나 설정되지 않았습니다. 환경 변수를 확인하세요.');
        }
        if (error.message.includes('SAFETY') || error.message.includes('prompt could not be submitted')) {
            return new Error(`프롬프트가 안전 가이드라인을 위반하여 거부되었습니다. 다른 표현으로 다시 시도해 주세요.`);
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            return new Error(
                '⚠️ API 요청 한도를 초과했습니다.\n\n' +
                '다음을 시도해보세요:\n' +
                '1. 1분 후 다시 시도하세요\n' +
                '2. 이미지 크기를 줄여보세요\n' +
                '3. 더 간단한 프롬프트를 사용하세요'
            );
        }
        return new Error(`API 요청에 실패했습니다: ${error.message}`);
    }
    return new Error("알 수 없는 오류가 발생했습니다.");
};


// 이미지 생성을 위한 프롬프트 향상 함수
const enhanceGenerationPrompt = (userPrompt: string): string => {
    // 나노바나나 스타일의 품질 향상 키워드 추가
    const styleEnhancers = [
        "masterpiece",
        "best quality",
        "ultra-detailed",
        "photorealistic",
        "8k uhd",
        "high resolution",
        "sharp focus"
    ];

    // 예술적 스타일 감지 및 적용
    const artisticKeywords = ["anime", "cartoon", "sketch", "painting", "digital art", "illustration"];
    const hasArtisticStyle = artisticKeywords.some(keyword =>
        userPrompt.toLowerCase().includes(keyword)
    );

    if (hasArtisticStyle) {
        // 예술적 스타일의 경우
        return `${userPrompt}, ${styleEnhancers.slice(0, 3).join(", ")}, trending on artstation`;
    } else {
        // 사실적 이미지의 경우
        return `${userPrompt}, ${styleEnhancers.join(", ")}, professional photography, perfect composition`;
    }
};

export const generateImages = async (
    apiKey: string,
    prompt: string,
    numberOfImages: number,
    aspectRatio: AspectRatio
): Promise<string[]> => {
    if (!apiKey) {
        throw new Error('API 키가 필요합니다.');
    }

    console.log('API Key 정보:', {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyStart: apiKey?.substring(0, 10) + '...'
    });

    try {
        const ai = new GoogleGenAI({ apiKey });

        // 프롬프트 향상
        const enhancedPrompt = enhanceGenerationPrompt(prompt);
        console.log('향상된 프롬프트:', enhancedPrompt);

        // 이미지 생성 모델 우선순위 (첫 번째부터 시도)
        const imageModels = [
            'gemini-2.5-flash-image-preview',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash'
        ];

        const images: string[] = [];
        let lastError: any = null;

        for (const modelName of imageModels) {
            try {
                console.log(`이미지 생성 시도: ${modelName}`);

                for (let i = 0; i < numberOfImages; i++) {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: {
                            parts: [{ text: enhancedPrompt }],
                        },
                        config: {
                            responseModalities: [Modality.IMAGE],
                            outputMimeType: 'image/png',
                        },
                    });

                    if (response.candidates && response.candidates.length > 0) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const { mimeType: outMimeType, data } = part.inlineData;
                                let validMimeType = outMimeType;
                                if (!outMimeType || outMimeType === 'application/octet-stream') {
                                    validMimeType = 'image/png';
                                }
                                images.push(`data:${validMimeType};base64,${data}`);
                            }
                        }
                    }
                }

                // 성공하면 반복 중단
                if (images.length > 0) {
                    console.log(`이미지 생성 성공: ${modelName}`);
                    break;
                }
            } catch (error: any) {
                console.warn(`모델 ${modelName} 실패:`, error.message);
                lastError = error;

                // 404나 지원하지 않는 모델이면 다음 모델 시도
                if (error.message?.includes('404') || error.message?.includes('not found') ||
                    error.message?.includes('not supported') || error.message?.includes('text output')) {
                    continue;
                }

                // 429 (rate limit)나 403 (permission)은 모든 모델에서 동일할 가능성이 높으므로 중단
                if (error.message?.includes('429') || error.message?.includes('403')) {
                    throw error;
                }
            }
        }

        if (images.length === 0) {
            throw new Error("이미지 생성에 실패했습니다. 프롬프트를 수정하여 다시 시도해 주세요.");
        }

        return images;

    } catch (error) {
        throw handleApiError(error);
    }
};

// 프롬프트 개선 함수 - 나노바나나 스타일
const enhancePrompt = (userPrompt: string, hasSecondImage: boolean = false): string => {
    // 기본 품질 향상 지시문
    const qualityEnhancers = [
        "ultra realistic",
        "high quality",
        "professional",
        "detailed",
        "8k resolution"
    ];

    // 조명 및 컴포지션 개선
    const lightingAndComposition = [
        "perfect lighting",
        "well-composed",
        "cinematic",
        "depth of field"
    ];

    if (hasSecondImage) {
        // 두 이미지 합성 시 자연스러운 통합을 위한 지시문
        return `${userPrompt}. Seamlessly blend and merge these images with natural transitions.
                Match lighting, shadows, color temperature, and perspective perfectly.
                ${qualityEnhancers.join(", ")}, ${lightingAndComposition.join(", ")}.
                Ensure perfect integration with no visible seams or artifacts.`;
    }

    // 단일 이미지 편집 시
    return `${userPrompt}. ${qualityEnhancers.join(", ")}, ${lightingAndComposition.join(", ")}.
            Maintain the original subject's identity and key features while applying the requested changes.`;
};

export const editImage = async (
    apiKey: string,
    prompt: string,
    base64ImageData: string,
    mimeType: string,
    synthesisImagesData?: { base64: string; mimeType: string }[]
): Promise<string[]> => {
    if (!apiKey) {
        throw new Error('API 키가 필요합니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const imageData = base64ImageData.split(',')[1];

        const parts: any[] = [
            { inlineData: { data: imageData, mimeType: mimeType } }
        ];

        // 합성 이미지들이 있으면 모두 추가
        if (synthesisImagesData && synthesisImagesData.length > 0) {
            // 모든 합성 이미지를 parts에 추가
            for (const synthImage of synthesisImagesData) {
                const synthImageData = synthImage.base64.split(',')[1];
                parts.push({ inlineData: { data: synthImageData, mimeType: synthImage.mimeType } });
            }

            // 직접 프롬프트 사용 (분석 기능 일시 비활성화)
            parts.push({ text: prompt });
        } else {
            // 단일 이미지 편집 시 - 원본 보존 강조 추가
            const preservationPrompt = `${prompt}

CRITICAL: You MUST preserve the original subject's facial features, identity, and key characteristics. Only apply the requested style or effect without altering the person's face, skin tone, or identity.`;
            parts.push({ text: preservationPrompt });
        }

        // 이미지 편집 모델 우선순위 (첫 번째부터 시도)
        const editModels = [
            'gemini-2.5-flash-image-preview',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash'
        ];

        let lastError: any = null;
        let response: any = null;

        for (const modelName of editModels) {
            try {
                console.log('이미지 편집 시도:', {
                    model: modelName,
                    partsCount: parts.length,
                    hasSynthesisImages: !!(synthesisImagesData && synthesisImagesData.length > 0)
                });

                response = await ai.models.generateContent({
                    model: modelName,
                    contents: {
                        parts: parts,
                    },
                    config: {
                        responseModalities: [Modality.IMAGE, Modality.TEXT],
                        outputMimeType: 'image/png',
                    },
                });

                console.log(`이미지 편집 성공: ${modelName}`, {
                    hasResponse: !!response,
                    hasCandidates: !!(response.candidates && response.candidates.length > 0)
                });

                // 성공하면 반복 중단
                break;
            } catch (error: any) {
                console.warn(`편집 모델 ${modelName} 실패:`, error.message);
                lastError = error;

                // 404나 지원하지 않는 모델이면 다음 모델 시도
                if (error.message?.includes('404') || error.message?.includes('not found') ||
                    error.message?.includes('not supported') || error.message?.includes('text output')) {
                    continue;
                }

                // 429 (rate limit)나 403 (permission)은 모든 모델에서 동일할 가능성이 높으므로 중단
                if (error.message?.includes('429') || error.message?.includes('403')) {
                    throw error;
                }
            }
        }

        // 모든 모델이 실패한 경우
        if (!response) {
            throw lastError || new Error('모든 이미지 편집 모델이 실패했습니다.');
        }

        const images: string[] = [];
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const { mimeType: outMimeType, data } = part.inlineData;
                    // MIME 타입 검증 및 수정
                    let validMimeType = outMimeType;
                    if (!outMimeType || outMimeType === 'application/octet-stream') {
                        validMimeType = 'image/jpeg';  // 기본값으로 JPEG 설정
                    }
                    images.push(`data:${validMimeType};base64,${data}`);
                }
            }
        }

        if (images.length === 0) {
            throw new Error("API가 이미지를 반환하지 않았습니다. 프롬프트를 수정하거나 이미지를 변경하여 다시 시도해 보세요.");
        }

        return images;

    } catch (error) {
        throw handleApiError(error);
    }
};

export const analyzePdfWithPrompt = async (
    apiKey: string,
    prompt: string,
    base64PdfData: string,
    mimeType: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error('API 키가 필요합니다.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const pdfData = base64PdfData.split(',')[1];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: pdfData, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
        });
        
        return response.text;

    } catch (error) {
        throw handleApiError(error);
    }
};

const pollVideoOperation = async (ai: GoogleGenAI, operation: any): Promise<any> => {
    let currentOperation = operation;
    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        try {
            currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
        } catch (error) {
            console.error("Error polling video operation:", error);
            if (error instanceof Error) {
                throw new Error(`비디오 상태 확인 중 오류 발생: ${error.message}`);
            }
            throw new Error("비디오 상태를 확인하는 중 알 수 없는 오류가 발생했습니다.");
        }
    }
    return currentOperation;
};


export const generateVideo = async (
    apiKey: string,
    prompt: string,
    setLoadingMessage: (message: string) => void,
    aspectRatio: '16:9' | '9:16',
    image?: { imageBytes: string; mimeType: string; }
): Promise<Blob> => {
    try {
        setLoadingMessage("비디오 생성을 시작합니다... 이 작업은 몇 분 정도 걸릴 수 있습니다.");

        // 다양한 모델 이름 시도
        const modelNames = [
            'veo-3.0-generate-001',  // Veo 3 추가
            'veo-3-generate-001',
            'veo-2.0-generate-001',
            'veo-001',
            'veo-2',
            'veo'
        ];

        const requestPayload: any = {
            model: modelNames[0], // 첫 번째 모델부터 시도
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
            }
        };

        if (image) {
            requestPayload.image = {
                imageBytes: image.imageBytes.split(',')[1],
                mimeType: image.mimeType,
            };
        }

        const ai = new GoogleGenAI({ apiKey });

        console.log('Video generation request:', requestPayload);

        let operation;
        try {
            operation = await ai.models.generateVideos(requestPayload);
        } catch (error: any) {
            console.error('Video generation error details:', {
                error: error,
                message: error.message,
                response: error.response,
                status: error.status,
                details: error.details
            });

            // 더 자세한 오류 분석
            const errorMsg = error.message || '';
            console.error('Full error details:', error);

            // 503 서비스 불가 오류
            if (error.status === 503 || errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) {
                throw new Error(
                    '비디오 생성 서비스가 일시적으로 사용 불가능합니다.\n\n' +
                    '다음을 시도해보세요:\n' +
                    '1. 몇 분 후 다시 시도\n' +
                    '2. 다른 지역의 VPN 사용 (미국 권장)\n' +
                    '3. Google Cloud Console에서 Veo API 활성화 확인'
                );
            }

            // 429 할당량 초과
            if (error.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota')) {
                throw new Error(
                    'API 할당량을 초과했습니다.\n\n' +
                    'Tier 1 제한:\n' +
                    '- 분당 요청: 60 RPM\n' +
                    '- 일일 요청: 제한 없음\n' +
                    '잠시 후 다시 시도해주세요.'
                );
            }

            // 오류 메시지를 그대로 전달
            throw error;
        }

        setLoadingMessage("비디오를 처리 중입니다... 거의 다 왔습니다.");
        const completedOperation = await pollVideoOperation(ai, operation);
        
        if (completedOperation.error) {
            const errorMessage = String(completedOperation.error.message || JSON.stringify(completedOperation.error));
            if (errorMessage.includes('SAFETY')) {
                 throw new Error(`프롬프트가 안전 가이드라인을 위반하여 거부되었습니다. 다른 표현으로 다시 시도해 주세요.`);
            }
            if (errorMessage.includes('billing enabled') || errorMessage.includes('GCP billing')) {
                throw new Error(
                    '비디오 생성(Veo 2.0)을 사용하려면 Google Cloud Platform 결제가 필요합니다.\n\n' +
                    'Google AI Studio에서 API 키를 생성할 때:\n' +
                    '1. "Create API key in existing project"를 선택\n' +
                    '2. GCP 결제가 활성화된 프로젝트 선택\n' +
                    '3. 생성된 API 키 사용\n\n' +
                    '또는 무료로 이미지 생성/편집 기능을 사용해보세요.'
                );
            }
            throw new Error(`비디오 생성 작업 실패: ${errorMessage}`);
        }

        const downloadLink = completedOperation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("비디오 생성에 성공했지만 다운로드 링크를 찾을 수 없습니다.");
        }

        setLoadingMessage("비디오를 다운로드 중입니다...");
        
        const videoResponseUrl = downloadLink.includes('?') ? `${downloadLink}&key=${apiKey}` : `${downloadLink}?key=${apiKey}`;
        const videoResponse = await fetch(videoResponseUrl);


        if (!videoResponse.ok) {
            throw new Error(`비디오 다운로드 실패: ${videoResponse.statusText}`);
        }
        
        const videoBlob = await videoResponse.blob();
        return videoBlob;

    } catch (error) {
        throw handleApiError(error);
    }
};
