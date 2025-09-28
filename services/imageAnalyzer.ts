import { GoogleGenAI } from "@google/genai";

// 이미지 분석 결과 타입
interface ImageAnalysis {
    mainSubject: string;
    background: string;
    lighting: string;
    colors: string[];
    mood: string;
    composition: string;
}

// 이미지를 분석하여 합성에 필요한 정보 추출
export const analyzeImage = async (
    apiKey: string,
    base64ImageData: string,
    mimeType: string
): Promise<ImageAnalysis> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const imageData = base64ImageData.split(',')[1];

        const analysisPrompt = `Analyze this image and provide detailed information in JSON format:
        {
            "mainSubject": "describe the main subject/person/object",
            "background": "describe the background environment",
            "lighting": "describe the lighting conditions",
            "colors": ["list", "dominant", "colors"],
            "mood": "describe the overall mood/atmosphere",
            "composition": "describe the composition and perspective"
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    { inlineData: { data: imageData, mimeType: mimeType } },
                    { text: analysisPrompt }
                ],
            },
        });

        try {
            const jsonStr = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            return JSON.parse(jsonStr);
        } catch (error) {
            // JSON 파싱 실패 시 기본값 반환
            return {
                mainSubject: "subject",
                background: "background",
                lighting: "natural lighting",
                colors: ["various"],
                mood: "neutral",
                composition: "standard"
            };
        }
    } catch (error) {
        console.error('Image analysis error:', error);
        throw new Error('이미지 분석에 실패했습니다.');
    }
};

// 두 이미지를 지능적으로 합성하기 위한 프롬프트 생성
export const generateSmartMergePrompt = async (
    apiKey: string,
    userPrompt: string,
    image1Base64: string,
    image1MimeType: string,
    image2Base64: string,
    image2MimeType: string
): Promise<string> => {
    try {
        // 두 이미지 분석
        const [analysis1, analysis2] = await Promise.all([
            analyzeImage(apiKey, image1Base64, image1MimeType),
            analyzeImage(apiKey, image2Base64, image2MimeType)
        ]);

        // 분석 결과를 바탕으로 최적화된 합성 프롬프트 생성
        const smartPrompt = `
${userPrompt}

Technical requirements for perfect synthesis:
- Merge ${analysis1.mainSubject} from first image with ${analysis2.mainSubject || analysis2.background} from second image
- Match lighting: harmonize ${analysis1.lighting} with ${analysis2.lighting}
- Color grading: blend ${analysis1.colors.join(', ')} with ${analysis2.colors.join(', ')}
- Maintain ${analysis1.mood} mood while incorporating ${analysis2.mood} elements
- Preserve original ${analysis1.composition} while integrating new elements
- Create seamless transitions with no visible edges or artifacts
- Ensure perspective consistency and natural shadows
- Apply professional color correction and exposure matching
- Ultra realistic, photorealistic quality, 8K resolution`;

        return smartPrompt;
    } catch (error) {
        // 분석 실패 시 기본 프롬프트 반환
        return `${userPrompt}. Seamlessly merge these images with perfect lighting, color matching, and perspective. Ultra realistic, professional quality.`;
    }
};