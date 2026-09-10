import { CatalogItem, StockResult, ReviewSummary, SizePrediction, LocalizationResult, FriendInfluenceResult } from "../types";

interface Props {
  item: CatalogItem;
  stock?: StockResult;
  review?: ReviewSummary;
  sizePrediction?: SizePrediction;
  localization: LocalizationResult;
  friendInfluence: FriendInfluenceResult;
  rank: number;
}

export function RecommendationCard({
  item,
  stock,
  review,
  sizePrediction,
  localization,
  friendInfluence,
  rank,
}: Props) {
  const localPrice = localization.localPrices[item.id];
  const friendVotes = friendInfluence.votes[item.id] || 0;
  const isTopPick = friendInfluence.topPick === item.name;

  return (
    <div className={`rec-card ${rank === 0 ? "rec-card--featured" : ""}`}>
      {rank === 0 && <span className="rec-badge">✦ Top Pick</span>}
      {isTopPick && <span className="rec-badge rec-badge--friend">👯 Friend Fave</span>}

      <div className="rec-image-wrap">
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
        {!stock?.inStock && (
          <div className="rec-sold-out">Out of Stock</div>
        )}
      </div>

      <div className="rec-body">
        <div className="rec-brand">{item.brand}</div>
        <div className="rec-name">{item.name}</div>

        <div className="rec-price-row">
          <span className="rec-price">
            {localPrice != null
              ? `${localization.currency} ${localPrice.toFixed(0)}`
              : `$${item.price}`}
          </span>
          {localPrice !== item.price && (
            <span className="rec-price-original">${item.price}</span>
          )}
        </div>

        {review && (
          <div className="rec-review">
            <span className="rec-stars">{"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}</span>
            <span className="rec-review-count">{review.reviewCount} reviews</span>
            <p className="rec-review-summary">{review.summary}</p>
          </div>
        )}

        <div className="rec-meta">
          {sizePrediction && (
            <span className="rec-size-tag">
              Size {sizePrediction.recommendedSize} recommended
              <em> ({Math.round(sizePrediction.confidence * 100)}% match)</em>
            </span>
          )}
          <span className="rec-votes">👥 {friendVotes} friends interested</span>
        </div>

        <div className="rec-tags">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="rec-tag">{t}</span>
          ))}
        </div>

        <div className="rec-actions">
          <button className="btn-primary" disabled={!stock?.inStock}>
            {stock?.inStock ? "Add to Bag" : "Notify Me"}
          </button>
          <button className="btn-ghost">Save</button>
        </div>
      </div>
    </div>
  );
}
