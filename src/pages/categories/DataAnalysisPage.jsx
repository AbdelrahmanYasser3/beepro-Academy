import { FiBarChart2 } from "react-icons/fi";
import CategoryPage from "./CategoryPage";

const DataAnalysisPage = () => (
  <CategoryPage
    categoryKey="data_analysis"
    backgroundVideo="/assets/eduvideo.mp4"
    backgroundImage="/assets/data.jpg"
    icon={<FiBarChart2 aria-hidden="true" />}
    color="#45B7D1"
  />
);

export default DataAnalysisPage;
