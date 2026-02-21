import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

// Simple hash function to generate consistent colors
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate HSL color from hash
function getColorFromName(name: string): string {
  const hash = hashString(name);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

const sizeStyles = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const backgroundColor = getColorFromName(name);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-white',
        sizeStyles[size]
      )}
      style={{ backgroundColor }}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
}