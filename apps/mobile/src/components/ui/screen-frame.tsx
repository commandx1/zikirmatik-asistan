import type { PropsWithChildren } from "react";
import { PageLayout, PageScrollView } from "./page-layout";

type ScreenFrameProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function ScreenFrame({ children, contentClassName }: ScreenFrameProps) {
  return (
    <PageLayout>
      <PageScrollView contentInnerClassName={contentClassName ?? "gap-5 px-5 py-5"}>{children}</PageScrollView>
    </PageLayout>
  );
}
