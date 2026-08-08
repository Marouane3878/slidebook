import {
  Image,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

const logoSource = require('../../assets/favicon.png');

export interface LogoMarkProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function LogoMark({ size = 42, style }: LogoMarkProps) {
  const radius = Math.round(size / 2);

  return (
    <Image
      accessibilityLabel="Slidebook logo"
      accessible
      resizeMode="contain"
      source={logoSource}
      style={[
        styles.image,
        {
          borderRadius: radius,
          height: size,
          width: size,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});

export default LogoMark;
