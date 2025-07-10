import { useState } from 'react';
import {
  Paper,
  Title,
  TextInput,
  Textarea,
  Switch,
  Select,
  Button,
  Group,
  Stack,
  FileInput,
  Alert,
  NumberInput,
  Grid,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import submissionService from '../../services/submissionService';
import type { SubmissionFormData } from '../../data/submissions';

interface CafeSubmissionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CafeSubmissionForm({ onSuccess, onCancel }: CafeSubmissionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SubmissionFormData>({
    initialValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      wifi: false,
      powerOutletAvailable: false,
      seatingCapacity: '',
      noiseLevel: '',
      priceRange: '',
      images: []
    },
    validate: {
      name: (value) => value.trim().length < 2 ? 'Cafe name must be at least 2 characters' : null,
      description: (value) => value.trim().length < 10 ? 'Description must be at least 10 characters' : null,
      address: (value) => value.trim().length < 5 ? 'Address must be at least 5 characters' : null,
      city: (value) => value.trim().length < 2 ? 'City is required' : null,
      country: (value) => value.trim().length < 2 ? 'Country is required' : null,
      images: (value) => value.length === 0 ? 'At least one image is required' : null
    }
  });

  const handleSubmit = async (values: SubmissionFormData) => {
    if (!user) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to submit a cafe',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      const submission = await submissionService.submitCafe(values, user);
      
      if (submission) {
        setSubmitted(true);
        notifications.show({
          title: 'Success!',
          message: 'Your cafe submission has been sent for review. You\'ll be notified when it\'s approved.',
          color: 'green',
          icon: <IconCheck size={16} />
        });
        
        onSuccess?.();
      } else {
        throw new Error('Failed to submit cafe');
      }
    } catch (error) {
      console.error('Error submitting cafe:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to submit cafe. Please try again.',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <IconCheck size={48} color="green" />
          <Title order={3} ta="center">Submission Successful!</Title>
          <Text ta="center" c="dimmed">
            Your cafe submission has been received and is pending admin review. 
            You'll receive a notification when it's approved or if we need more information.
          </Text>
          <Button variant="light" onClick={onCancel}>
            Back to Profile
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="xl" radius="md" withBorder>
      <Title order={2} mb="md">Submit a New Cafe</Title>
      
      <Alert icon={<IconInfoCircle size={16} />} title="Review Process" mb="xl">
        All cafe submissions are reviewed by our admin team to ensure quality and accuracy. 
        This process typically takes 1-3 business days.
      </Alert>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Title order={4}>Basic Information</Title>
          
          <TextInput
            label="Cafe Name"
            placeholder="Enter the cafe name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Describe the cafe's atmosphere, specialties, and what makes it unique..."
            minRows={4}
            required
            {...form.getInputProps('description')}
          />

          {/* Location */}
          <Title order={4} mt="lg">Location</Title>
          
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Address"
                placeholder="Full street address"
                required
                {...form.getInputProps('address')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="City"
                placeholder="City"
                required
                {...form.getInputProps('city')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Country"
                placeholder="Country"
                required
                {...form.getInputProps('country')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Latitude (optional)"
                placeholder="Latitude coordinate"
                decimalScale={6}
                {...form.getInputProps('latitude')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Longitude (optional)"
                placeholder="Longitude coordinate"
                decimalScale={6}
                {...form.getInputProps('longitude')}
              />
            </Grid.Col>
          </Grid>

          {/* Amenities */}
          <Title order={4} mt="lg">Amenities & Features</Title>
          
          <Group grow>
            <Switch
              label="WiFi Available"
              {...form.getInputProps('wifi', { type: 'checkbox' })}
            />
            <Switch
              label="Power Outlets Available"
              {...form.getInputProps('powerOutletAvailable', { type: 'checkbox' })}
            />
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Seating Capacity"
                placeholder="Select capacity"
                data={[
                  { value: 'small', label: 'Small (1-20 seats)' },
                  { value: 'medium', label: 'Medium (21-50 seats)' },
                  { value: 'large', label: 'Large (50+ seats)' }
                ]}
                {...form.getInputProps('seatingCapacity')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Noise Level"
                placeholder="Select noise level"
                data={[
                  { value: 'quiet', label: 'Quiet' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'lively', label: 'Lively' }
                ]}
                {...form.getInputProps('noiseLevel')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Price Range"
                placeholder="Select price range"
                data={[
                  { value: 'budget', label: '$ - Budget' },
                  { value: 'moderate', label: '$$ - Moderate' },
                  { value: 'premium', label: '$$$ - Premium' }
                ]}
                {...form.getInputProps('priceRange')}
              />
            </Grid.Col>
          </Grid>

          {/* Images */}
          <Title order={4} mt="lg">Images</Title>
          
          <FileInput
            label="Cafe Photos"
            placeholder="Select images"
            multiple
            accept="image/*"
            leftSection={<IconUpload size={16} />}
            {...form.getInputProps('images')}
            description="Upload at least one photo of the cafe. Multiple photos are encouraged!"
          />

          {/* Actions */}
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}