interface DashboardCardProps {
  title: string;
  subtitle: string;
  bg?: string;
  icon?: string;
  image?: string;
  iconBg?: string;
}

export default function DashboardCard({
  title,
  subtitle,
  bg = 'bg-white',
  icon = '',
  iconBg = 'bg-gray-200',
  image = '',
}: DashboardCardProps) {
  return (
    <div
      className={`${bg} rounded-2xl shadow-md flex border border-gray-200 min-h-[120px] lg:min-h-[110px]`}
    >
      <div
        className={`p-4 lg:p-3 flex flex-col justify-between ${image ? 'w-4/5' : 'w-full'}`}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-(--color-dark) text-lg">{title}</h2>
          <p
            className="text-base text-(--color-muted)"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="flex justify-between items-end">
          {icon && (
            <img
              src={icon}
              className={`w-10 h-10 p-2 rounded-full ${iconBg}`}
            />
          )}
        </div>
      </div>
      {image && (
        <div className="w-1/5 flex mt-auto">
          <img
            src={image}
            className="w-[140px] h-[120px] lg:h-[100px] ml-[-50px] max-w-[150%]"
          />
        </div>
      )}
    </div>
  );
}
