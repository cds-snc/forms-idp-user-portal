import React from "react";
import { cn } from "@lib/utils";

export const Hint = ({
  children,
  className,
  id,
}: {
  children: string | undefined;
  id?: string;
  className?: string;
}): React.ReactElement => {
  const classes = cn("mb-2 text-sm", className);
  return (
    <div id={`hint-${id}`} className={classes} data-testid="hint">
      {children}
    </div>
  );
};
