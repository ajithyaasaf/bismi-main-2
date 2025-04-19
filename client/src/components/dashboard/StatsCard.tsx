import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  linkText: string;
  linkHref: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  linkText,
  linkHref,
  trend,
  trendDirection = "neutral"
}: StatsCardProps) {
  // Determine trend icon and color
  const getTrendIcon = () => {
    if (trendDirection === "up") return "fa-arrow-up";
    if (trendDirection === "down") return "fa-arrow-down";
    return "fa-minus";
  };

  const getTrendColor = () => {
    if (trendDirection === "up") return "text-green-600";
    if (trendDirection === "down") return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="card-hover bg-white overflow-hidden shadow-sm rounded-lg border">
      <div className="px-5 py-5">
        <div className="flex justify-between items-start">
          <div className={`${iconBgColor} rounded-full p-3`}>
            <i className={`fas fa-${icon} ${iconColor} text-lg`}></i>
          </div>
          <div className="flex flex-col items-end">
            <h3 className="text-sm font-medium text-gray-500">
              {title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {value}
            </p>
            
            {trend && (
              <div className="flex items-center mt-1 text-xs">
                <i className={`fas ${getTrendIcon()} ${getTrendColor()} mr-1`}></i>
                <span className={`${getTrendColor()}`}>{trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t">
        <div className="text-sm">
          <Link href={linkHref}>
            <a className={`font-medium hover:underline ${iconColor} flex items-center`}>
              {linkText} 
              <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
