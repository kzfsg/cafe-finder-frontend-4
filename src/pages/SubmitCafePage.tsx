import { Container } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CafeSubmissionForm from '../components/submissions/CafeSubmissionForm';

export default function SubmitCafePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSuccess = () => {
    navigate('/profile');
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container size="md" py="xl">
      <CafeSubmissionForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Container>
  );
}