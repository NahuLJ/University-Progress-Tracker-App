import { useCallback, useRef } from 'react';

export function useDebounce<T>(delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    return useCallback((callback: (value: T) => void, value: T) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(value);
        }, delay);
    }, [delay]);
}