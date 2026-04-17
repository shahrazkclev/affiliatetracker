"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface DismissibleAlertProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DismissibleAlert({ id, children, className = "" }: DismissibleAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const dismissed = localStorage.getItem(`dismissed_${id}`);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [id]);

  if (!hasMounted || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`dismissed_${id}`, "true");
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-full text-current opacity-50 hover:opacity-100 hover:bg-black/10 transition-all focus:outline-none"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
