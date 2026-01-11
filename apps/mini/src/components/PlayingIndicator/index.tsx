import { View } from '@tarojs/components';
import React from 'react';
import './index.scss';

const PlayingIndicator: React.FC = () => {
  return (
    <View className='playing-indicator'>
      <View className='bar bar1'></View>
      <View className='bar bar2'></View>
      <View className='bar bar3'></View>
    </View>
  );
};

export default PlayingIndicator;
