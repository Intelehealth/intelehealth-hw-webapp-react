const Navbar = () => {
  return (
    <header className="bg-white shadow-md flex justify-between items-center p-4 rounded-lg">
      <div className="flex items-center space-x-2 ml-10 md:ml-0">
        <span className="text-xl text-purple-700">Intelehealth</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-purple-700">
          Last sync: 12:30 pm, 12 May 2022
        </span>
        <div className="flex items-center space-x-2">
          <i className="fa-regular fa-bell text-purple-700"></i>
          <i className="fa-regular fa-user-circle text-purple-700"></i>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
