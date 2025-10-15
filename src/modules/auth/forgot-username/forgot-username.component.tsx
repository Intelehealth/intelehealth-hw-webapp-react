import React from 'react';
import { useNavigate } from 'react-router-dom';
import iconRightArrow from '../../../assets/icons/icon-right-arrow.svg';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import iconRoundedMobileSetting from '../../../assets/icons/icon-rounded-mobile-setting.svg';
import { Button } from '../../../components/common';
import Card from '../../../components/common/card.component';
import AuthCardTitle from '../common/auth-card-title.component';

const ForgotUsernameComponent: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    //redirect to login page
    navigate('/auth/login');
  };

  return (
    <Card className="w-full lg:w-[431px]">
      {/* Title */}
      <AuthCardTitle
        title="Forgot User Id ?"
        description=""
        icon={iconRoundedLock}
      />
      <hr className="border-t border-[#DFDEE3] my-3" />
      <div className="flex flex-col items-center p-8">
        <img src={iconRoundedMobileSetting} className="w-[60px]" />
        <h3 className="text-lg font-semibold mt-4">
          Please contact your admin.
        </h3>
      </div>
      {/* Login button */}
      <div className="mt-[50px] lg:mt-2">
        <Button
          variant="primary"
          className="w-full"
          type="submit"
          rightIcon={<img src={iconRightArrow} />}
          onClick={handleClick}
        >
          <span className="mx-auto w-full text-base">Back to Login</span>
        </Button>
      </div>
    </Card>
  );
};

export default ForgotUsernameComponent;
