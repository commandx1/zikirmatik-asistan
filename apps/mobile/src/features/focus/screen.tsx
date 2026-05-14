import { View } from "react-native";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { ZikirFilterTabs } from "./components/zikir-filter-tabs";
import { ZikirListSection } from "./components/zikir-list-section";
import { ZikirlerimHeader } from "./components/zikirlerim-header";
import { useZikirlerim, ZikirlerimProvider } from "./context/zikirlerim-context";

export function FocusScreen() {
  return (
    <ZikirlerimProvider>
      <FocusContent />
    </ZikirlerimProvider>
  );
}

function FocusContent() {
  const { refresh, isRefreshing } = useZikirlerim();

  return (
    <PageLayout>
      <View className="relative flex-1 w-full">
        <ZikirlerimHeader />
        <PageScrollView contentInnerClassName="w-full" bottomPadding={32} onRefresh={refresh} refreshing={isRefreshing}>
          <ZikirFilterTabs />
          <ZikirListSection />
        </PageScrollView>
      </View>
    </PageLayout>
  );
}
