"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  unit?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  label,
  unit,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value.replace(/_/g, " ");

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="form-label">
          {label}{" "}
          {unit && (
            <span className="text-gray-700 dark:text-gray-300 font-normal">
              ({unit})
            </span>
          )}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-field flex justify-between items-center w-full text-left cursor-pointer"
        >
          <span className="capitalize">{displayValue}</span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
            {options.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium"
                      : "text-gray-900 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/20" // TEAL hover!
                  }`}
                >
                  {opt.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
