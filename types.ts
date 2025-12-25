
export interface DiagnosisResult {
  crop: string;
  disease: string;
  prescription: string;
  dosage: string;
  timing: string;
  safety: string;
  medicineName: string;
  medicineImage?: string;
  originalText?: string;
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  TELUGU = 'Telugu',
  TAMIL = 'Tamil',
  MARATHI = 'Marathi',
  KANNADA = 'Kannada',
  MALAYALAM = 'Malayalam'
}

export const LANGUAGE_DISPLAY: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.HINDI]: 'हिन्दी (Hindi)',
  [Language.TELUGU]: 'తెలుగు (Telugu)',
  [Language.TAMIL]: 'தமிழ் (Tamil)',
  [Language.MARATHI]: 'മരാഠി (Marathi)',
  [Language.KANNADA]: 'കന്നഡ (Kannada)',
  [Language.MALAYALAM]: 'മലയാളം (Malayalam)'
};

export interface AppState {
  soundEnabled: boolean;
  selectedLang: Language;
}
