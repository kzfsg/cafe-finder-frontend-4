# Deployment Guide

This document provides comprehensive guidance for deploying the cafe finder application, including environment configurations, build processes, platform considerations, and production optimizations.

## Overview

The cafe finder application is configured for deployment to GitHub Pages with support for multiple deployment platforms. The deployment process includes build optimization, environment configuration, and asset management for production environments.

## Environment Configuration

### Environment Variables

#### Development Environment
```bash
# .env.local (development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=development
```

#### Production Environment
```bash
# .env.production (production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=production
```

#### Environment Variable Management
```typescript
// Environment configuration validation
const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Environment-specific configuration
const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    env: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  }
};
```

## Build Configuration

### Vite Configuration

#### Production Build Settings
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Base path for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' 
    ? '/cafe-finder-frontend-v2/' 
    : '/',
    
  build: {
    // Build output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Asset optimization
    assetsDir: 'assets',
    
    // Chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@mantine/core', '@mantine/hooks'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
          icons: ['react-icons'],
          framer: ['framer-motion']
        }
      }
    },
    
    // Minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    
    // Asset size warnings
    chunkSizeWarningLimit: 1000, // KB
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // Preview server (for production testing)
  preview: {
    port: 4173,
    host: true
  }
});
```

### Package.json Scripts

#### Build and Deployment Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist/stats.html",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules/.vite",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Platform-Specific Deployment

### GitHub Pages Deployment

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Type check
      run: npm run type-check
      
    - name: Lint
      run: npm run lint
      
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: your-custom-domain.com # Optional
```

#### Manual GitHub Pages Deployment
```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Deploy to GitHub Pages
npm run deploy

# Or step by step
npm run build
npx gh-pages -d dist
```

### Vercel Deployment

#### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key"
  }
}
```

#### Vercel CLI Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

### Netlify Deployment

#### Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Environment Variables in Netlify
```bash
# Set via Netlify dashboard or CLI
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

### AWS S3 + CloudFront Deployment

#### S3 Bucket Configuration
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### CloudFront Distribution
```yaml
# CloudFormation template snippet
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - DomainName: !GetAtt S3Bucket.RegionalDomainName
          Id: S3Origin
          S3OriginConfig:
            OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
      Enabled: true
      DefaultRootObject: index.html
      CustomErrorResponses:
        - ErrorCode: 404
          ResponseCode: 200
          ResponsePagePath: /index.html
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        Compress: true
        CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingOptimized
```

## Docker Deployment

### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Docker Compose
```yaml
version: '3.8'

services:
  cafe-finder:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add reverse proxy
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./proxy.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - cafe-finder
```

## Production Optimizations

### Performance Optimizations

#### Code Splitting
```typescript
// Lazy loading for routes
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BookmarkPage = lazy(() => import('./pages/BookmarkPage'));

// Route configuration with lazy loading
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <HomePage />
      </Suspense>
    ),
  },
  // ... other routes
]);
```

#### Asset Optimization
```typescript
// Image optimization
const optimizeImages = {
  // Use WebP format when possible
  formats: ['webp', 'jpg', 'png'],
  
  // Responsive images
  srcSet: {
    '1x': 'image.jpg',
    '2x': 'image@2x.jpg',
    '3x': 'image@3x.jpg'
  },
  
  // Lazy loading
  loading: 'lazy' as const,
  
  // Size optimization
  quality: 80,
  progressive: true
};
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Webpack Bundle Analyzer alternative for Vite
npx vite-bundle-analyzer dist/stats.html
```

### Security Hardening

#### Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
  font-src 'self' data:;
">
```

#### Environment Variable Security
```typescript
// Validate sensitive environment variables
const validateProductionConfig = () => {
  if (import.meta.env.PROD) {
    // Ensure no development URLs in production
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      throw new Error('Development Supabase URL detected in production');
    }
    
    // Validate HTTPS in production
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('Supabase URL must use HTTPS in production');
    }
  }
};
```

## Monitoring and Analytics

### Error Monitoring
```typescript
// Sentry integration
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });
}

// Error boundary with Sentry
const ErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
});
```

### Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Continuous Integration/Continuous Deployment

### CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      - name: Deploy to Production
        # Deploy to your chosen platform
        run: echo "Deploy to production"
```

## Backup and Recovery

### Database Backup Strategy
```sql
-- Automated Supabase backups are handled by the platform
-- Additional backup considerations:

-- Export user data
SELECT * FROM profiles;
SELECT * FROM bookmarks;
SELECT * FROM reviews;

-- Export content data
SELECT * FROM cafes;
SELECT * FROM cafe_submissions;

-- Export activity data
SELECT * FROM user_upvotes;
SELECT * FROM user_downvotes;
SELECT * FROM followers;
```

### Asset Backup
```bash
# Backup Supabase Storage
supabase storage ls --recursive
supabase storage download --recursive cafe-images/
supabase storage download --recursive submissions/
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf dist
npm ci
npm run build
```

#### Environment Variable Issues
```typescript
// Debug environment variables
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('All env vars:', import.meta.env);
```

#### Routing Issues
```typescript
// Ensure proper base path configuration
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL
});
```

### Performance Issues
```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npx depcheck
npx bundle-phobia analyze package.json
```

This comprehensive deployment guide provides everything needed to successfully deploy the cafe finder application to production environments while maintaining security, performance, and reliability.