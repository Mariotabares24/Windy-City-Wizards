import { StylistResult, TrendResult } from "../types";

interface Props {
  stylist: StylistResult;
  trends: TrendResult;
}

export function StylistPanel({ stylist, trends }: Props) {
  return (
    <div className="stylist-panel">
      <div className="stylist-header">
        <span className="stylist-avatar">✦</span>
        <div>
          <p className="stylist-label">Virtual Stylist</p>
          <p className="stylist-sublabel">Powered by Claude AI</p>
        </div>
      </div>

      <p className="stylist-advice">{stylist.advice}</p>

      {stylist.outfitTips.length > 0 && (
        <div className="stylist-tips">
          <p className="tips-label">Outfit tips</p>
          <ul>
            {stylist.outfitTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {stylist.colorPalette.length > 0 && (
        <div className="stylist-palette">
          <p className="tips-label">Your colour palette</p>
          <div className="palette-row">
            {stylist.colorPalette.map((color) => (
              <div key={color} className="palette-swatch" style={{ background: color }}>
                <span>{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="trends-section">
        <p className="tips-label">Trending now — {trends.season}</p>
        <div className="trends-pills">
          {trends.trending.map((t) => (
            <span key={t} className="trend-pill">{t}</span>
          ))}
        </div>
        <div className="trend-score">
          <div className="trend-score-bar" style={{ width: `${trends.score}%` }} />
          <span>Trend alignment: {trends.score}%</span>
        </div>
      </div>
    </div>
  );
}
