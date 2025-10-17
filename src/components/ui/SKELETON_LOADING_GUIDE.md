# Skeleton Loading System Guide

## Overview

This skeleton loading system provides a comprehensive set of reusable components to replace traditional spinner loading with more user-friendly skeleton loading states. The system includes both basic skeleton components and page-specific skeletons.

## Benefits of Skeleton Loading

✅ **Better UX**: Shows the structure of content that's loading  
✅ **Reduces Perceived Loading Time**: Users see content structure immediately  
✅ **Professional Appearance**: More polished than simple spinners  
✅ **Consistent Design**: Unified loading experience across the app  
✅ **Accessibility**: Better for users with slower connections

## Basic Components

### Skeleton

The base skeleton component with customizable properties.

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

// Basic usage
<Skeleton />

// Customized
<Skeleton
  width="w-1/2"
  height="h-8"
  rounded="lg"
  className="mb-4"
/>
```

**Props:**

- `width`: Tailwind width class (default: "w-full")
- `height`: Tailwind height class (default: "h-4")
- `rounded`: Border radius ("none" | "sm" | "md" | "lg" | "full")
- `className`: Additional CSS classes

### SkeletonText

Multi-line text skeleton with varying line lengths.

```tsx
import { SkeletonText } from "@/components/ui/Skeleton";

<SkeletonText lines={3} className="mb-4" />;
```

**Props:**

- `lines`: Number of text lines (default: 1)
- `className`: Additional CSS classes

### SkeletonTitle

Predefined title skeleton.

```tsx
import { SkeletonTitle } from "@/components/ui/Skeleton";

<SkeletonTitle className="mb-2" />;
```

### SkeletonSubtitle

Predefined subtitle skeleton.

```tsx
import { SkeletonSubtitle } from "@/components/ui/Skeleton";

<SkeletonSubtitle className="mb-4" />;
```

### SkeletonCard

Complete card skeleton with title, text, and buttons.

```tsx
import { SkeletonCard } from "@/components/ui/Skeleton";

<SkeletonCard className="mb-6" />;
```

### SkeletonButton

Button-shaped skeleton.

```tsx
import { SkeletonButton } from "@/components/ui/Skeleton";

<SkeletonButton className="w-full" />;
```

### SkeletonInput

Input field skeleton.

```tsx
import { SkeletonInput } from "@/components/ui/Skeleton";

<SkeletonInput className="mb-4" />;
```

## Complex Components

### SkeletonTable

Table skeleton with customizable rows and columns.

```tsx
import { SkeletonTable } from "@/components/ui/Skeleton";

<SkeletonTable rows={5} columns={4} className="mb-8" />;
```

### SkeletonList

List of items skeleton.

```tsx
import { SkeletonList } from "@/components/ui/Skeleton";

<SkeletonList items={5} className="mb-6" />;
```

### SkeletonGrid

Grid layout skeleton.

```tsx
import { SkeletonGrid } from "@/components/ui/Skeleton";

<SkeletonGrid items={6} columns={3} className="mb-8" />;
```

## Page-Specific Skeletons

### DashboardSkeleton

Complete dashboard page skeleton.

```tsx
import { DashboardSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <DashboardSkeleton />;
}
```

### SearchPageSkeleton

Search page with form and results skeleton.

```tsx
import { SearchPageSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <SearchPageSkeleton />;
}
```

### BusinessListsSkeleton

Business lists page skeleton.

```tsx
import { BusinessListsSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <BusinessListsSkeleton />;
}
```

### BusinessDetailSkeleton

Business detail page skeleton.

```tsx
import { BusinessDetailSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <BusinessDetailSkeleton />;
}
```

### AdminDashboardSkeleton

Admin dashboard page skeleton.

```tsx
import { AdminDashboardSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <AdminDashboardSkeleton />;
}
```

### AuthPageSkeleton

Authentication pages skeleton.

```tsx
import { AuthPageSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <AuthPageSkeleton />;
}
```

## Implementation Examples

### Basic Component Loading

```tsx
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

const MyComponent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="h-8" width="w-1/3" />
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <Skeleton height="h-10" width="w-24" />
          <Skeleton height="h-10" width="w-24" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
};
```

### Page Loading

```tsx
import { DashboardSkeleton } from "@/components/ui/PageSkeletons";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData().then((data) => {
      setDashboardData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <div>{/* Dashboard content */}</div>;
};
```

### Custom Skeleton

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

const CustomSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton height="h-12" width="w-12" rounded="full" />
      <div className="flex-1">
        <Skeleton height="h-5" width="w-1/3" className="mb-2" />
        <Skeleton height="h-4" width="w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);
```

## Best Practices

### 1. Use Appropriate Skeletons

- Use page-specific skeletons for full page loading
- Use basic skeletons for component-level loading
- Match skeleton structure to actual content

### 2. Loading States

```tsx
// Good: Show skeleton when no data
if (loading && !data) {
  return <Skeleton />;
}

// Good: Show skeleton during initial load
if (loading) {
  return <Skeleton />;
}

// Avoid: Always showing skeleton
if (loading) {
  return <Skeleton />;
}
```

### 3. Consistent Timing

- Keep skeleton visible for at least 200ms to avoid flickering
- Use consistent loading patterns across similar components

### 4. Accessibility

- Skeletons use semantic HTML and proper ARIA attributes
- Maintain focus management during loading states
- Provide screen reader announcements for loading states

## Customization

### Custom Colors

```tsx
// Override default gray color
<Skeleton className="bg-blue-200" />
```

### Custom Animations

```tsx
// Custom pulse animation
<Skeleton className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
```

### Responsive Skeletons

```tsx
// Responsive skeleton
<Skeleton width="w-full md:w-1/2 lg:w-1/3" height="h-4 md:h-6" />
```

## Migration from Spinner Loading

### Before (Spinner)

```tsx
if (loading) {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}
```

### After (Skeleton)

```tsx
import { DashboardSkeleton } from "@/components/ui/PageSkeletons";

if (loading) {
  return <DashboardSkeleton />;
}
```

## Performance Considerations

- Skeletons are lightweight and don't impact performance
- Use React.memo for complex skeleton components if needed
- Avoid creating too many skeleton instances simultaneously

## Troubleshooting

### Skeleton Not Showing

- Check if loading state is properly set
- Verify import paths are correct
- Ensure component is properly exported

### Styling Issues

- Check Tailwind classes are available
- Verify custom CSS doesn't conflict
- Ensure proper CSS specificity

### Animation Issues

- Verify Tailwind animate-pulse is available
- Check for CSS conflicts
- Ensure proper browser support

## Future Enhancements

- [ ] Add more page-specific skeletons
- [ ] Create animated skeleton transitions
- [ ] Add skeleton themes (light/dark mode)
- [ ] Create skeleton builder tool
- [ ] Add skeleton testing utilities
