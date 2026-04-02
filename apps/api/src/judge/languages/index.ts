import { python } from './python.js';
import { javascript } from './javascript.js';
import { cpp } from './cpp.js';
import { java } from './java.js';

export interface LanguageConfig {
  name: string;
  image: string;
  extension: string;
  compileCmd: string | null;
  runCmd: string;
  boilerplate: string;
}

const languages: Record<string, LanguageConfig> = {
  python,
  javascript,
  cpp,
  java,
};

export function getLanguage(name: string): LanguageConfig {
  const lang = languages[name.toLowerCase()];
  if (!lang) {
    throw new Error(
      `Unsupported language: ${name}. Supported: ${getSupportedLanguages().join(', ')}`,
    );
  }
  return lang;
}

export function getSupportedLanguages(): string[] {
  return Object.keys(languages);
}
