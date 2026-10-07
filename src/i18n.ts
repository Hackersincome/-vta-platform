import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLanguages = [
  { locale: 'en', name: 'English', code: 'EN', region: 'United States', flag: '🇺🇸', direction: 'ltr' },
  { locale: 'ar', name: 'العربية', code: 'AR', region: 'Saudi Arabia', flag: '🇸🇦', direction: 'rtl' },
  { locale: 'tr', name: 'Türkçe', code: 'TR', region: 'Türkiye', flag: '🇹🇷', direction: 'ltr' },
  { locale: 'fr', name: 'Français', code: 'FR', region: 'France', flag: '🇫🇷', direction: 'ltr' },
  { locale: 'it', name: 'Italiano', code: 'IT', region: 'Italy', flag: '🇮🇹', direction: 'ltr' },
  { locale: 'es', name: 'Español', code: 'ES', region: 'Spain', flag: '🇪🇸', direction: 'ltr' },
  { locale: 'de', name: 'Deutsch', code: 'DE', region: 'Germany', flag: '🇩🇪', direction: 'ltr' },
  { locale: 'pt', name: 'Português', code: 'PT', region: 'Brazil', flag: '🇧🇷', direction: 'ltr' },
  { locale: 'ru', name: 'Русский', code: 'RU', region: 'Russia', flag: '🇷🇺', direction: 'ltr' },
  { locale: 'zh', name: '中文', code: 'ZH', region: 'China', flag: '🇨🇳', direction: 'ltr' },
  { locale: 'ja', name: '日本語', code: 'JA', region: 'Japan', flag: '🇯🇵', direction: 'ltr' },
  { locale: 'ko', name: '한국어', code: 'KO', region: 'South Korea', flag: '🇰🇷', direction: 'ltr' },
  { locale: 'hi', name: 'हिन्दी', code: 'HI', region: 'India', flag: '🇮🇳', direction: 'ltr' },
  { locale: 'fa', name: 'فارسی', code: 'FA', region: 'Iran', flag: '🇮🇷', direction: 'rtl' },
  { locale: 'ur', name: 'اردو', code: 'UR', region: 'Pakistan', flag: '🇵🇰', direction: 'rtl' },
  { locale: 'nl', name: 'Nederlands', code: 'NL', region: 'Netherlands', flag: '🇳🇱', direction: 'ltr' },
  { locale: 'pl', name: 'Polski', code: 'PL', region: 'Poland', flag: '🇵🇱', direction: 'ltr' },
  { locale: 'el', name: 'Ελληνικά', code: 'EL', region: 'Greece', flag: '🇬🇷', direction: 'ltr' },
  { locale: 'uk', name: 'Українська', code: 'UK', region: 'Ukraine', flag: '🇺🇦', direction: 'ltr' },
  { locale: 'vi', name: 'Tiếng Việt', code: 'VI', region: 'Vietnam', flag: '🇻🇳', direction: 'ltr' },
  { locale: 'id', name: 'Bahasa Indonesia', code: 'ID', region: 'Indonesia', flag: '🇮🇩', direction: 'ltr' },
  { locale: 'th', name: 'ไทย', code: 'TH', region: 'Thailand', flag: '🇹🇭', direction: 'ltr' },
  { locale: 'sw', name: 'Kiswahili', code: 'SW', region: 'Kenya', flag: '🇰🇪', direction: 'ltr' },
  { locale: 'bn', name: 'বাংলা', code: 'BN', region: 'Bangladesh', flag: '🇧🇩', direction: 'ltr' },
  { locale: 'he', name: 'עברית', code: 'HE', region: 'Israel', flag: '🇮🇱', direction: 'rtl' },
  { locale: 'ms', name: 'Bahasa Melayu', code: 'MS', region: 'Malaysia', flag: '🇲🇾', direction: 'ltr' },
] as const;

