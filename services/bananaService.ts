import { GoogleGenAI, Modality } from "@google/genai";

// banana-canvas의 스타일 프롬프트를 그대로 사용
export const stylePrompts = [
    { name: '피규어', prompt: 'Transform the style to look like a plastic toy figure diorama while keeping the exact same composition, faces, and subjects. PRESERVE all facial features and identities.' },
    { name: '디오라마', prompt: 'Apply a handcrafted diorama style while maintaining exact composition and facial features. DO NOT change faces or subjects.' },
    { name: '미니어처', prompt: 'Apply tilt-shift miniature effect while preserving exact composition and all facial features. Keep subjects identical.' },
    { name: '픽셀 아트', prompt: 'Convert to 16-bit pixel art style while preserving composition and recognizable features. Maintain subject identity.' },
    { name: '양모 인형', prompt: 'Apply felted wool texture style while keeping faces and subjects recognizable. Preserve facial features.' },
    { name: '클레이메이션', prompt: 'Apply claymation style while maintaining facial features and composition. Keep subjects recognizable.'},
    { name: '실사화', prompt: `Transform illustration to photorealistic style while preserving exact facial features and subject identity. Do not alter faces.` },
    { name: '페이퍼 아트', prompt: 'Apply paper craft style while preserving facial features and subject identity. Keep composition identical.' },
    { name: '스티커', prompt: 'Create sticker style with white border while keeping the subject recognizable. Preserve facial features if present.' },
    { name: '로고', prompt: 'Create simplified logo version while maintaining recognizable features of the subject. Keep identity clear.' },
    { name: '미니멀리스트', prompt: 'Apply minimalist style with simple shapes while keeping subject recognizable. Preserve key identifying features.' },
    { name: '스테인드글라스', prompt: 'Apply stained glass style with lead lines while preserving subject identity and facial features.' },
    { name: '자수', prompt: 'Apply embroidery texture style while keeping subjects recognizable. Preserve facial features.' },
    { name: '청사진', prompt: 'Convert to blueprint technical drawing style while maintaining recognizable subject features.' },
    { name: '모자이크', prompt: 'Apply mosaic tile effect while preserving subject identity and composition.' },
    { name: '복셀 아트', prompt: 'Convert to 3D voxel/cube style while keeping subjects recognizable. Maintain identity.' },
    { name: '유화', prompt: 'Apply oil painting style with brushstrokes while preserving exact facial features and identity.' },
    { name: '연필 스케치', prompt: 'Convert to pencil sketch style while maintaining exact facial features and subject identity.' },
    { name: '네온사인', prompt: 'Apply neon sign glow effect while keeping subjects recognizable and composition intact.' },
    { name: '한국수묵화', prompt: 'Apply Korean ink painting style while preserving subject identity and key features.' }
];

// banana-canvas의 프로세스 프롬프트를 그대로 사용
export const processPrompts = [
    { name: '복원', prompt: 'Restore image quality by removing noise and imperfections. PRESERVE exact facial features and colors. Do not alter subject identity.' },
    { name: '컬러화', prompt: 'Add natural colors to black and white image. Keep facial features and composition exactly the same.' },
    { name: '채색하기(스케치전용)', prompt: 'Add colors to sketch while preserving all line work and subject features. Do not alter the drawing structure.' },
    { name: '업스케일', prompt: 'Enhance resolution and sharpness while preserving exact facial features and all original details. Do not alter or beautify faces.' }
];

// 이미지 편집을 위한 향상된 프롬프트 생성
export const createEditPrompt = (basePrompt: string, style?: string, process?: string): string => {
    let finalPrompt = basePrompt;

    // 스타일 적용
    if (style) {
        const styleData = stylePrompts.find(s => s.name === style);
        if (styleData) {
            finalPrompt = `${styleData.prompt} ${basePrompt}`;
        }
    }

    // 프로세스 적용
    if (process) {
        const processData = processPrompts.find(p => p.name === process);
        if (processData) {
            finalPrompt = `${processData.prompt} ${finalPrompt}`;
        }
    }

    // 품질 향상 키워드 추가
    finalPrompt += ' Ultra high quality, professional result, 8K resolution.';

    return finalPrompt;
};

// banana-canvas 스타일의 이미지 분석 및 프롬프트 생성
export const suggestPromptFromImage = async (
    apiKey: string,
    imageBase64: string,
    mimeType: string,
    style?: string,
    customText?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const imageData = imageBase64.split(',')[1];

        let systemPrompt = `이미지를 분석하고 창의적인 프롬프트를 한국어로 생성해주세요.`;

        if (style) {
            const styleData = stylePrompts.find(s => s.name === style);
            if (styleData) {
                systemPrompt += ` ${style} 스타일로 변환하는 프롬프트를 만들어주세요.`;
            }
        }

        if (customText) {
            systemPrompt += ` 사용자 요청사항: ${customText}`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    { inlineData: { data: imageData, mimeType: mimeType } },
                    { text: systemPrompt }
                ],
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error('프롬프트 제안 오류:', error);
        return '이미지를 고품질로 향상시켜주세요.';
    }
};