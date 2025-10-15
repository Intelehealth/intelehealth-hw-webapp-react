interface AuthCardTitleProps {
  title: string;
  description: string;
  icon?: string;
}

const AuthCardTitle: React.FC<AuthCardTitleProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="flex items-center space-x-4 w-full">
      {/* Text content */}
      <div className="w-[70%]">
        <h3 className="text-2xl font-bold text-(--color-primary)">{title}</h3>
        <p className="text-lg text-(--color-primary) mt-2 mb-2">
          {description}
        </p>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center w-[30%]">
        {icon && <img src={icon} alt="icon" className="w-[80px]" />}
      </div>
    </div>
  );
};

export default AuthCardTitle;
