import { Route, Routes } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalysesPage } from "@/pages/AnalysesPage";
import { ComparePage } from "@/pages/ComparePage";
import { CouponsPage } from "@/pages/CouponsPage";
import { HomePage } from "@/pages/HomePage";
import { ResultsPage } from "@/pages/ResultsPage";
import { HorsePage } from "@/pages/HorsePage";
import { JockeyPage } from "@/pages/JockeyPage";
import { PersonPage } from "@/pages/PersonPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { BotPage } from "@/pages/BotPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <Shell>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bot" element={<BotPage />} />
          <Route path="/sonuclar" element={<ResultsPage />} />
          <Route path="/at/:id" element={<HorsePage />} />
          <Route path="/jokey/:id" element={<JockeyPage />} />
          <Route path="/kisi/antrenor/:id" element={<PersonPage kind="antrenor" />} />
          <Route path="/kisi/sahip/:id" element={<PersonPage kind="sahip" />} />
          <Route path="/favoriler" element={<FavoritesPage />} />
          <Route path="/analizler" element={<AnalysesPage />} />
          <Route path="/kuponlar" element={<CouponsPage />} />
          <Route path="/karsilastir" element={<ComparePage />} />
          <Route path="/liderlik" element={<LeaderboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </Shell>
  );
}
