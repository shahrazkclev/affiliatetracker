'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface PricingCardProps {
    title: string;
    price: string;
    interval?: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    formAction: string | ((formData: FormData) => void);
    planValue: string;
    index: number;
}

export default function PricingCard({
    title,
    price,
    interval = '/mo',
    features,
    isPopular = false,
    buttonText,
    formAction,
    planValue,
    index,
}: PricingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex flex-col relative transition-shadow duration-300 rounded-2xl p-8 overflow-hidden group
                ${isPopular 
                    ? "bg-zinc-950 border-zinc-800 shadow-md" 
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                } border backdrop-blur-sm`
            }
        >
            {isPopular && (
                <div className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-bl-xl shadow flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                </div>
            )}
            
            <div className="flex-1 relative z-10">
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
                <div className="flex items-end gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                    <span className="text-sm text-zinc-500 font-medium mb-1.5">{interval}</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm text-zinc-300 gap-3">
                            <span className="mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                            </span> 
                            <span className="leading-relaxed">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <form action={formAction as any} className="w-full mt-auto relative z-10">
                <input type="hidden" name="plan" value={planValue} />
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className={`w-full font-bold py-3.5 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2
                        ${isPopular 
                            ? "bg-brand-orange hover:bg-orange-600 text-white" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                        }`
                    }
                >
                    {buttonText}
                </motion.button>
            </form>
        </motion.div>
    );
}
