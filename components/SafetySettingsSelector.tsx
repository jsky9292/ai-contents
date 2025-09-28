// FIX: Implemented the SafetySettingsSelector component.
import React from 'react';
import { HarmCategory, HarmBlockThreshold, SafetySetting } from '../types';

interface SafetySettingsSelectorProps {
  safetySettings: SafetySetting[];
  onSettingsChange: (settings: SafetySetting[]) => void;
  disabled: boolean;
}

const harmCategoryLabels: Record<HarmCategory, string> = {
    [HarmCategory.HARM_CATEGORY_HARASSMENT]: "괴롭힘",
    [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: "증오심 표현",
    [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: "성적으로 노골적인 콘텐츠",
    [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: "위험한 콘텐츠",
};

const blockThresholdOptions = [
    { value: HarmBlockThreshold.BLOCK_NONE, label: "모두 허용" },
    { value: HarmBlockThreshold.BLOCK_ONLY_HIGH, label: "높음 이상 차단" },
    { value: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, label: "중간 이상 차단" },
    { value: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE, label: "낮음 이상 차단" },
];

const SafetySettingsSelector: React.FC<SafetySettingsSelectorProps> = ({ safetySettings, onSettingsChange, disabled }) => {

    const handleThresholdChange = (category: HarmCategory, threshold: HarmBlockThreshold) => {
        const newSettings = safetySettings.map(setting =>
            setting.category === category ? { ...setting, threshold } : setting
        );
        onSettingsChange(newSettings);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                안전 설정
            </label>
            <div className="space-y-4">
                {safetySettings.map(setting => (
                    <div key={setting.category} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <label htmlFor={`safety-${setting.category}`} className="block text-sm font-medium text-gray-400 mb-1 sm:mb-0">
                            {harmCategoryLabels[setting.category]}
                        </label>
                        <select
                            id={`safety-${setting.category}`}
                            value={setting.threshold}
                            onChange={(e) => handleThresholdChange(setting.category, e.target.value as HarmBlockThreshold)}
                            disabled={disabled}
                            className="w-full sm:w-auto bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {blockThresholdOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SafetySettingsSelector;
