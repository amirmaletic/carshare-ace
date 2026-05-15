import { ReactNode } from "react";

interface Props {
  titel: string;
  beschrijving?: string;
  actie?: ReactNode;
}

export function PortaalPageHeader({ titel, beschrijving, actie }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{titel}</h1>
        {beschrijving && <p className="text-sm text-muted-foreground mt-1">{beschrijving}</p>}
      </div>
      {actie && <div className="flex items-center gap-2">{actie}</div>}
    </div>
  );
}
