import { FiGlobe } from "react-icons/fi";
import CategoryPage from "./CategoryPage";

const NetworkingPage = () => (
  <CategoryPage
    categoryKey="networking"
    backgroundVideo="/assets/eduvideo.mp4"
    backgroundImage="/assets/it2.jpg"
    icon={<FiGlobe aria-hidden="true" />}
    color="#4ECDC4"
  />
);

export default NetworkingPage;
