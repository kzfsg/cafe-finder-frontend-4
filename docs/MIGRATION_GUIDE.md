# Migration Guide: Web to Mobile

This document provides comprehensive guidance for migrating the React web application to React Native, including component mapping, technology equivalents, navigation patterns, and platform-specific considerations.

## Overview

This migration guide facilitates the transition from the current React web application to a React Native mobile app while preserving core functionality, user experience, and design principles. The guide focuses on maintaining feature parity while adapting to mobile-specific patterns and constraints.

## Technology Stack Migration

### Core Framework Migration

#### React Web → React Native
```typescript
// Web (React)
import React from 'react';
import ReactDOM from 'react-dom/client';

// Mobile (React Native)
import React from 'react';
import { AppRegistry } from 'react-native';
```

**Key Changes:**
- Remove ReactDOM usage
- Use AppRegistry for app registration
- Replace HTML elements with React Native components
- Adapt CSS-in-JS or StyleSheet API

#### Routing Migration

```typescript
// Web (React Router)
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Mobile (React Navigation)
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
```

**Migration Strategy:**
- Replace React Router with React Navigation
- Convert Routes to Stack/Tab Navigators
- Update Link components to navigation.navigate()
- Adapt useNavigate to navigation hooks

### UI Library Migration

#### Mantine → React Native Components

```typescript
// Web (Mantine)
import { 
  Container, Button, TextInput, Card, Group, Stack, 
  Grid, Modal, Loader, Avatar, Badge, Image 
} from '@mantine/core';

// Mobile (React Native + UI Library)
import { 
  View, TouchableOpacity, TextInput, ScrollView, 
  Modal, ActivityIndicator, Image, Text 
} from 'react-native';
// Consider: React Native Elements, NativeBase, or Tamagui
```

### State Management Migration

#### TanStack Query → React Query + Mobile Adaptations
```typescript
// Web
import { useQuery, useMutation } from '@tanstack/react-query';

// Mobile (Same API, different considerations)
import { useQuery, useMutation } from '@tanstack/react-query';
// Add: Network state awareness, offline support
import NetInfo from '@react-native-async-storage/async-storage';
```

## Component Migration Matrix

### Layout Components

#### Container → SafeAreaView + ScrollView
```typescript
// Web
<Container size="md" style={{ padding: '4rem 0' }}>
  <content />
</Container>

// Mobile
<SafeAreaView style={styles.container}>
  <ScrollView contentContainerStyle={styles.content}>
    <content />
  </ScrollView>
</SafeAreaView>
```

#### Grid → Flexbox Layout
```typescript
// Web
<Grid>
  <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
    <UserCard user={user} />
  </Grid.Col>
</Grid>

// Mobile
<View style={styles.gridContainer}>
  <View style={styles.gridItem}>
    <UserCard user={user} />
  </View>
</View>

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // Responsive width
    marginBottom: 16,
  },
});
```

### Navigation Components

#### Navbar → Tab Navigator + Header
```typescript
// Web
<div className="navbar">
  <Logo />
  <SearchBar />
  <UserMenu />
</div>

// Mobile
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Input Components

#### TextInput Migration
```typescript
// Web
<TextInput
  placeholder="Enter location name"
  value={filters.location || ''}
  onChange={(e) => handleFilterChange('location', e.target.value)}
  leftSection={<IconMapPin size={16} />}
/>

// Mobile
<View style={styles.inputContainer}>
  <Icon name="map-pin" size={16} style={styles.inputIcon} />
  <TextInput
    placeholder="Enter location name"
    value={filters.location || ''}
    onChangeText={(text) => handleFilterChange('location', text)}
    style={styles.textInput}
  />
</View>
```

#### Button Migration
```typescript
// Web
<Button
  variant="light"
  onClick={handleRefresh}
  loading={refreshing}
  leftSection={<FiRefreshCw size={16} />}
>
  Refresh
</Button>

