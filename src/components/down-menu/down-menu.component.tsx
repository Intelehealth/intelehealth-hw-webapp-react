import { Link } from 'react-router-dom';

const DownMenu = () => {
  return (
    <div className=" flex justify-around p-3">
      <Link to="/" className="flex flex-col items-center space-y-1">
        <i className="fas fa-home"></i>
        <span>Home</span>
      </Link>
      <Link to="/appointments" className="flex flex-col items-center space-y-1">
        <i className="fas fa-calendar-alt"></i>
        <span>Appointments</span>
      </Link>
      <Link
        to="/prescriptions"
        className="flex flex-col items-center space-y-1"
      >
        <i className="fas fa-file-medical"></i>
        <span>Prescriptions</span>
      </Link>
      <Link to="/patients" className="flex flex-col items-center space-y-1">
        <i className="fas fa-users"></i>
        <span>Patients</span>
      </Link>
    </div>
  );
};

export default DownMenu;
