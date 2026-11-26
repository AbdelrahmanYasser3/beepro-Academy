import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useLanguage } from "../../contexts/LanguageContext";

const CategoryCard = ({ title, description, href, icon, actionLabel }) => {
  const { isRTL } = useLanguage();
  const Arrow = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <Link to={href} className="bepro-category-card">
      <div className="bepro-category-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <span className="bepro-category-link">
        {actionLabel}
        <Arrow aria-hidden="true" />
      </span>
    </Link>
  );
};

export default CategoryCard;