// Mobile
<TouchableOpacity
  style={[styles.button, styles.lightButton]}
  onPress={handleRefresh}
  disabled={refreshing}
>
  {refreshing ? (
    <ActivityIndicator size="small" color="#FF5722" />
  ) : (
    <Icon name="refresh" size={16} style={styles.buttonIcon} />
  )}
  <Text style={styles.buttonText}>Refresh</Text>
</TouchableOpacity>
```

### Display Components

#### Card Migration
```typescript
// Web
<Paper shadow="sm" p="lg" radius="md" mb="md">
  <Stack gap="md">
    <Group gap="md">
      <Avatar src={user.avatar_url} size="md" radius="xl" />
      <Text fw={500}>{user.username}</Text>
    </Group>
  </Stack>
</Paper>

// Mobile
<View style={styles.card}>
  <View style={styles.row}>
    <Image 
      source={{ uri: user.avatar_url || defaultAvatar }} 
      style={styles.avatar}
    />
    <Text style={styles.username}>{user.username}</Text>
  </View>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  // ... other styles
});
```

### Modal Migration
```typescript
// Web
<Modal opened={opened} onClose={() => setOpened(false)}>
  <Modal.Header>
    <Text>Cafe Details</Text>
  </Modal.Header>
  <Modal.Body>
    <CafeDetails cafe={selectedCafe} />
  </Modal.Body>
</Modal>

// Mobile
<Modal
  visible={opened}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setOpened(false)}
>
  <SafeAreaView style={styles.modalContainer}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Cafe Details</Text>
      <TouchableOpacity onPress={() => setOpened(false)}>
        <Icon name="close" size={24} />
      </TouchableOpacity>
    </View>
    <ScrollView>
      <CafeDetails cafe={selectedCafe} />
    </ScrollView>
  </SafeAreaView>
