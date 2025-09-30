import React from 'react';
import { useNavigate } from 'react-router-dom';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import iconRoundedMobileSetting from '../../../assets/icons/icon-rounded-mobile-setting.svg';
import { Button } from '../../../components/common';
import Card from '../../../components/common/card.component';
import AuthCardTitle from '../common/auth-card-title.component';

const ForgotUsernameComponent: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    //redirect to login page
    navigate('/login');
  };

  return (
    <Card className="w-full lg:w-auto lg:min-w-[431px]">
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
          rightIcon={
            <svg
              width="12"
              height="11"
              viewBox="0 0 12 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.83333 1.125L11 5.5M11 5.5L6.83333 9.875M11 5.5L1 5.5"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          onClick={handleClick}
        >
          <span className="mx-auto w-full text-base">Back to Login</span>
        </Button>
      </div>
    </Card>
  );
};

export default ForgotUsernameComponent;
