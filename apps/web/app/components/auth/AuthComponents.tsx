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

export const GoogleButton = ({
  onClick,
  disabled = false,
  label = 'Sign up with Google',
}: {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-lg">🔍</span>
      <span className="text-label-mono font-label-mono">{label}</span>
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
