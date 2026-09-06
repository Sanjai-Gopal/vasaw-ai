import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80",
        className
      )}
    >
      <div>
        <h1 className="text-[23px] font-display font-extrabold text-slate-950 tracking-[-0.035em] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-slate-500 font-normal tracking-[-0.005em] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}