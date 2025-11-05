import React, { useState } from 'react';
import { AlertCircle, Lock, Shield, CreditCard } from 'lucide-react';

const App = () => {
  const [portalType, setPortalType] = useState('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    amount: '',
    recipientName: '',
    recipientAccount: '',
    swiftCode: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = '/api';

  const sanitizeInput = (input) => {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: portalType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Registration failed' });
        return;
      }

      alert('Registration successful! Please log in.');
      setFormData({ ...formData, password: '' });
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: portalType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Login failed' });
        return;
      }

      setToken(data.token);
      setIsLoggedIn(true);
      setFormData({ ...formData, password: '' });
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: formData.amount,
          recipientName: formData.recipientName,
          recipientAccount: formData.recipientAccount,
          swiftCode: formData.swiftCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Payment failed' });
        return;
      }

      alert(`Payment successful!\nTransaction ID: ${data.transactionId}\nAmount: R${formData.amount}`);
      setFormData(prev => ({
        ...prev,
        amount: '',
        recipientName: '',
        recipientAccount: '',
        swiftCode: ''
      }));
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setFormData({
      email: '',
      password: '',
      amount: '',
      recipientName: '',
      recipientAccount: '',
      swiftCode: ''
    });
    setErrors({});
  };

  if (isLoggedIn) {
    return (
      <div className="container">
        <div className="card">
          <div className="header-logged-in">
            <div className="header-left">
              <Shield color="#48bb78" size={32} />
              <h1>{portalType === 'customer' ? 'Customer' : 'Employee'} Payment Portal</h1>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>

          <div className="alert alert-success">
            <Lock size={20} />
            <div>
              <div className="alert-title">Secure Connection</div>
              <div className="alert-text">All data transmitted over SSL/TLS encryption</div>
            </div>
          </div>

          {errors.general && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <div className="alert-text">{errors.general}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Payment Amount (Rand)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              className="form-input"
              placeholder="0.00"
              disabled={loading}
            />
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Recipient Name</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="John"
              disabled={loading}
            />
            {errors.recipientName && <div className="error-message">{errors.recipientName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Recipient Account Number</label>
            <input
              type="text"
              name="recipientAccount"
              value={formData.recipientAccount}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Account Number"
              disabled={loading}
            />
            {errors.recipientAccount && <div className="error-message">{errors.recipientAccount}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Code</label>
            <input
              type="text"
              name="swiftCode"
              value={formData.swiftCode}
              onChange={handleInputChange}
              maxLength="11"
              className="form-input"
              placeholder="ABCDUS33XXX"
              disabled={loading}
            />
            {errors.swiftCode && <div className="error-message">{errors.swiftCode}</div>}
          </div>

          <button onClick={handlePayment} disabled={loading} className="button button-primary">
            <CreditCard size={20} />
            {loading ? 'Processing...' : 'Process Payment'}
          </button>

          <div className="alert alert-info" style={{ marginTop: '24px' }}>
            <div>
              <div className="alert-title">Security Features Active:</div>
              <div className="alert-text">
                JWT Authentication, Password hashing (bcrypt), Input sanitization, 
                SSL enforcement, Rate limiting, CSRF protection
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <Shield color="#4299e1" size={40} />
          <h1>Secure Portal</h1>
        </div>

        <div className="tab-buttons">
          <button
            onClick={() => {
              setPortalType('customer');
              setErrors({});
            }}
            className={`tab-button ${portalType === 'customer' ? 'active' : 'inactive'}`}
          >
            Customer
          </button>
          <button
            onClick={() => {
              setPortalType('employee');
              setErrors({});
            }}
            className={`tab-button ${portalType === 'employee' ? 'active' : 'inactive'}`}
          >
            Employee
          </button>
        </div>

        {errors.general && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <div className="alert-text">{errors.general}</div>
          </div>
        )}

        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <div>
            <div className="alert-title">Password Requirements</div>
            <div className="alert-text">
              8+ characters with uppercase, lowercase, number, and special character
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="user@example.com"
            disabled={loading}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter secure password"
            disabled={loading}
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <button onClick={handleRegister} disabled={loading} className="button button-success">
          {loading ? 'Registering...' : 'Register'}
        </button>

        <div className="divider">
          <span className="divider-text">OR</span>
        </div>

        <button onClick={handleLogin} disabled={loading} className="button button-primary">
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="alert alert-success" style={{ marginTop: '24px' }}>
          <Lock size={20} />
          <div>
            <div className="alert-title">Security Features:</div>
            <ul className="security-list">
              <li>• Bcrypt password hashing</li>
              <li>• JWT token authentication</li>
              <li>• XSS protection via input sanitization</li>
              <li>• SSL/TLS enforcement</li>
              <li>• Rate limiting on API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;