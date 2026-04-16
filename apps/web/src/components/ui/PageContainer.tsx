import type { PropsWithChildren } from "react";

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({ className = "", children }: PageContainerProps) {
  return <div className={["space-y-8 lg:space-y-10", className].join(" ")}>{children}</div>;
}
