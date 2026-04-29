
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItemProps {
  label: string;
  path?: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  items: {
    label: string;
    path?: string;
  }[];
}

const BreadcrumbItem = ({ label, path, isLast }: BreadcrumbItemProps) => {
  if (isLast) {
    return <span className="text-gray-800 font-medium">{label}</span>;
  }

  return (
    <>
      {path ? (
        <Link to={path} className="text-gray-500 hover:text-purple-600 transition-colors">
          {label}
        </Link>
      ) : (
        <span className="text-gray-500">{label}</span>
      )}
      <ChevronRight size={16} className="text-gray-400" />
    </>
  );
};

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((item, index) => (
        <BreadcrumbItem
          key={index}
          label={item.label}
          path={item.path}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
};

export default Breadcrumb;

