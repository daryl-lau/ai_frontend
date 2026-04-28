import { Route, Routes } from "react-router-dom";
import NotFoundView from "./views/NotFoundView.jsx";
import ChatView from "./views/ChatView";
import "./assets/index.css";

import Test from "./test.jsx";

function App() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<ChatView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </main>
  );
}

export default App;
