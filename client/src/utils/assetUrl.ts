const API_BASE = import.meta.env.VITE_API_URL || '';

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const normalizedBase = API_BASE.replace(/\/$/, '');
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;

  return `${normalizedBase}${normalizedPath}`;
};
