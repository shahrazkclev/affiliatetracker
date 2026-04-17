'use client';
import { useEffect, useState } from 'react';

export function CountUp({
    end,
    decimals = 0,
    prefix = '',
    duration = 1000
}: {
    end: number;
    decimals?: number;
    prefix?: string;
    duration?: number;
}) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // easeOutExpo
            const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
            
            setCount(end * easeOut);

            if (progress < duration) {
                animationFrame = requestAnimationFrame(step);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{prefix}{count.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}
