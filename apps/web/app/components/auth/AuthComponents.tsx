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
