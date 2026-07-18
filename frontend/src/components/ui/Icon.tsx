import type { LucideIcon } from 'lucide-react';
import { Icons, type IconName } from './icons';

export type { IconName };

interface IconProps {
    name: IconName;
    className?: string;
    strokeWidth?: number;
}

export function Icon({ name, className, strokeWidth = 2 }: IconProps) {
    const Component: LucideIcon = Icons[name];
    return <Component className={className} strokeWidth={strokeWidth} />;
}
