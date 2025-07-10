import { Link } from 'react-router-dom';
import './Auth.css';

const AccountTypeSelection = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/favicon.svg" alt="Nomadic logo" className="auth-logo" />
          <h2>Choose Your Account Type</h2>
          <p>Select the type of account that best describes you</p>
        </div>
        
        <div className="account-type-options">
          <Link to="/signup" className="account-type-card">
            <div className="account-type-icon">👤</div>
            <h3>User Account</h3>
            <p>Find and discover amazing work-friendly cafes</p>
            <ul>
              <li>Search and filter cafes</li>
              <li>Bookmark your favorites</li>
              <li>Leave reviews and ratings</li>
              <li>Get personalized recommendations</li>
            </ul>
          </Link>
          
          <Link to="/signup/merchant" className="account-type-card">
            <div className="account-type-icon">🏪</div>
            <h3>Merchant Account</h3>
            <p>Showcase your cafe to remote workers and digital nomads</p>
            <ul>
              <li>List your cafe on the platform</li>
              <li>Manage cafe information</li>
              <li>View customer reviews</li>
              <li>Attract more customers</li>
            </ul>
          </Link>
        </div>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelection;