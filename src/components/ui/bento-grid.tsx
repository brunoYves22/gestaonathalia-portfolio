"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "group relative p-5 rounded-2xl overflow-hidden transition-colors duration-200",
            "border border-white/10 bg-white/[0.03]",
            "hover:border-white/20",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            item.hasPersistentHover &&
              "shadow-[0_8px_40px_-12px_rgba(255,255,255,0.1)] border-white/20",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              item.hasPersistentHover && "opacity-100",
            )}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
                backgroundSize: "10px 10px",
              }}
            />
          </div>

          <div className="relative flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-300">
                {item.icon}
              </div>
              {item.status && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/70">
                  {item.status}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-foreground tracking-tight text-base">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-snug font-[450]">
                {item.description}
              </p>
            </div>

            {(item.tags || item.cta) && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {item.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-white/5 border border-white/10 transition-colors duration-200 hover:bg-white/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                {item.cta && (
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.cta}
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              "absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-white/10 to-transparent",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              item.hasPersistentHover && "opacity-100",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
