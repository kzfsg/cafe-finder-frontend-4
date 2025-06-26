import { useState, useEffect } from 'react';
import { Container, Title, Grid, Card, Text, Group, Badge, Stack, Loader, Center } from '@mantine/core';
import { IconThumbUp, IconThumbDown, IconEye, IconStar } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import reviewService from '../../services/reviewService';
import cafeService from '../../services/cafeService';

interface MerchantStats {
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  totalImpressions: number;
  weeklyImpressions: number[];
  ownedCafes: number;
}

interface ReviewWithCafe {
  id: string;
  cafe_id: number;
  rating: boolean;
  comment: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  cafe_name?: string;
}

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MerchantStats>({
    totalReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    totalImpressions: 0,
    weeklyImpressions: [0, 0, 0, 0],
    ownedCafes: 0
  });
  const [positiveReviews, setPositiveReviews] = useState<ReviewWithCafe[]>([]);
  const [negativeReviews, setNegativeReviews] = useState<ReviewWithCafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchantData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Get all cafes owned by this merchant
        const ownedCafes = await cafeService.getMerchantCafes(user.id);
        
        // Get all reviews for merchant's cafes
        const allReviews: ReviewWithCafe[] = [];
        
        for (const cafe of ownedCafes) {
          const cafeReviews = await reviewService.getCafeReviews(cafe.id);
          const reviewsWithCafeName = cafeReviews.map(review => ({
            ...review,
            cafe_name: cafe.name
          }));
          allReviews.push(...reviewsWithCafeName);
        }

        // Calculate stats
        const positive = allReviews.filter(r => r.rating === true);
        const negative = allReviews.filter(r => r.rating === false);
        
        // Mock impressions data (in a real app, this would come from analytics)
        const mockImpressions = Math.floor(Math.random() * 1000) + 500;
        const mockWeeklyImpressions = Array.from({ length: 4 }, () => 
          Math.floor(Math.random() * 200) + 50
        );

        setStats({
          totalReviews: allReviews.length,
          positiveReviews: positive.length,
          negativeReviews: negative.length,
          totalImpressions: mockImpressions,
          weeklyImpressions: mockWeeklyImpressions,
          ownedCafes: ownedCafes.length
        });

        setPositiveReviews(positive.slice(0, 5)); // Show latest 5
        setNegativeReviews(negative.slice(0, 5)); // Show latest 5

      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, [user?.id]);

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <Container size="xl" py="md">
        <Title order={1} mb="xl" style={{ color: '#2E7D32', textAlign: 'center' }}>
          Merchant Dashboard
        </Title>

        {/* Stats Overview */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                    Total Reviews
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.totalReviews}
                  </Text>
                </div>
                <IconStar size={24} color="#FFD700" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                    Total Impressions
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.totalImpressions.toLocaleString()}
                  </Text>
                </div>
                <IconEye size={24} color="#2E7D32" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                    Positive Reviews
                  </Text>
                  <Text size="xl" fw={700} color="green">
                    {stats.positiveReviews}
                  </Text>
                </div>
                <IconThumbUp size={24} color="green" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                    Negative Reviews
                  </Text>
                  <Text size="xl" fw={700} color="red">
                    {stats.negativeReviews}
                  </Text>
                </div>
                <IconThumbDown size={24} color="red" />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Weekly Impressions */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Title order={3} mb="md">Impressions - Past 4 Weeks</Title>
          <Group gap="md">
            {stats.weeklyImpressions.map((impressions, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <Text size="sm" color="dimmed">Week {index + 1}</Text>
                <Text size="lg" fw={700}>{impressions}</Text>
              </div>
            ))}
          </Group>
        </Card>

        {/* Reviews Section */}
        <Grid>
          {/* Positive Reviews */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="400">
              <Group justify="space-between" mb="md">
                <Title order={4}>Recent Positive Reviews</Title>
                <Badge color="green" leftSection={<IconThumbUp size={14} />}>
                  {stats.positiveReviews} total
                </Badge>
              </Group>
              
              <Stack gap="sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {positiveReviews.length > 0 ? (
                  positiveReviews.map((review) => (
                    <div key={review.id} style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                          {review.user?.username || 'Anonymous'}
                        </Text>
                        <Text size="xs" color="dimmed">
                          {formatDate(review.created_at)}
                        </Text>
                      </Group>
                      <Text size="sm" color="dimmed" mb="xs">
                        {review.cafe_name}
                      </Text>
                      <Text size="sm">{review.comment}</Text>
                    </div>
                  ))
                ) : (
                  <Text color="dimmed" ta="center">No positive reviews yet</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Negative Reviews */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="400">
              <Group justify="space-between" mb="md">
                <Title order={4}>Recent Negative Reviews</Title>
                <Badge color="red" leftSection={<IconThumbDown size={14} />}>
                  {stats.negativeReviews} total
                </Badge>
              </Group>
              
              <Stack gap="sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {negativeReviews.length > 0 ? (
                  negativeReviews.map((review) => (
                    <div key={review.id} style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                          {review.user?.username || 'Anonymous'}
                        </Text>
                        <Text size="xs" color="dimmed">
                          {formatDate(review.created_at)}
                        </Text>
                      </Group>
                      <Text size="sm" color="dimmed" mb="xs">
                        {review.cafe_name}
                      </Text>
                      <Text size="sm">{review.comment}</Text>
                    </div>
                  ))
                ) : (
                  <Text color="dimmed" ta="center">No negative reviews yet</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}