const en = {
  home: {
    enterTerminal: 'Enter the terminal',
    closeAccess: 'Close client access',
    clientAccess: 'Client access',
    chooseAccess: 'Choose how you would like to continue.',
    momentumLayers: '04 decision layers',
    momentumPlatform: 'VTA Web Trading Terminal',
    momentumIntegration: 'Source integration prepared',
  },
  auth: {
    previewAccess: 'DEMO / PREVIEW ACCESS',
    previewRegistration: 'PREVIEW REGISTRATION',
    demoVerification: 'DEMO / PREVIEW VERIFICATION',
    username: 'Username',
    signIn: 'Sign in',
    signUp: 'Sign up',
    createAccount: 'Create account',
    usernameOrEmail: 'Username or email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    backToAccess: 'Back to client access',
    backToSignIn: 'Back to sign in',
    enterAddress: 'Enter your username or email',
    sendCode: 'Continue / Send code',
    confirmationTitle: 'Preview confirmation',
    confirmationBody: 'In production, a confirmation code would be sent to this email. No email was sent in this preview.',
    noEmailSent: 'Preview only: no email was sent and no verification service is connected.',
    codeSent: 'We’ve prepared a demo confirmation code. No email was sent.',
    demoCodeHint: 'Use preview code 246810 to continue this demo.',
    invalidDemoCode: 'Use the displayed preview code to continue this demo flow.',
    confirmationCode: 'Confirmation code',
    verifyCode: 'Verify code',
    resendCode: 'Resend code',
    codeResent: 'Preview code refreshed. No email was sent.',
    codeVerified: 'Demo code verified for this preview.',
    registrationComplete: 'Preview registration complete',
    registrationBody: 'Your information was validated in this browser only. No account was created, no details were saved or sent, and no email was generated.',
    previewCredentials: 'Preview login details',
    copyDetails: 'Copy details',
    credentialsCopied: 'Login details copied. Share them with your preview link.',
    copyUnavailable: 'Copy is unavailable here. You can select the login details above.',
    demoSessionOnly: 'Preview session only',
    demoSessionNotice: 'This does not authenticate a production identity or enable account, trading, or funding actions.',
    demoIntro: 'Explore the sample client dashboard with the isolated preview login.',
    previewCredentialsNote: 'These preview details only open the sample client dashboard.',
    signInError: 'Those demo sign-in details could not be verified. Try admin and admin1234.',
    signUpIntro: 'Preview only · Complete each field to review the registration experience.',
    firstName: 'First name',
    lastName: 'Last name',
    emailAddress: 'Email address',
    dateOfBirth: 'Date of birth',
    phone: 'Phone',
    country: 'Country',
    selectCountry: 'Select country',
    address: 'Address',
    confirmPassword: 'Confirm password',
    acknowledgements: 'Required acknowledgements',
    acceptTerms: 'I agree to the Terms & Conditions.',
    acceptPrivacy: 'I acknowledge the Privacy Policy.',
    acceptRisk: 'I have read the Risk Disclosure.',
    reviewRegistration: 'Review registration',
    registrationFoot: 'Preview mode validates this form locally and does not transmit or retain your information.',
    dateError: 'Date of birth must be in the past.',
    passwordError: 'The passwords do not match. Please confirm your password again.',
    registerNotConnected: 'Production registration is not connected.',
    registerNotConnectedBody: 'Account creation requires VTA’s configured identity and backend services.',
    signInTitle: 'Sign in to your account',
    signUpTitle: 'Create a client profile',
    recoveryTitle: 'Reset your password.',
    verificationTitle: 'Confirm this preview request.',
    back: 'Back',
    clientLogin: 'CLIENT LOGIN',
    clientRegistration: 'CLIENT REGISTRATION',
    authHeroSignIn: 'Welcome back to your VTA client area.',
    authHeroSignUp: 'A considered start to your VTA experience.',
    authDescriptionSignIn: 'Use the isolated preview sign-in to explore the client area. Production identity remains a separate, protected flow.',
    authDescriptionSignUp: 'Complete the preview form to review the onboarding experience. No account or identity record will be created here.',
    featureIdentity: 'Production identity remains server-side',
    featureSession: 'Demo session is isolated to this browser tab',
    featureFinancial: 'No real accounts or financial activity',
    accessFaq: 'Read access FAQ',
    newToVta: 'New to VTA? Create an account',
    productionAccess: 'Production access',
    productionIdentity: 'Continue with configured identity',
    productionFoot: 'Real client access continues through the separately configured identity provider.',
    accountCreated: 'Preview form complete',
    signInAgain: 'Return to sign in',
    signInConfirmation: 'We’ve prepared a demo confirmation code. No email was sent.',
  },
  language: {
    selector: 'Language',
    search: 'Search languages',
    available: 'Available languages',
    fallback: 'Interface text currently uses English until this language is translated.',
    noResults: 'No languages match your search.',
  },
};

export const languageResources = { en: { translation: en } };

