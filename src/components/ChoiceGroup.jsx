export default function ChoiceGroup({ options, value, onChange, multi = false }) {
  const selected = multi ? value || [] : value;

  const toggle = (val) => {
    if (multi) {
      const set = new Set(selected);
      set.has(val) ? set.delete(val) : set.add(val);
      onChange(Array.from(set));
    } else {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isSelected = multi ? selected.includes(opt.value) : selected === opt.value;
        return (
          <label
            key={opt.value}
            className={`chip ${isSelected ? "chip-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
