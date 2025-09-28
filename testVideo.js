// 비디오 생성 API 직접 테스트
async function testVideoGeneration(apiKey) {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning';

    const requestBody = {
        instances: [{
            prompt: "A beautiful sunset at the beach"
        }],
        parameters: {
            numberOfVideos: 1,
            aspectRatio: "16:9"
        }
    };

    try {
        console.log('Attempting video generation with URL:', API_URL);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', data);
            return false;
        }

        console.log('Success! Response:', data);
        return true;

    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

// 사용 가능한 모델 목록 조회
async function listAvailableModels(apiKey) {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    try {
        console.log('Fetching available models...');

        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        console.log('Available models:');
        if (data.models) {
            data.models.forEach(model => {
                console.log(`- ${model.name}: ${model.displayName || 'N/A'}`);
                if (model.supportedGenerationMethods) {
                    console.log(`  Supports: ${model.supportedGenerationMethods.join(', ')}`);
                }
            });

            // 비디오 관련 모델 찾기
            const videoModels = data.models.filter(m =>
                m.name.includes('veo') ||
                m.name.includes('video') ||
                (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateVideo'))
            );

            if (videoModels.length > 0) {
                console.log('\nVideo-related models found:');
                videoModels.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log('\nNo video generation models found in the available models list.');
            }
        }

        return data;

    } catch (error) {
        console.error('Failed to list models:', error);
        return null;
    }
}

// 테스트 실행
console.log('=== Gemini Video Generation Test ===\n');
console.log('Note: Replace YOUR_API_KEY with your actual API key to test\n');

// 사용법:
// const apiKey = 'YOUR_API_KEY';
// listAvailableModels(apiKey).then(() => testVideoGeneration(apiKey));

export { testVideoGeneration, listAvailableModels };