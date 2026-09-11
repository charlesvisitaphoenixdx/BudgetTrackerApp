import BudgetLimitSettings from "../components/BudgetLimitSettings.jsx";
import ExpenseTypesManager, { SEED_TYPES } from "../components/ExpenseTypesManager.jsx";
import PeriodSettings from "../components/PeriodSettings.jsx";
import { useLocalStorageState } from "../hooks/useLocalStorageState.js";

const DEFAULT_BUDGET_LIMITS = { overall: null };

export default function ConfigurationPage() {
  const [types, setTypes] = useLocalStorageState("config.expenseTypes", SEED_TYPES);
  const [startDay, setStartDay] = useLocalStorageState("config.startDay", 1);
  const [previewDate, setPreviewDate] = useLocalStorageState("config.previewDate", "");
  const [budgetLimits, setBudgetLimits] = useLocalStorageState(
    "config.budgetLimits",
    DEFAULT_BUDGET_LIMITS
  );

  return (
    <div className="wrap">
      <header className="page">
        <h1>Configuration</h1>
        <p>Set up expense categories and the day your budget month starts on.</p>
      </header>

      <ExpenseTypesManager types={types} setTypes={setTypes} />
      <PeriodSettings
        startDay={startDay}
        setStartDay={setStartDay}
        previewDate={previewDate}
        setPreviewDate={setPreviewDate}
      />
      <BudgetLimitSettings budgetLimits={budgetLimits} setBudgetLimits={setBudgetLimits} />
    </div>
  );
}
