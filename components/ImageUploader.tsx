import React, { useCallback, useState } from 'react';

type UploadedImage = { file: File; base64: string };

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
  uploadedImage: UploadedImage | null;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          onImageUpload({ file, base64: e.target.result });
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [disabled, handleFileChange]);

  const onClick = () => {
    document.getElementById('image-upload-input')?.click();
  };

  return (
    <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
            편집할 이미지
        </label>
        <div
            onClick={onClick}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center text-center p-4 cursor-pointer transition-colors duration-300
            ${disabled ? 'cursor-not-allowed bg-gray-100/50' : 'hover:border-blue-500 hover:bg-blue-50'}
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
            <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={disabled}
            />
            {uploadedImage ? (
                <img src={uploadedImage.base64} alt="Uploaded preview" className="max-h-full max-w-full object-contain rounded-md" />
            ) : (
                <div className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="mt-2 font-semibold text-gray-700">이미지를 여기에 끌어다 놓거나 클릭하여 업로드하세요</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP 등 지원</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ImageUploader;