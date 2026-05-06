import { ProgressItem } from '@/lib/mockData';

interface ProgressListProps {
  title: string;
  items: ProgressItem[];
}

export default function ProgressList({ title, items }: ProgressListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-semibold text-gray-800">{item.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
