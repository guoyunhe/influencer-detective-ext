import browser from 'webextension-polyfill';

interface I18nAttrProps {
  value: string | { [key: string]: string };
  locale?: string;
}

export default function I18nAttr({ value }: I18nAttrProps) {
  const locale = browser.i18n.getUILanguage();

  if (typeof value === 'string') {
    return <>{value}</>;
  }

  if (typeof value === 'object') {
    const lang = locale.split('-')[0]; // zh-CN -> zh
    return <>{value[lang] || value['en'] || ''}</>;
  }

  return <></>;
}
