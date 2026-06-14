import { createRoot } from "react-dom/client";

import "@/lib/env";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
