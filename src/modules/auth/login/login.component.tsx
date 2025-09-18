import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../reducers';
import { useLogin } from './login.hooks';

const LoginComponent: React.FC = () => {
  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const { handleLogin } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="text"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isAuthenticated && <p style={{ color: 'green' }}>✅ Logged in</p>}
    </div>
  );
};

export default LoginComponent;
