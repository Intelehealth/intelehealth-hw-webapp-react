import React from 'react';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import aboutUsMainImage from '../../assets/images/about-us-main-img.png';
import { Link } from 'react-router-dom';
import iconInfo from '../../assets/icons/icon-ache-info-dashboard.svg';

const AboutusComponent = () => {
  return (
    <div className="w-full bg-white rounded-xl p-3 md:p-4">
      <div className="hidden md:flex items-center gap-3">
        <img src={iconsvioletFieldAppointmentDetails} alt="appointments" />
        <span className="text-base font-semibold tracking-wide">About us</span>
      </div>

      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />
      <div>
        <img
          className="w-full rounded-xl 
          mt-2 mb-4"
          src={aboutUsMainImage}
          alt="appointments"
        />
        <p className="font-normal text-base mt-2 mb-4 text-gray-950 ">
          Intelehealth is a non-profit delivering high-quality healthcare where
          there is no doctor via telemedicine. Using our open-source technology
          platform that's driven by an innovative digital health assistant, we
          connect patients and frontline health workers at the last mile with
          doctors, diagnostics & medications.
        </p>
        <p className="font-normal text-base mt-2 mb-4 text-gray-950 ">
          Intelehealth has reached millionsof patients, connecting thousands of
          health workers and doctors to deliver health services for communicable
          and non communicable diseases. We have worked in partnership with
          Ministries of Health in India & Kyrgyzstan as well as organizations
          like UNICEF, Jhpiego, MSF, Ekal Arogya and many more. Intelehealth has
          been recognized by the World Economic Forum and Niti Aayog India as an
          impactful Digital Public Good.
        </p>
        <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />
        <div className="flex items-center gap-2 mt-2 mb-4">
          <span className="flex">
            <img src={iconInfo} />
            check out our
          </span>

          <Link
            to="/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms & Conditions
          </Link>
        </div>
        <button className="btn btn-primary-varient py-3 px-4 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white">
          Visit Website
        </button>
      </div>
    </div>
  );
};
export default AboutusComponent;
