import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../store/authSlice';

const Register = () => {
  const [role, setRole] = useState('rider');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    vehicleType: '',
    licenseNumber: ''
  });

  const { name, email, password, vehicleType, licenseNumber } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
       alert(message);
    }
    if (isSuccess || user) {
       navigate('/dashboard');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
     e.preventDefault();
     const userData = {
       name,
       email,
       password,
       role,
       ...(role === 'driver' && { vehicleType, licenseNumber })
     };
     dispatch(register(userData));
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-900/20 via-dark-900 to-dark-900">
      <div className="glass w-full max-w-md p-8 rounded-2xl animate-fade-in relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Join ulto</h2>
        
        {/* Role Selector */}
        <div className="flex bg-dark-800 p-1 rounded-lg mb-6 border border-white/5">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${role === 'rider' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole('rider')}
          >
            Rider
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${role === 'driver' ? 'bg-accent-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole('driver')}
          >
            Driver
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input type="text" name="name" value={name} onChange={onChange} className="glass-input w-full" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" name="email" value={email} onChange={onChange} className="glass-input w-full" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" name="password" value={password} onChange={onChange} className="glass-input w-full" placeholder="••••••••" required />
          </div>
          
          {role === 'driver' && (
            <div className="animate-fade-in space-y-4 pt-2">
              <div>
                <label className="block text-sm text-accent-500 mb-1">Vehicle Type</label>
                <input type="text" name="vehicleType" value={vehicleType} onChange={onChange} className="glass-input w-full border-accent-500/30 focus:border-accent-500 focus:ring-accent-500" placeholder="Honda Civic" required={role === 'driver'} />
              </div>
              <div>
                <label className="block text-sm text-accent-500 mb-1">Vehicle License Plate</label>
                <input type="text" name="licenseNumber" value={licenseNumber} onChange={onChange} className="glass-input w-full border-accent-500/30 focus:border-accent-500 focus:ring-accent-500" placeholder="ABC-1234" required={role === 'driver'} />
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className={`w-full mt-6 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg ${role === 'rider' ? 'bg-primary-600 hover:bg-primary-500 shadow-primary-500/30' : 'bg-accent-600 hover:bg-accent-500 shadow-accent-500/30'}`}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-primary-500 hover:text-white transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
