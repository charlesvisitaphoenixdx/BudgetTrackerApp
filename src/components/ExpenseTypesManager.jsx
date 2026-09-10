import { useEffect, useState } from "react";

const SEED_TYPES = [
  { id: 1, name: "Groceries", color: "#22c55e" },
  { id: 2, name: "Transport", color: "#3b82f6" },
  { id: 3, name: "Utilities", color: "#f59e0b" },
  { id: 4, name: "Rent", color: "#8b5cf6" },
  { id: 5, name: "Entertainment", color: "#ec4899" },
];

export { SEED_TYPES };

function TypeRow({ type, isDuplicate, onRename, onRecolor, onRemove }) {
  const [draft, setDraft] = useState(type.name);
  const [rowError, setRowError] = useState("");

  // Keep the field in sync if the underlying name changes from elsewhere
  // (e.g. a successful rename re-renders with the committed value).
  useEffect(() => {
    setDraft(type.name);
  }, [type.name]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setRowError("Name can't be empty.");
      setDraft(type.name);
      return;
    }
    if (trimmed.toLowerCase() !== type.name.toLowerCase() && isDuplicate(trimmed, type.id)) {
      setRowError(`"${trimmed}" already exists.`);
      setDraft(type.name);
      return;
    }
    setRowError("");
    if (trimmed !== type.name) onRename(type.id, trimmed);
  }

  return (
    <div className="type-row-wrap">
      <div className="type-row">
        <input
          type="color"
          className="swatch-input"
          value={type.color}
          onChange={(e) => onRecolor(type.id, e.target.value)}
          aria-label={`Color for ${type.name}`}
        />
        <input
          type="text"
          value={draft}
          maxLength={40}
          onChange={(e) => {
            setDraft(e.target.value);
            if (rowError) setRowError("");
          }}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Expense type name"
        />
        <button type="button" className="icon-btn" title="Remove" onClick={() => onRemove(type.id)}>
          ✕
        </button>
      </div>
      {rowError && <div className="row-error">{rowError}</div>}
    </div>
  );
}

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

  function renameType(id, name) {
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
          <TypeRow
            key={t.id}
            type={t}
            isDuplicate={nameExists}
            onRename={renameType}
            onRecolor={recolorType}
            onRemove={removeType}
          />
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
          aria-label="New expense type name"
        />
        <button type="button" className="primary" onClick={addType}>
          Add
        </button>
      </div>
      <div className="error-msg">{error}</div>
    </section>
  );
}
