import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../../src/components/ui/page-header";
import { PageLayout } from "../../src/components/ui/page-layout";
import { TemplateShelf } from "../../src/features/vird/components/template-shelf";

export default function VirdTemplatesRoute() {
  const router = useRouter();
  const { t } = useTranslation("vird");
  return (
    <PageLayout>
      <PageHeader title={t("vird:templates.listTitle")} leftIconName="arrow-left" onPressLeft={() => router.back()} />
      <TemplateShelf vertical />
    </PageLayout>
  );
}
