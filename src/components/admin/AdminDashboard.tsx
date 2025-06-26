import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Tabs,
  Image,
  Modal,
  Textarea,
  Select,
  Alert,
  Loader,
  Center,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconEye,
  IconCheck,
  IconX,
  IconClock,
  IconUser,
  IconMapPin,
  IconWifi,
  IconPlug,
  IconInfoCircle
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import submissionService from '../../services/submissionService';
import type { CafeSubmission, SubmissionStats, AdminReviewData } from '../../data/submissions';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    recent_submissions: 0
  });
  const [submissions, setSubmissions] = useState<CafeSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<CafeSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  
  const [reviewModalOpened, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
  const [reviewData, setReviewData] = useState<AdminReviewData>({
    status: 'approved',
    admin_notes: '',
    rejection_reason: ''
  });

  // Check if user is admin (in a real app, this would be a proper role check)
  const isAdmin = user?.email?.endsWith('@admin.com') || user?.username === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchSubmissions();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const statsData = await submissionService.getSubmissionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const allSubmissions = await submissionService.getAllSubmissions();
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission || !user) return;

    setReviewLoading(true);
    try {
      const success = await submissionService.reviewSubmission(
        selectedSubmission.id,
        reviewData,
        user
      );

      if (success) {
        notifications.show({
          title: 'Success',
          message: `Submission ${reviewData.status === 'approved' ? 'approved' : 'rejected'} successfully`,
          color: reviewData.status === 'approved' ? 'green' : 'red'
        });
        
        closeReviewModal();
        fetchStats();
        fetchSubmissions();
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to review submission',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to review submission',
        color: 'red'
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const openReview = (submission: CafeSubmission) => {
    setSelectedSubmission(submission);
    setReviewData({
      status: 'approved',
      admin_notes: '',
      rejection_reason: ''
    });
    openReviewModal();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const filterSubmissions = (status: string) => {
    if (status === 'all') return submissions;
    return submissions.filter(s => s.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconX size={16} />} title="Access Denied" color="red">
          You don't have permission to access the admin dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Title order={1} mb="xl" style={{ color: '#2E7D32', textAlign: 'center' }}>
        Admin Dashboard - Cafe Submissions
      </Title>

      {/* Stats Overview */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Total
                </Text>
                <Text size="xl" fw={700}>
                  {stats.total}
                </Text>
              </div>
              <IconInfoCircle size={24} color="gray" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Pending Review
                </Text>
                <Text size="xl" fw={700} color="yellow">
                  {stats.pending}
                </Text>
              </div>
              <IconClock size={24} color="orange" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Approved
                </Text>
                <Text size="xl" fw={700} color="green">
                  {stats.approved}
                </Text>
              </div>
              <IconCheck size={24} color="green" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Rejected
                </Text>
                <Text size="xl" fw={700} color="red">
                  {stats.rejected}
                </Text>
              </div>
              <IconX size={24} color="red" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  This Week
                </Text>
                <Text size="xl" fw={700}>
                  {stats.recent_submissions}
                </Text>
              </div>
              <IconEye size={24} color="blue" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Submissions List */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="pending" leftSection={<IconClock size={16} />}>
              Pending ({stats.pending})
            </Tabs.Tab>
            <Tabs.Tab value="approved" leftSection={<IconCheck size={16} />}>
              Approved ({stats.approved})
            </Tabs.Tab>
            <Tabs.Tab value="rejected" leftSection={<IconX size={16} />}>
              Rejected ({stats.rejected})
            </Tabs.Tab>
            <Tabs.Tab value="all">
              All ({stats.total})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            {loading ? (
              <Center py="xl">
                <Loader size="lg" />
              </Center>
            ) : (
              <Stack gap="md">
                {filterSubmissions(activeTab).map((submission) => (
                  <Card key={submission.id} shadow="xs" padding="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="sm" mb="xs">
                          <Text fw={600} size="lg">{submission.name}</Text>
                          <Badge color={getStatusColor(submission.status)} size="sm">
                            {submission.status}
                          </Badge>
                        </Group>
                        
                        <Group gap="md" mb="sm">
                          <Group gap="xs">
                            <IconUser size={14} />
                            <Text size="sm">{submission.submitted_by_username || 'Unknown'}</Text>
                          </Group>
                          <Group gap="xs">
                            <IconMapPin size={14} />
                            <Text size="sm">{submission.location.city}, {submission.location.country}</Text>
                          </Group>
                          <Group gap="xs">
                            <IconClock size={14} />
                            <Text size="sm">{formatDate(submission.submitted_at)}</Text>
                          </Group>
                        </Group>
                        
                        <Text size="sm" color="dimmed" lineClamp={2}>
                          {submission.description}
                        </Text>
                        
                        <Group gap="xs" mt="xs">
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
                      </div>
                      
                      <Group gap="xs">
                        {submission.image_urls.length > 0 && (
                          <Image
                            src={submission.image_urls[0]}
                            alt={submission.name}
                            width={60}
                            height={60}
                            radius="md"
                          />
                        )}
                        
                        {submission.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="light"
                            onClick={() => openReview(submission)}
                          >
                            Review
                          </Button>
                        )}
                      </Group>
                    </Group>
                  </Card>
                ))}
                
                {filterSubmissions(activeTab).length === 0 && (
                  <Center py="xl">
                    <Text color="dimmed">No submissions found</Text>
                  </Center>
                )}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Review Modal */}
      <Modal
        opened={reviewModalOpened}
        onClose={closeReviewModal}
        title={`Review: ${selectedSubmission?.name}`}
        size="lg"
      >
        {selectedSubmission && (
          <Stack gap="md">
            <Grid>
              <Grid.Col span={8}>
                <Stack gap="xs">
                  <Text fw={600}>{selectedSubmission.name}</Text>
                  <Text size="sm" color="dimmed">
                    {selectedSubmission.location.address}, {selectedSubmission.location.city}
                  </Text>
                  <Text size="sm">{selectedSubmission.description}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={4}>
                {selectedSubmission.image_urls.length > 0 && (
                  <Image
                    src={selectedSubmission.image_urls[0]}
                    alt={selectedSubmission.name}
                    radius="md"
                  />
                )}
              </Grid.Col>
            </Grid>

            <Select
              label="Decision"
              data={[
                { value: 'approved', label: 'Approve' },
                { value: 'rejected', label: 'Reject' }
              ]}
              value={reviewData.status}
              onChange={(value) => setReviewData(prev => ({ 
                ...prev, 
                status: value as 'approved' | 'rejected' 
              }))}
            />

            <Textarea
              label="Admin Notes"
              placeholder="Add any notes about this submission..."
              value={reviewData.admin_notes}
              onChange={(e) => setReviewData(prev => ({ 
                ...prev, 
                admin_notes: e.target.value 
              }))}
            />

            {reviewData.status === 'rejected' && (
              <Textarea
                label="Rejection Reason"
                placeholder="Explain why this submission was rejected..."
                value={reviewData.rejection_reason}
                onChange={(e) => setReviewData(prev => ({ 
                  ...prev, 
                  rejection_reason: e.target.value 
                }))}
                required
              />
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={closeReviewModal}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewSubmission}
                loading={reviewLoading}
                color={reviewData.status === 'approved' ? 'green' : 'red'}
              >
                {reviewData.status === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}