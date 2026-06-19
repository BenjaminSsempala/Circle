// Material Icons using Unicode
export const MaterialIcon = ({ name, className = '' }: { name: string; className?: string }) => {
  const icons: Record<string, string> = {
    arrow_forward: '→',
    close: '✕',
    format_quote: '"',
    verified_user: '✓',
    smart_display: '📺',
    add_circle: '+',
    check_circle: '✓',
  };

  return (
    <span className={`material-icon ${className}`}>
      {icons[name] || name}
    </span>
  );
};

export const OAuthButton = ({
  provider,
  onClick,
}: {
  provider: 'google' | 'apple';
  onClick?: () => void;
}) => {
  const icons = {
    google: '🔍',
    apple: '🍎',
  };

  const labels = {
    google: 'Google',
    apple: 'Apple',
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 active:scale-95 shadow-sm"
    >
      <span className="text-lg">{icons[provider]}</span>
      <span className="text-label-mono font-label-mono">{labels[provider]}</span>
    </button>
  );
};

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const GoogleButton = ({
  onClick,
  disabled = false,
  label = 'Continue with Google',
}: {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <GoogleLogo />
      <span className="text-label-mono font-label-mono text-[#3c4043]">{label}</span>
    </button>
  );
};

export const ErrorBanner = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <div className="w-full bg-error-container text-on-error-container px-4 py-3 rounded-lg border border-error mb-4">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
