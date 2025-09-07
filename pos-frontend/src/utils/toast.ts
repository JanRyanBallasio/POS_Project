import { toast } from 'sonner';

const successStyle = {
  '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
  '--normal-text': 'var(--color-white)',
  '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
} as React.CSSProperties;

const warningStyle = {
  '--normal-bg': 'light-dark(var(--color-amber-600), var(--color-amber-400))',
  '--normal-text': 'var(--color-white)',
  '--normal-border': 'light-dark(var(--color-amber-600), var(--color-amber-400))'
} as React.CSSProperties;

const errorStyle = {
  '--normal-bg': 'light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))',
  '--normal-text': 'var(--color-white)',
  '--normal-border': 'transparent'
} as React.CSSProperties;

export const showSuccessToast = (message: string, description?: string) => {
  return toast.success(message, {
    description,
    style: successStyle
  });
};
export const showWarningToast = (message: string, description?: string) => {
  return toast(message, {
    description,
    style: warningStyle
  });
};
export const showErrorToast = (message: string, description?: string) => {
  return toast.error(message, {
    description,
    style: errorStyle
  });
};

export const showInfoToast = (message: string, description?: string) => {
  return toast(message, {
    description
  });
};