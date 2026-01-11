import { addTrackToPlaylist, getPlaylists } from '@soundx/services';
import { ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayMode } from '../../utils/playMode';
import './index.scss';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { mode } = usePlayMode();
  const { currentTrack } = usePlayer();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadPlaylists();
    }
  }, [visible, user, mode]);

  const loadPlaylists = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getPlaylists(mode, user.id);
      if (res.code === 200) {
        setPlaylists(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!currentTrack) return;
    try {
      const res = await addTrackToPlaylist(playlistId, Number(currentTrack.id));
      if (res.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' });
        onClose();
      } else {
        Taro.showToast({ title: '添加失败', icon: 'none' });
      }
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      Taro.showToast({ title: '添加失败', icon: 'none' });
    }
  };

  if (!visible) return null;

  return (
    <View className='add-to-playlist-mask' onClick={onClose}>
      <View className='add-to-playlist-content' onClick={(e) => e.stopPropagation()}>
        <View className='modal-header'>
          <Text className='modal-title'>添加到播放列表</Text>
        </View>
        {loading ? (
          <View className='loading-container'>
            <Text>加载中...</Text>
          </View>
        ) : (
          <ScrollView scrollY className='playlist-scroll'>
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <View
                  key={playlist.id}
                  className='playlist-item'
                  onClick={() => handleAddToPlaylist(playlist.id)}
                >
                  <Text className='playlist-name'>{playlist.name}</Text>
                  <Text className='track-count'>{playlist.trackCount || 0} 首</Text>
                </View>
              ))
            ) : (
              <View className='empty-container'>
                <Text className='empty-text'>暂无播放列表</Text>
              </View>
            )}
          </ScrollView>
        )}
        <View className='modal-footer'>
          <View className='cancel-btn' onClick={onClose}>
            <Text className='cancel-text'>取消</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AddToPlaylistModal;
