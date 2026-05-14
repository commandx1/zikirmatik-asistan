import { HomeProvider } from "./home-context";
import { HomeView } from "./home-view";

export function HomeScreen() {
  return (
    <HomeProvider>
      <HomeView />
    </HomeProvider>
  );
}
