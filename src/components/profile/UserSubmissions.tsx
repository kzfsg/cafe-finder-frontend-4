import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Center,
  Loader,
  Image,
  Tooltip,
  Alert
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconPlus, IconMapPin, IconClock, IconWifi, IconPlug, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import submissionService from '../../services/submissionService';
import type { CafeSubmission } from '../../data/submissions';

export default function UserSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CafeSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const userSubmissions = await submissionService.getUserSubmissions(user.id);
        setSubmissions(userSubmissions);
      } catch (error) {
        console.error('Error fetching user submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder className="profile-card">
        <Center py="xl">
          <Loader size="md" />
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder className="profile-card submissions-card">
      <Group justify="space-between" mb="md">
        <Title order={4}>My Cafe Submissions</Title>
        <Button
          component={Link}
          to="/submit-cafe"
          leftSection={<IconPlus size={16} />}
          size="sm"
          variant="light"
        >
          Submit New Cafe
        </Button>
      </Group>

      {submissions.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Text color="dimmed" ta="center">
              You haven't submitted any cafes yet
            </Text>
            <Button
              component={Link}
              to="/submit-cafe"
              leftSection={<IconPlus size={16} />}
              variant="filled"
            >
              Submit Your First Cafe
            </Button>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {submissions.map((submission) => (
            <Card key={submission.id} shadow="xs" padding="md" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group gap="sm" mb="xs">
                    <Text fw={600} size="md">{submission.name}</Text>
                    <Badge color={getStatusColor(submission.status)} size="sm">
                      {submission.status}
                    </Badge>
                  </Group>
                  
                  <Group gap="md" mb="sm">
                    <Group gap="xs">
                      <IconMapPin size={14} />
                      <Text size="sm">{submission.location.city}, {submission.location.country}</Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={14} />
                      <Text size="sm">{formatDate(submission.submitted_at)}</Text>
                    </Group>
                  </Group>
                  
                  <Group gap="xs" mb="xs">
                    {submission.wifi && (
                      <Tooltip label="WiFi Available">
                        <IconWifi size={16} color="green" />
                      </Tooltip>
                    )}
                    {submission.powerOutletAvailable && (
                      <Tooltip label="Power Outlets Available">
                        <IconPlug size={16} color="green" />
                      </Tooltip>
                    )}
                  </Group>

                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <Alert icon={<IconInfoCircle size={16} />} color="red" size="sm" mt="xs">
                      <Text size="sm">
                        <strong>Rejection Reason:</strong> {submission.rejection_reason}
                      </Text>
                    </Alert>
                  )}

                  {submission.admin_notes && (
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" size="sm" mt="xs">
                      <Text size="sm">
                        <strong>Admin Notes:</strong> {submission.admin_notes}
                      </Text>
                    </Alert>
                  )}
                </div>
                
                {submission.image_urls.length > 0 && (
                  <Image
                    src={submission.image_urls[0]}
                    alt={submission.name}
                    width={50}
                    height={50}
                    radius="md"
                  />
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Card>
  );
}