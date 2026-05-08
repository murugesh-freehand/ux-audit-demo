import React from "react";

export function DataTableHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-5 py-3 min-h-[64px]">
      <div className="min-w-0">
        <h1 className="text-[20px] leading-7 font-bold text-slate-950 tracking-[-0.012em]">
          {title}
        </h1>
        {description && (
          <p className="text-xs leading-4 text-slate-500 mt-0.5 tracking-[-0.006em]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  );
}
