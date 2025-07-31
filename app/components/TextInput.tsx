import { ChangeEventHandler, FocusEventHandler, useState } from "react";

interface TextInputProps {
    string: string;
    placeholder?: string;
    inputType?: string;
    error?: string;
    onUpdate: (value: string) => void;
    className?: string;
}

export default function TextInput({ string, placeholder, inputType = "text", error, onUpdate, className }: TextInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative w-full group">
            {/* Animated gradient border */}
            <div className={`
                absolute inset-0 rounded-2xl p-[1px] transition-all duration-500
                ${isFocused 
                    ? 'bg-gradient-to-r from-[#20DDBB] via-[#8A2BE2] to-[#20DDBB] opacity-100' 
                    : 'bg-gradient-to-r from-[#2A2B3F] to-[#2A2B3F] opacity-100'
                }
            `}>
                <div className="w-full h-full bg-[#14151F]/90 rounded-2xl" />
            </div>

                        {/* Floating placeholder */}
            {placeholder && (
                <div className={`
                    absolute left-6 transition-all duration-300 pointer-events-none z-10
                    ${string || isFocused 
                        ? 'top-[-8px] text-xs text-[#20DDBB] bg-[#1E1F2E] px-3 rounded-lg' 
                        : 'top-1/2 -translate-y-1/2 text-sm text-[#818BAC]/70'
                    }
                `}>
                    {placeholder}
                </div>
            )}

            {/* Main input */}
            <input
                type={inputType}
                value={string}
                placeholder={isFocused ? '' : placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    ${className}
                    relative w-full h-14 px-6 py-4 rounded-2xl
                    bg-transparent text-white text-base
                    border-0 transition-all duration-300
                    focus:outline-none focus:ring-0
                    placeholder-transparent
                    ${error ? 'text-red-300' : 'text-white'}
                `}
                onChange={(e) => onUpdate(e.target.value)}
            />

            {/* Glow effect on focus */}
            {isFocused && !error && (
                <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r from-[#20DDBB]/20 via-[#8A2BE2]/20 to-[#20DDBB]/20 pointer-events-none -z-10" />
            )}

            {/* Error state indicator */}
            {error && (
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-red-500 to-pink-500">
                    <div className="w-full h-full bg-[#14151F]/90 rounded-2xl" />
                </div>
            )}
        </div>
    );
}