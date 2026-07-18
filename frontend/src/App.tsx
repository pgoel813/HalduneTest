import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Home } from "./pages/Home";
import { NewDebrief } from "./pages/NewDebrief";
import { Interview } from "./pages/Interview";
import { Summary } from "./pages/Summary";

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewDebrief />} />
        <Route path="/debrief/:id" element={<Interview />} />
        <Route path="/debrief/:id/summary" element={<Summary />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Shell>
  );
}

export default App;
