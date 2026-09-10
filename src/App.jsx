import { useState } from "react";
import ConfigurationPage from "./pages/ConfigurationPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("expenses");

  return (
    <>
      <nav className="top-nav">
        <button
          type="button"
          className={screen === "expenses" ? "nav-btn active" : "nav-btn"}
          onClick={() => setScreen("expenses")}
        >
          Expenses
        </button>
        <button
          type="button"
          className={screen === "configuration" ? "nav-btn active" : "nav-btn"}
          onClick={() => setScreen("configuration")}
        >
          Configuration
        </button>
      </nav>

      {screen === "expenses" ? (
        <ExpensesPage onGoToConfiguration={() => setScreen("configuration")} />
      ) : (
        <ConfigurationPage />
      )}
    </>
  );
}
