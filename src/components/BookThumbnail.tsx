import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

export interface BookThumbnailProps {
  author?: string;
  borderRadius?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  thumbnail: string | null;
  title: string;
  width?: number;
}

export function BookThumbnail({
  author,
  borderRadius = radii.md,
  height,
  style,
  thumbnail,
  title,
  width,
}: BookThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [thumbnail]);

  const showImage = Boolean(thumbnail) && !imageFailed;

  return (
    <View
      accessibilityLabel={`Cover of ${title}`}
      accessible
      style={[
        styles.shell,
        { borderRadius, height, width },
        style,
      ]}
    >
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: thumbnail ?? undefined }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : (
        <View style={styles.fallback}>
          <View style={styles.fallbackMark}>
            <Ionicons color={colors.white} name="book-outline" size={24} />
          </View>
          <Text numberOfLines={4} style={styles.fallbackTitle}>
            {title}
          </Text>
          {author ? (
            <Text numberOfLines={2} style={styles.fallbackAuthor}>
              {author}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.violetDark,
    minHeight: 120,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.violetDark,
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  fallbackMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    marginBottom: 'auto',
    width: 42,
  },
  fallbackTitle: {
    ...typography.label,
    color: colors.white,
    fontSize: 16,
    lineHeight: 21,
  },
  fallbackAuthor: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
    marginTop: spacing.xs,
  },
});

export default BookThumbnail;
