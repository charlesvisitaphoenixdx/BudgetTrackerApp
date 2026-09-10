import { useMemo } from "react";
import { periodFor, shiftPeriod, daysInMonth } from "../utils/period.js";

const fmt = (date) =>
  date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function todayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
}

export default function PeriodSettings({ startDay, setStartDay, previewDate, setPreviewDate }) {
  const refDate = useMemo(
    () => (previewDate ? new Date(`${previewDate}T00:00:00`) : new Date()),
    [previewDate]
  );

  const current = useMemo(() => periodFor(refDate, startDay), [refDate, startDay]);
  const prev = useMemo(() => shiftPeriod(current, startDay, -1), [current, startDay]);
  const next = useMemo(() => shiftPeriod(current, startDay, 1), [current, startDay]);

  const needsClampNote = startDay > daysInMonth(refDate.getFullYear(), refDate.getMonth());

  function handleStartDayChange(e) {
    const raw = parseInt(e.target.value, 10);
    const clamped = Number.isNaN(raw) ? 1 : Math.max(1, Math.min(31, raw));
    setStartDay(clamped);
  }

  return (
    <section className="card">
      <h2>Budget Period Start Day</h2>
      <p className="sub">
        Instead of the calendar month, budgets can run from a custom day each month to the day
        before that same day next month.
      </p>

      <div className="period-controls">
        <div className="field">
          <label htmlFor="startDay">Start day of month</label>
          <input
            id="startDay"
            type="number"
            min={1}
            max={31}
            value={startDay}
            onChange={handleStartDayChange}
          />
        </div>
        <div className="field">
          <label htmlFor="refDate">Preview a date</label>
          <input
            id="refDate"
            type="date"
            value={previewDate || todayISO()}
            onChange={(e) => setPreviewDate(e.target.value)}
          />
        </div>
      </div>

      <div className="period-preview">
        <div className="label">Period containing the selected date</div>
        <div className="range">
          {fmt(current.start)} <span className="arrow">→</span> {fmt(current.end)}
        </div>
      </div>

      <div className="adjacent-periods">
        <div className="mini-period">
          <strong>Previous period</strong>
          <span>
            {fmt(prev.start)} → {fmt(prev.end)}
          </span>
        </div>
        <div className="mini-period">
          <strong>Next period</strong>
          <span>
            {fmt(next.start)} → {fmt(next.end)}
          </span>
        </div>
      </div>

      <p className="note">
        {needsClampNote
          ? `Note: day ${startDay} doesn't exist in every month — when that happens the period start is clamped to that month's last day (e.g. Feb 28/29 instead of 31).`
          : "Tip: change the start day or preview date above to see how the period shifts."}
      </p>
    </section>
  );
}
