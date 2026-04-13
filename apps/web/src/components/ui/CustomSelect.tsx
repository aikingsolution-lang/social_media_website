"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type CustomSelectOption = {
    label: string;
    value: string;
};

type CustomSelectProps = {
    label?: string;
    value: string;
    options: CustomSelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function CustomSelect({
    label,
    value,
    options,
    onChange,
    placeholder = "Select option",
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        <div className="w-full" ref={wrapperRef}>
            {label ? <label className="label-text">{label}</label> : null}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className={`flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm text-white outline-none transition hover:border-[#7367ff]/40 ${open ? "border-[#7367ff]/50 ring-2 ring-[#7367ff]/20" : ""
                        }`}
                >
                    <span className={selectedOption ? "text-white" : "text-white/35"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <ChevronDown
                        className={`h-4 w-4 text-white/55 transition ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {open ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1533] shadow-2xl backdrop-blur-xl">
                        <div className="max-h-64 overflow-y-auto py-2">
                            {options.map((option) => {
                                const isSelected = option.value === value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${isSelected
                                                ? "bg-[#2c68c9] text-white"
                                                : "text-white/80 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected ? <Check className="h-4 w-4" /> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}