</Modal>
```

## Page Migration Patterns

### Homepage Migration

#### Web Structure
```typescript
// HomePage.tsx
const HomePage = () => {
  return (
    <Container size="lg">
      <Title>Find Your Perfect Cafe</Title>
      <SearchBar onSearch={handleSearch} />
      <FilterDropdown onFilterChange={handleFilter} />
      <MasonryGrid>
        {cafes.map(cafe => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </MasonryGrid>
    </Container>
  );
};
```

#### Mobile Structure
```typescript
// HomeScreen.tsx
const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Perfect Cafe</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={cafes}
        renderItem={({ item }) => <CafeCard cafe={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};
```

### Authentication Pages Migration

#### Login Page
```typescript
// Web
const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <TextInput type="email" placeholder="Email" />
          <TextInput type="password" placeholder="Password" />
          <Button type="submit">Log In</Button>
        </form>
      </div>
    </div>
  );
};

// Mobile
const LoginScreen = ({ navigation }) => {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
```

## Navigation Architecture Migration

### Web Router Structure
```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/cafes/:id" element={<CafePage />} />
  </Routes>
</BrowserRouter>
```

### Mobile Navigation Structure
```typescript
// App.tsx
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CafeDetails" component={CafeDetailsScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Data Services Migration

### Supabase Integration
```typescript
// Web and Mobile (Same implementation)
import { supabase } from '../supabase-client';

// No changes needed for Supabase client
const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  // ... other methods remain the same
};
```

### AsyncStorage for Persistence
```typescript
// Web (localStorage)
localStorage.setItem('user_preferences', JSON.stringify(preferences));

// Mobile (AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
```

## Styling Migration

### CSS to StyleSheet
```typescript
// Web (CSS)
.cafe-card {
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  margin-bottom: 16px;
}

// Mobile (StyleSheet)
const styles = StyleSheet.create({
  cafeCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // Android shadow
    backgroundColor: 'white',
    marginBottom: 16,
  },
});
```

### Responsive Design Migration
```typescript
// Web (CSS Media Queries)
@media (max-width: 768px) {
  .masonry-grid {
    grid-template-columns: 1fr;
  }
}

// Mobile (Dimensions API)
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: isTablet ? 'wrap' : 'nowrap',
  },
});
```

## Feature-Specific Migration

### Image Handling
```typescript
// Web
<Image
  src={cafe.imageUrls[0]}
  alt={cafe.name}
  fallbackSrc="/images/no-image.svg"
  onLoad={() => setImageLoaded(true)}
/>

// Mobile
<Image
  source={{ uri: cafe.imageUrls[0] }}
  style={styles.cafeImage}
  onLoad={() => setImageLoaded(true)}
  defaultSource={require('../assets/no-image.png')}
/>
```

### Location Services
```typescript
// Web (Browser Geolocation)
navigator.geolocation.getCurrentPosition(
  (position) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  },
  (error) => console.error(error)
);

// Mobile (Expo Location)
import * as Location from 'expo-location';

const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    setErrorMsg('Permission to access location was denied');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  setLocation({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
};
```

### Camera Integration (New Mobile Feature)
```typescript
// Mobile-specific enhancement
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};
```

## Performance Considerations

### List Optimization
```typescript
// Web (Virtual scrolling with react-window)
import { FixedSizeList as List } from 'react-window';

// Mobile (FlatList with optimization)
<FlatList
  data={cafes}
  renderItem={({ item }) => <CafeCard cafe={item} />}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### Image Caching
```typescript
// Mobile (React Native Fast Image)
import FastImage from 'react-native-fast-image';

<FastImage
  style={styles.image}
  source={{
    uri: cafe.imageUrls[0],
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

## Platform-Specific Features

### Push Notifications
```typescript
// Mobile-only feature
import * as Notifications from 'expo-notifications';

const registerForPushNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};
```

### Deep Linking
```typescript
// Mobile navigation deep links
const linking = {
  prefixes: ['cafeapp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Search: 'search',
        },
      },
      CafeDetails: 'cafe/:id',
      UserProfile: 'user/:userId',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* Navigation structure */}
</NavigationContainer>
```

## Testing Migration

### Web Testing → Mobile Testing
```typescript
// Web (React Testing Library)
import { render, screen, fireEvent } from '@testing-library/react';

test('renders cafe card', () => {
  render(<CafeCard cafe={mockCafe} />);
  expect(screen.getByText(mockCafe.name)).toBeInTheDocument();
});

// Mobile (React Native Testing Library)
import { render, screen, fireEvent } from '@testing-library/react-native';

test('renders cafe card', () => {
  render(<CafeCard cafe={mockCafe} />);
  expect(screen.getByText(mockCafe.name)).toBeTruthy();
});
```

## Deployment Considerations

### Build Process
```json
// Web (package.json)
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}

// Mobile (app.json)
{
  "expo": {
    "name": "Cafe Finder",
    "slug": "cafe-finder",
    "platforms": ["ios", "android"],
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.cafefinder"
    },
    "android": {
      "package": "com.yourcompany.cafefinder"
    }
  }
}
```

## Migration Timeline

### Phase 1: Foundation (Week 1-2)
- Set up React Native project structure
- Migrate core services (authService, cafeService)
- Implement basic navigation
- Set up styling system

### Phase 2: Core Features (Week 3-4)
- Migrate main pages (Home, Search, Profile)
- Implement authentication flow
- Convert UI components
- Set up data persistence

### Phase 3: Social Features (Week 5-6)
- Migrate social components (UserCard, ActivityFeed)
- Implement following system
- Convert feed pages
- Add social interactions

### Phase 4: Advanced Features (Week 7-8)
- Add mobile-specific features (camera, push notifications)
- Implement offline support
- Performance optimization
- Platform-specific UI refinements

### Phase 5: Testing & Deployment (Week 9-10)
- Comprehensive testing
- App store preparation
- Beta testing
- Production deployment

This migration guide provides a comprehensive roadmap for converting the React web application to React Native while maintaining feature parity and improving the mobile user experience.