import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBookmark, FiLogOut, FiChevronDown, FiPlus, FiSettings, FiUsers, FiSearch, FiActivity } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/UserDropdown.css';

interface UserDropdownProps {
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

interface DropdownItemProps {
  icon: typeof FiUser;
  text: string;
  onClick?: () => void;
  to?: string;
}

// Animation variants
const wrapperVariants = {
  open: {
    scaleY: 1,
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  closed: {
    scaleY: 0,
    opacity: 0,
    transition: {
      when: 'afterChildren',
      staggerChildren: 0.1,
    },
  },
};

const iconVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      when: 'beforeChildren',
    },
  },
  closed: {
    opacity: 0,
    y: -15,
    transition: {
      when: 'afterChildren',
    },
  },
};

const actionIconVariants = {
  open: { 
    opacity: 1,
    x: 0,
    transition: {
      opacity: { duration: 0.2 }
    }
  },
  closed: { 
    opacity: 0,
    x: -5,
    transition: {
      opacity: { duration: 0.2 }
    }
  },
};

// Dropdown item component
const DropdownItem = ({ icon: Icon, text, onClick, to }: DropdownItemProps) => {
  if (to) {
    return (
      <motion.li variants={itemVariants}>
        <Link to={to} className="dropdown-item">
          <motion.span variants={actionIconVariants} className="item-icon">
            <Icon />
          </motion.span>
          <span>{text}</span>
        </Link>
      </motion.li>
    );
  }
  
  return (
    <motion.li variants={itemVariants}>
      <button onClick={onClick} className="dropdown-item">
        <motion.span variants={actionIconVariants} className="item-icon">
          <Icon />
        </motion.span>
        <span>{text}</span>
      </button>
    </motion.li>
  );
};

export default function UserDropdown({ username, avatarUrl, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Check if user is admin (in a real app, this would come from user context)
  const isAdmin = username === 'admin' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  return (
    <div className="user-dropdown-container">
      <button 
        className="profile-button" 
        onClick={toggleDropdown}
        aria-label="User profile"
      >
        <img 
          src={avatarUrl || "/icons/default-avatar.svg"} 
          alt={username} 
          className="profile-image"
        />
        <motion.span 
          variants={iconVariants}
          animate={isOpen ? 'open' : 'closed'}
          className="dropdown-arrow"
        >
          <FiChevronDown />
        </motion.span>
      </button>
      
      <motion.ul
        className="dropdown-menu"
        initial={wrapperVariants.closed}
        animate={isOpen ? 'open' : 'closed'}
        variants={wrapperVariants}
      >
        <DropdownItem icon={FiUser} text="Profile" to="/profile" />
        <DropdownItem icon={FiBookmark} text="Saved Cafes" to="/bookmarks" />
        <DropdownItem icon={FiActivity} text="Friends Feed" to="/friends-feed" />
        {user?.id && (
          <DropdownItem icon={FiUsers} text="Followers" to={`/profile/${user.id}/followers`} />
        )}
        <DropdownItem icon={FiSearch} text="Find Friends" to="/find-friends" />
        <DropdownItem icon={FiPlus} text="Submit Cafe" to="/submit-cafe" />
        {isAdmin && (
          <DropdownItem icon={FiSettings} text="Admin Panel" to="/admin" />
        )}
        <DropdownItem icon={FiLogOut} text="Log Out" onClick={onLogout} />
      </motion.ul>
    </div>
  );
}
