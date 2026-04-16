import type { PropsWithChildren } from "react";

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({ className = "", children }: PageContainerProps) {
  return <div className={["space-y-6 lg:space-y-7", className].join(" ")}>{children}</div>;
}
