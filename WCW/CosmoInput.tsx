import { useState } from "react";
import { ShopperIntent } from "../types";

interface Props {
  onSubmit: (intent: ShopperIntent) => void;
  loading: boolean;
}

const OCCASIONS = ["Wedding", "Office", "Casual", "Date", "Brunch", "Cocktail"];
const STYLES = ["Minimalist", "Bohemian", "Classic", "Edgy", "Romantic", "Sporty"];

export function CosmoInput({ onSubmit, loading }: Props) {
  const [occasion, setOccasion] = useState("Casual");
  const [budget, setBudget] = useState(120);
  const [location, setLocation] = useState("New York");
  const [style, setStyle] = useState("Minimalist");

  const handleSubmit = () => {
    onSubmit({ occasion: occasion.toLowerCase(), budget, location, style: style.toLowerCase() });
  };

  return (
    <div className="cosmo-input-panel">
      <div className="input-grid">
        <div className="field">
          <label>Occasion</label>
          <div className="pill-row">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                className={`pill ${occasion === o ? "active" : ""}`}
                onClick={() => setOccasion(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Style</label>
          <div className="pill-row">
            {STYLES.map((s) => (
              <button
                key={s}
                className={`pill ${style === s ? "active" : ""}`}
                onClick={() => setStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="field field-row">
          <div className="sub-field">
            <label>Budget — ${budget}</label>
            <input
              type="range"
              min={30}
              max={400}
              step={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <div className="range-labels"><span>$30</span><span>$400</span></div>
          </div>

          <div className="sub-field">
            <label>Location</label>
            <input
              type="text"
              value={location}
              placeholder="e.g. Paris, Tokyo…"
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        className="cosmo-submit"
        onClick={handleSubmit}
        disabled={loading || !location.trim()}
      >
        {loading ? (
          <span className="btn-loading"><span className="spinner" /> Finding your look…</span>
        ) : (
          "Ask Cosmo ✦"
        )}
      </button>
    </div>
  );
}
