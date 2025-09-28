
export enum AspectRatio {
  SQUARE = '1:1',
  WIDE = '16:9',
  TALL = '9:16',
  LANDSCAPE = '4:3',
  PORTRAIT = '3:4',
}

// FIX: Added HarmCategory, HarmBlockThreshold, and SafetySetting types to fix import errors.
export enum HarmCategory {
    HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT",
}

export enum HarmBlockThreshold {
    BLOCK_NONE = "BLOCK_NONE",
    BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
    BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
    BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
}

export interface SafetySetting {
    category: HarmCategory;
    threshold: HarmBlockThreshold;
}
