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
            {/* Background container with proper border radius */}
            <div className={`
                absolute inset-0 rounded-3xl transition-all duration-500
                ${isFocused 
                    ? 'bg-gradient-to-r from-[#20DDBB] via-[#8A2BE2] to-[#20DDBB] p-[1px]' 
                    : string 
                        ? 'bg-[#2A2B3F]' 
                        : 'bg-[#2A2B3F]'
                }
                ${error ? 'bg-gradient-to-r from-red-500 to-pink-500 p-[1px]' : ''}
            `}>
                <div className={`
                    w-full h-full rounded-3xl transition-all duration-300
                    ${isFocused 
                        ? 'bg-[#1E1F2E]' 
                        : string 
                            ? 'bg-[#1E1F2E]' 
                            : 'bg-[#14151F]/90'
                    }
                    ${error ? 'bg-[#1E1F2E]' : ''}
                `} />
            </div>

            {/* Main input */}
            <input
                type={inputType}
                value={string}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    ${className}
                    relative w-full h-14 px-6 py-4 rounded-3xl
                    bg-transparent text-white text-base
                    border-0 transition-all duration-300
                    focus:outline-none focus:ring-0
                    placeholder:text-[#818BAC] placeholder:text-sm
                    ${error ? 'text-red-300' : 'text-white'}
                `}
                onChange={(e) => onUpdate(e.target.value)}
            />

            {/* Glow effect on focus */}
            {isFocused && !error && (
                <div className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-r from-[#20DDBB]/20 via-[#8A2BE2]/20 to-[#20DDBB]/20 pointer-events-none -z-10" />
            )}
        </div>
    );
}