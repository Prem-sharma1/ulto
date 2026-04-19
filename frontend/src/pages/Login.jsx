import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../store/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { email, password } = formData;

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
    dispatch(login(formData));
  };
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-dark-900 to-dark-900">
      <div className="glass w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl animate-fade-in relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Welcome Back</h2>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" name="email" value={email} onChange={onChange} className="glass-input w-full" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" name="password" value={password} onChange={onChange} className="glass-input w-full" placeholder="••••••••" required />
          </div>
          <button type="submit" className="primary-btn w-full mt-6" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Don't have an account? <Link to="/register" className="text-primary-500 hover:text-white transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
