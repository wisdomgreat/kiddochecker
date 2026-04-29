
interface ManagementHeaderProps {
  title: string;
  description: string;
}

const ManagementHeader = ({ title, description }: ManagementHeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">{description}</p>
    </div>
  );
};

export default ManagementHeader;

