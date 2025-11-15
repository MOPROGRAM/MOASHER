interface Suffixes {
    trillion: string;
    billion: string;
    million: string;
    thousand: string;
}

export const formatNumber = (num: number, locale: string = 'en-US', suffixes: Suffixes): string => {
    const localeSuffix = (value: string) => locale.startsWith('ar') ? value : '';
    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(2)}${localeSuffix(' ')}${suffixes.trillion}`;
    }
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}${localeSuffix(' ')}${suffixes.billion}`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}${localeSuffix(' ')}${suffixes.million}`;
    }
    if (num >= 1e3) {
      const formatted = (num / 1e3).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return `${formatted}${localeSuffix(' ')}${suffixes.thousand}`;
    }
    return num.toLocaleString(locale);
};
