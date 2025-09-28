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
[CRITICAL MISSION]: Intelligent Fashion/Product Synthesis

[PRIMARY DIRECTIVE]:
The first image contains the MAIN PERSON whose face, body, and identity MUST be perfectly preserved.
The second image contains CLOTHING, ACCESSORIES, or PRODUCTS to be transferred to the main person.

[USER REQUEST]: ${userPrompt}

[SYNTHESIS INSTRUCTIONS]:
1. PRESERVE COMPLETELY from Image 1 (Base):
   - The person's face, facial features, expression, skin tone
   - Body shape, pose, and proportions
   - Hair style and color (unless specifically requested to change)
   - Identity and personal characteristics

2. TRANSFER from Image 2 (Source):
   - Clothing items (shirts, pants, dresses, jackets, etc.)
   - Accessories (hats, glasses, jewelry, bags, etc.)
   - Products being showcased
   - Style and fabric details

3. TECHNICAL REQUIREMENTS:
   - Perfect fit adjustment: Resize clothing/products to fit the person naturally
   - Lighting harmony: Match ${analysis1.lighting} throughout
   - Perspective correction: Maintain ${analysis1.composition} and angle
   - Color consistency: Blend naturally while preserving original clothing colors
   - Remove mannequin/model from Image 2 completely
   - Create realistic wrinkles, shadows, and fabric physics
   - Ensure natural body proportions and posture
   - Professional retouching quality

[OUTPUT]: Single synthesized image with the person from Image 1 wearing/using items from Image 2
Ultra realistic, photorealistic quality, professional fashion photography standard`;

        return smartPrompt;
    } catch (error) {
        // 분석 실패 시 기본 프롬프트 반환
        return `${userPrompt}

CRITICAL: Keep the person's face and body from the FIRST image completely unchanged.
Transfer ONLY the clothing/products from the SECOND image onto the person from the FIRST image.
Create a natural, realistic synthesis with perfect fit and lighting.`;
    }
};