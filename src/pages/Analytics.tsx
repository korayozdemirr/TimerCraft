import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Select,
  useToast,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Activity, ActivityCategory } from '../types/activity';
import { getUserActivities } from '../services/activity';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadActivities();
  }, [currentUser, timeRange]);

  const loadActivities = async () => {
    try {
      if (!currentUser) return;
      const userActivities = await getUserActivities(currentUser.uid);
      
      const rangeStart = timeRange === 'week' ? startOfWeek(new Date()) : startOfMonth(new Date());
      const rangeEnd = timeRange === 'week' ? endOfWeek(new Date()) : endOfMonth(new Date());
      
      const filteredActivities = userActivities.filter(
        (activity) =>
          activity.startTime >= rangeStart &&
          (activity.endTime ? activity.endTime <= rangeEnd : true)
      );
      
      setActivities(filteredActivities);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getCategoryData = () => {
    const categoryDurations: Record<ActivityCategory, number> = {
      Work: 0,
      Exercise: 0,
      Leisure: 0,
      Study: 0,
      Personal: 0,
    };

    activities.forEach((activity) => {
      if (activity.duration) {
        categoryDurations[activity.category] += activity.duration;
      }
    });

    return Object.entries(categoryDurations).map(([name, value]) => ({
      name,
      value: Math.round(value / 3600), // Convert seconds to hours
    }));
  };

  const getDailyData = () => {
    const dailyDurations: Record<string, Record<ActivityCategory, number>> = {};

    activities.forEach((activity) => {
      if (activity.duration) {
        const date = format(activity.startTime, 'MM/dd');
        if (!dailyDurations[date]) {
          dailyDurations[date] = {
            Work: 0,
            Exercise: 0,
            Leisure: 0,
            Study: 0,
            Personal: 0,
          };
        }
        dailyDurations[date][activity.category] += activity.duration / 3600; // Convert to hours
      }
    });

    return Object.entries(dailyDurations).map(([date, categories]) => ({
      date,
      ...categories,
    }));
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Analytics</Heading>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
            width="200px"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </Select>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={8}>
          <GridItem colSpan={[2, 1]}>
            <Box p={6} borderWidth={1} borderRadius={8} boxShadow="lg" height="400px">
              <Heading size="md" mb={4}>
                Time Distribution by Category
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>

          <GridItem colSpan={[2, 1]}>
            <Box p={6} borderWidth={1} borderRadius={8} boxShadow="lg" height="400px">
              <Heading size="md" mb={4}>
                Daily Activity Breakdown
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDailyData()}>
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(getCategoryData()[0] || {}).map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
};

export default Analytics; 