function readSavedLocale(): string {
  if (typeof document === 'undefined') return 'en';
  const saved = document.cookie.split('; ').find((part) => part.startsWith('vta-locale='))?.split('=')[1];
  return supportedLanguages.some(({ locale }) => locale === saved) ? (saved ?? 'en') : 'en';
}

void i18n.use(initReactI18next).init({
  resources: languageResources,
  lng: readSavedLocale(),
  fallbackLng: 'en',
  supportedLngs: supportedLanguages.map(({ locale }) => locale),
  nonExplicitSupportedLngs: true,
  load: 'languageOnly',
  interpolation: { escapeValue: false },
  initAsync: false,
});

if (typeof document !== 'undefined') {
  const locale = readSavedLocale();
  document.documentElement.lang = locale;
  document.documentElement.dir = supportedLanguages.find(({ locale: code }) => code === locale)?.direction ?? 'ltr';
}

export default i18n;
export type SupportedLocale = (typeof supportedLanguages)[number]['locale'];
export type LocaleDirection = (typeof supportedLanguages)[number]['direction'];
export type TranslationCatalog = typeof en;
export type LocaleResources = Partial<Record<SupportedLocale, { translation: TranslationCatalog }>>;

export function getLocaleDirection(locale: string): LocaleDirection {
  return supportedLanguages.find((language) => language.locale === locale)?.direction ?? 'ltr';
}

export function hasLocaleTranslations(locale: string) {
  return i18n.hasResourceBundle(normalizeLocale(locale), 'translation');
}

export function registerLocaleResources(resources: LocaleResources) {
  for (const [locale, value] of Object.entries(resources)) {
    if (value) i18n.addResourceBundle(locale, 'translation', value.translation, true, true);
  }
}

export function getLocaleMetadata(locale: string) {
  return supportedLanguages.find((language) => language.locale === locale) ?? supportedLanguages[0];
}

export function normalizeLocale(locale: string): SupportedLocale {
  const shortLocale = locale.split('-')[0];
  return supportedLanguages.find(({ locale: supported }) => supported === shortLocale)?.locale ?? 'en';
}

export function getLocaleLabel(locale: string) {
  return getLocaleMetadata(normalizeLocale(locale)).name;
}

export function getLocaleCode(locale: string) {
  return getLocaleMetadata(normalizeLocale(locale)).code;
}

export function getLocaleFlag(locale: string) {
  return getLocaleMetadata(normalizeLocale(locale)).flag;
}

export function getLocaleRegionName(locale: string) {
  return getLocaleMetadata(normalizeLocale(locale)).region;
}

export function getLocaleLanguages() {
  return supportedLanguages;
}

export function getActiveLocale() {
  return normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
}

export function getActiveLocaleMetadata() {
  return getLocaleMetadata(getActiveLocale());
}

