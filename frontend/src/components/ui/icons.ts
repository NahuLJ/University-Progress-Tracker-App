import {
    BookOpen,
    Search,
    School,
    GraduationCap,
    BarChart3,
    Clock,
    Briefcase,
    TrendingUp,
    AlertTriangle,
    CircleDot,
    X,
    CheckCircle2,
    Loader2,
    Circle,
    CalendarDays,
} from 'lucide-react';

export const Icons = {
    books: BookOpen,
    search: Search,
    school: School,
    graduation: GraduationCap,
    chart: BarChart3,
    clock: Clock,
    briefcase: Briefcase,
    trending: TrendingUp,
    warning: AlertTriangle,
    dot: CircleDot,
    close: X,
    check: CheckCircle2,
    loading: Loader2,
    circle: Circle,
    calendar: CalendarDays,
} as const;

export type IconName = keyof typeof Icons;
