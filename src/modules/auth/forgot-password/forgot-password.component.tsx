import React from 'react';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import { Button } from '../../../components/common';
import Card from '../../../components/common/card.component';
import AuthCardTitle from '../common/auth-card-title.component';
import MobileNumberFormComponent from './mobile-number-form/mobile-number-form.component';
import UsernameFormComponent from './username-form/username-form.component';

const ForgotPasswordComponent: React.FC = () => {
  const [isUsername, setIsUsername] = React.useState(true);

  const handleClick = (type: string) => {
    if (type === 'username') {
      setIsUsername(true);
    } else {
      setIsUsername(false);
    }
  };

  return (
    <Card className="w-full lg:w-[431px]">
      {/* Title */}
      <AuthCardTitle
        title="Forgot Password ?"
        description="Follow the instructions below to use your account again."
        icon={iconRoundedLock}
      />
      <hr className="border-t border-[#DFDEE3] my-3" />
      <div className="flex flex-col items-center">
        <div className="flex justify-between w-full gap-3">
          <Button
            variant="secondary"
            className={`w-full ${isUsername ? '!bg-(--color-primary-light)' : ''}`}
            type="button"
            onClick={() => handleClick('username')}
          >
            <span className="mx-auto w-full text-base">Username</span>
          </Button>
          <Button
            variant="secondary"
            className={`w-full ${!isUsername ? '!bg-(--color-primary-light)' : ''}`}
            type="button"
            onClick={() => handleClick('mobile')}
          >
            <span className="mx-auto w-full text-base">Mobile Number</span>
          </Button>
        </div>
        {isUsername && <UsernameFormComponent />}
        {!isUsername && <MobileNumberFormComponent />}
      </div>
    </Card>
  );
};

export default ForgotPasswordComponent;
