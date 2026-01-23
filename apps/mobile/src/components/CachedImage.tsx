import { Image, ImageProps } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';

interface CachedImageProps extends ImageProps {
  style?: any;
}

export const CachedImage: React.FC<CachedImageProps> = ({ style, ...props }) => {
  return (
    <Image
      {...props}
      style={style}
      cachePolicy="disk"
      contentFit="cover"
      transition={200}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