export function setLocale(locale: string) {
  const normalized = normalizeLocale(locale);
  const metadata = getLocaleMetadata(normalized);
  if (typeof document !== 'undefined') {
    document.cookie = `vta-locale=${normalized}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = normalized;
    document.documentElement.dir = metadata.direction;
  }
  return i18n.changeLanguage(normalized);
}

export function getLocaleState() {
  return { locale: getActiveLocale(), metadata: getActiveLocaleMetadata(), direction: getLocaleDirection(getActiveLocale()) };
}

export function getLocaleDocumentAttributes(locale: string) {
  return { lang: normalizeLocale(locale), dir: getLocaleDirection(locale) };
}

export function getLocaleFallback(locale: string) {
  return hasLocaleTranslations(normalizeLocale(locale)) ? null : 'en';
}

export function getLocaleMessageKeyCatalog() {
  return Object.keys(en).reduce<Record<string, string[]>>((catalog, namespace) => {
    catalog[namespace] = Object.keys(en[namespace as keyof typeof en]);
    return catalog;
  }, {});
}

export function getLocaleTranslation(locale: string, key: string) {
  return i18n.t(key, { lng: normalizeLocale(locale) });
}

export function getLocaleResource(locale: string) {
  return i18n.getResourceBundle(normalizeLocale(locale), 'translation');
}

export function getLocaleCurrentDirection() {
  return getLocaleDirection(getActiveLocale());
}

export function isRightToLeftLocale(locale: string) {
  return getLocaleDirection(locale) === 'rtl';
}

export function getLocaleActiveResource(locale: string) {
  return hasLocaleTranslations(normalizeLocale(locale)) ? getLocaleResource(locale) : en;
}

export function getLocaleActiveResourceBundle() {
  return getLocaleActiveResource(getActiveLocale());
}

export function addLocaleResources(locale: SupportedLocale, resources: TranslationCatalog) {
  i18n.addResourceBundle(locale, 'translation', resources, true, true);
}

export function getSupportedLocaleCodes() {
  return supportedLanguages.map(({ locale }) => locale);
}

export function getTranslationKeys(namespace: keyof typeof en) {
  return Object.keys(en[namespace]);
}

export function localeExists(locale: string) {
  return supportedLanguages.some((language) => language.locale === normalizeLocale(locale));
}

export function getLocaleByCode(code: string) {
  return supportedLanguages.find((language) => language.code.toLowerCase() === code.toLowerCase());
}

export function getLocaleByName(name: string) {
  return supportedLanguages.find((language) => language.name.toLowerCase() === name.toLowerCase());
}

export function getLocaleByRegion(region: string) {
  return supportedLanguages.find((language) => language.region.toLowerCase() === region.toLowerCase());
}

export function getLocaleFromCode(code: string) {
  return getLocaleByCode(code)?.locale ?? 'en';
}

export function getLocaleSupportMetadata(locale: string) {
  return { ...getLocaleMetadata(locale), hasTranslations: hasLocaleTranslations(locale) };
}

export function getLocaleSearchableLanguages(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return supportedLanguages;
  return supportedLanguages.filter((language) => `${language.name} ${language.code} ${language.region} ${language.locale}`.toLowerCase().includes(normalizedQuery));
}

export function getLocaleSearchText(locale: string) {
  const language = getLocaleMetadata(locale);
  return [language.name, language.code, language.region, language.locale].join(' ');
}

export function getLocaleHumanReadable(locale: string) {
  const language = getLocaleMetadata(locale);
  return `${language.flag} ${language.name} · ${language.code}`;
}

export function getLocaleResourceNamespaces(locale: string) {
  return Object.keys(i18n.getResourceBundle(normalizeLocale(locale), 'translation') ?? {});
}

export function getCurrentTranslationStatus() {
  return hasLocaleTranslations(getActiveLocale());
}

export function getLocaleTranslationsStatusMap() {
  return supportedLanguages.reduce<Record<string, boolean>>((result, language) => {
    result[language.locale] = hasLocaleTranslations(language.locale);
    return result;
  }, {});
}

export function getLocaleLanguageMap() {
  return supportedLanguages.reduce<Record<string, typeof supportedLanguages[number]>>((result, language) => {
    result[language.locale] = language;
    return result;
  }, {});
}

export function getLocaleNameAndCode(locale: string) {
  const { name, code } = getLocaleMetadata(locale);
  return { name, code };
}

export function getLocaleFlagCode(locale: string) {
  const { flag, code } = getLocaleMetadata(locale);
  return { flag, code };
}

export function getLocaleRegionFlag(locale: string) {
  const language = getLocaleMetadata(locale);
  return { region: language.region, flag: language.flag };
}

export function getLocaleCodeAndDirection(locale: string) {
  const language = getLocaleMetadata(locale);
  return { code: language.code, direction: language.direction };
}

export function getLocaleRegionAndDirection(locale: string) {
  const language = getLocaleMetadata(locale);
  return { region: language.region, direction: language.direction };
}

export function getLocaleFlagAndName(locale: string) {
  const language = getLocaleMetadata(locale);
  return { flag: language.flag, name: language.name };
}

export function getLocaleCodeAndRegion(locale: string) {
  const language = getLocaleMetadata(locale);
  return { code: language.code, region: language.region };
}

export function getLocaleDisplayMetadata(locale: string) {
  const language = getLocaleMetadata(locale);
  return { ...language, translated: hasLocaleTranslations(language.locale) };
}

export function getLocaleDirectionMetadata(locale: string) {
  const language = getLocaleMetadata(locale);
  return { locale: language.locale, direction: language.direction };
}

export function getLocaleSearchResults(query: string) {
  return getLocaleSearchableLanguages(query);
}

export function getLocaleSourceResource() {
  return en;
}

export function getLocaleCatalogVersion() {
  return 1;
}

export function getLocaleFallbackLanguage() {
  return 'en';
}

export function getLocaleTranslationCoverage(locale: string) {
  return hasLocaleTranslations(locale) ? 'translated' : 'english-fallback';
}
