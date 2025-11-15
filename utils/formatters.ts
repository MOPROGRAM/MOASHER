export const formatNumber = (num: number): string => {
    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(2)} تريليون`;
    }
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)} مليار`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)} مليون`;
    }
    if (num >= 1e3) {
      const formatted = (num / 1e3).toLocaleString('ar-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return `${formatted} ألف`;
    }
    return num.toLocaleString('ar-AR');
  };
  