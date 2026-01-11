import { Image, View } from '@tarojs/components';
import React from 'react';
import { getBaseURL } from '../../utils/request';
import './index.scss';

interface StackedCoverProps {
  tracks: any[];
}

const StackedCover: React.FC<StackedCoverProps> = ({ tracks }) => {
  const covers = (tracks || []).slice(0, 4);

  const getImageUrl = (url: string | null) => {
    if (!url) return `https://picsum.photos/100/100`;
    if (url.startsWith('http')) return url;
    return `${getBaseURL()}${url}`;
  };

  return (
    <View className='stacked-cover-container'>
      {covers.length > 0 ? (
        covers.map((track, index) => (
          <Image
            key={track.id || index}
            src={getImageUrl(track.cover)}
            className='stacked-item'
            style={{
              zIndex: 4 - index,
              left: `${index * 12}rpx`,
              top: `${index * 6}rpx`,
              position: index === 0 ? 'relative' : 'absolute',
              opacity: 1 - index * 0.15,
              transform: `scale(${1 - index * 0.05})`,
            }}
            mode='aspectFill'
          />
        ))
      ) : (
        <Image
          src='https://picsum.photos/100/100'
          className='stacked-item'
          mode='aspectFill'
        />
      )}
    </View>
  );
};

export default StackedCover;
