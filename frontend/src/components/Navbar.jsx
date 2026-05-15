import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#B0BEC5] px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-[#37474F] rounded-xl flex items-center justify-center shadow-md group-hover:bg-[#546E7A] transition-colors">
            <span className="text-lg">📡</span>
          </div>
          <span className="text-lg font-black tracking-tight text-[#37474F] group-hover:text-[#546E7A] transition-colors">
            HealthMonitor
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-[#546E7A] font-medium">
              Hello,{' '}
              <span className="text-[#37474F] font-bold">{user.name || user.email}</span>
            </span>
          )}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="text-sm px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97]"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
