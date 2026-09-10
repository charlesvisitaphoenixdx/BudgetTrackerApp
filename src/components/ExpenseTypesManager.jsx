import { useState } from "react";

const SEED_TYPES = [
  { id: 1, name: "Groceries", color: "#22c55e" },
  { id: 2, name: "Transport", color: "#3b82f6" },
  { id: 3, name: "Utilities", color: "#f59e0b" },
  { id: 4, name: "Rent", color: "#8b5cf6" },
  { id: 5, name: "Entertainment", color: "#ec4899" },
];

export { SEED_TYPES };

export default function ExpenseTypesManager({ types, setTypes }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#4f46e5");
  const [error, setError] = useState("");

  const nameExists = (name, ignoreId) =>
    types.some((t) => t.id !== ignoreId && t.name.toLowerCase() === name.toLowerCase());

  function addType() {
    const name = newName.trim();
    if (!name) {
      setError("Enter a name for the expense type.");
      return;
    }
    if (nameExists(name)) {
      setError(`"${name}" already exists.`);
      return;
    }
    const nextId = types.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    setTypes([...types, { id: nextId, name, color: newColor }]);
    setNewName("");
    setError("");
  }

  function renameType(id, rawName) {
    const name = rawName.trim();
    if (!name || nameExists(name, id)) return;
    setTypes(types.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function recolorType(id, color) {
    setTypes(types.map((t) => (t.id === id ? { ...t, color } : t)));
  }

  function removeType(id) {
    setTypes(types.filter((t) => t.id !== id));
  }

  return (
    <section className="card">
      <h2>Expense Types</h2>
      <p className="sub">
        Categories used to tag expenses across the app. Click a name to rename it, or remove one
        you don&apos;t need.
      </p>

      <div className="type-list">
        {types.map((t) => (
          <div className="type-row" key={t.id}>
            <input
              type="color"
              className="swatch-input"
              value={t.color}
              onChange={(e) => recolorType(t.id, e.target.value)}
              aria-label={`Color for ${t.name}`}
            />
            <input
              type="text"
              defaultValue={t.name}
              maxLength={40}
              onBlur={(e) => renameType(t.id, e.target.value)}
              aria-label="Expense type name"
            />
            <button
              type="button"
              className="icon-btn"
              title="Remove"
              onClick={() => removeType(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
        {types.length === 0 && <p className="empty">No expense types yet — add one below.</p>}
      </div>

      <div className="add-row">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          aria-label="New expense type color"
        />
        <input
          type="text"
          className="add-input"
          placeholder="New expense type name, e.g. Subscriptions"
          maxLength={40}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addType()}
        />
        <button type="button" className="primary" onClick={addType}>
          Add
        </button>
      </div>
      <div className="error-msg">{error}</div>
    </section>
  );
}
