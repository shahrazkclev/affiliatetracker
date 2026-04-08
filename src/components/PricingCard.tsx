'use client';

import { motion } from 'framer-motion';

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
            className={`flex flex-col relative transition-all duration-300 rounded-xl p-8 
                ${isPopular 
                    ? "bg-zinc-950 border border-brand-orange/50 shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:border-brand-orange" 
                    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:shadow-lg"
                }`
            }
        >
            {isPopular && (
                <div className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                    Most Popular
                </div>
            )}
            
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <div className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-bold text-white">{price}</span>
                    <span className="text-zinc-400 mb-1">{interval}</span>
                </div>
                <ul className="space-y-3 mb-8">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center text-zinc-300">
                            <span className="text-emerald-500 mr-3">✓</span> {feature}
                        </li>
                    ))}
                </ul>
            </div>
            
            <form action={formAction as any} className="w-full">
                <input type="hidden" name="plan" value={planValue} />
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className={`w-full font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2
                        ${isPopular 
                            ? "bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/20" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        }`
                    }
                >
                    {buttonText}
                </motion.button>
            </form>
        </motion.div>
    );
}
