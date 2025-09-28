import React from 'react';

type UploadedImage = { file: File; base64: string };

interface DualImageUploaderProps {
  mainImage: UploadedImage | null;
  secondImage: UploadedImage | null;
  onMainImageUpload: (image: UploadedImage | null) => void;
  onSecondImageUpload: (image: UploadedImage | null) => void;
  disabled?: boolean;
}

const DualImageUploader: React.FC<DualImageUploaderProps> = ({
  mainImage,
  secondImage,
  onMainImageUpload,
  onSecondImageUpload,
  disabled = false
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isSecond: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const uploadedImage = { file, base64 };
        if (isSecond) {
          onSecondImageUpload(uploadedImage);
        } else {
          onMainImageUpload(uploadedImage);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (isSecond: boolean) => {
    if (isSecond) {
      onSecondImageUpload(null);
    } else {
      onMainImageUpload(null);
    }
  };

  const renderImageUploader = (
    image: UploadedImage | null,
    isSecond: boolean,
    title: string
  ) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {title}
      </label>
      {image ? (
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
          <img src={image.base64} alt={title} className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => handleRemove(isSecond)}
            disabled={disabled}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 hover:border-blue-500 transition-colors flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="mt-1 text-xs text-gray-500">클릭하여 업로드</p>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e, isSecond)}
            disabled={disabled}
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {renderImageUploader(mainImage, false, "기본 이미지 (필수)")}
        {renderImageUploader(secondImage, true, "합성할 이미지 (선택)")}
      </div>
      <p className="text-sm text-gray-500 text-center">
        두 이미지를 업로드하면 합성이 가능합니다
      </p>
    </div>
  );
};

export default DualImageUploader;