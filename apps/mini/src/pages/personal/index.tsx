import { createImportTask, createPlaylist, getAlbumHistory, getFavoriteAlbums, getFavoriteTracks, getImportTask, getPlaylists, getRunningImportTask, getTrackHistory, ImportTask, TaskStatus } from '@soundx/services';
import { Image, Input, ScrollView, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useEffect, useRef, useState } from 'react';
import MiniPlayer from '../../components/MiniPlayer';
import StackedCover from '../../components/StackedCover';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayMode } from '../../utils/playMode';
import { getBaseURL } from '../../utils/request';
import './index.scss';

type TabType = 'playlists' | 'favorites' | 'history';
type SubTabType = 'track' | 'album';

export default function Personal() {
  const { user, logout } = useAuth();
  const { mode } = usePlayMode();
  const { playTrackList } = usePlayer();
  
  const [activeTab, setActiveTab] = useState<TabType>('playlists');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('track');
  const [loading, setLoading] = useState(false);
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  // Import task state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTask, setImportTask] = useState<ImportTask | null>(null);
  const pollTimerRef = useRef<any>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'playlists') {
        const res = await getPlaylists(mode as any, user.id);
        if (res.code === 200) setPlaylists(res.data);
      } else if (activeTab === 'favorites') {
        if (mode === 'MUSIC' && activeSubTab === 'track') {
          const res = await getFavoriteTracks(user.id, 0, 1000, mode as any);
          if (res.code === 200) setFavorites(res.data.list.map((item: any) => item.track));
        } else {
          const res = await getFavoriteAlbums(user.id, 0, 1000, mode as any);
          if (res.code === 200) setFavorites(res.data.list.map((item: any) => item.album));
        }
      } else if (activeTab === 'history') {
        if (mode === 'MUSIC' && activeSubTab === 'track') {
          const res = await getTrackHistory(user.id, 0, 1000, mode as any);
          if (res.code === 200) setHistory(res.data.list.map((item: any) => item.track));
        } else {
          const res = await getAlbumHistory(user.id, 0, 1000, mode as any);
          if (res.code === 200) setHistory(res.data.list.map((item: any) => item.album));
        }
      }
    } catch (error) {
      console.error('Failed to load personal data:', error);
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    if (user) {
      loadData();
    }
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [activeTab, activeSubTab, mode]);

  const pollTaskStatus = async (taskId: string) => {
    try {
      const res = await getImportTask(taskId);
      if (res.code === 200 && res.data) {
        setImportTask(res.data);
        if (res.data.status === TaskStatus.SUCCESS) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setTimeout(() => setShowImportModal(false), 2000);
          loadData();
        } else if (res.data.status === TaskStatus.FAILED) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      getRunningImportTask().then(res => {
        if (res.code === 200 && res.data) {
          const taskId = res.data.id;
          setImportTask(res.data);
          setShowImportModal(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = setInterval(() => pollTaskStatus(taskId), 1500);
        }
      });
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [user]);

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const res = await createPlaylist(newPlaylistName.trim(), mode as any, user.id);
      if (res.code === 200) {
        setShowCreateModal(false);
        setNewPlaylistName('');
        await loadData();
        Taro.navigateTo({ url: `/pages/playlist/index?id=${res.data.id}` });
      }
    } catch (error) {
      Taro.showToast({ title: '创建失败', icon: 'none' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLibrary = async (updateMode: 'incremental' | 'full') => {
    setShowMenu(false);
    const title = updateMode === 'full' ? '确认全量更新？' : '确认增量更新？';
    const content = updateMode === 'full' 
      ? '全量更新将清空所有数据！此操作不可恢复。' 
      : '增量更新只增加新数据，不删除旧数据';

    const res = await Taro.showModal({ title, content });
    if (res.confirm) {
      try {
        const taskRes = await createImportTask({ mode: updateMode });
        if (taskRes.code === 200 && taskRes.data) {
          const taskId = taskRes.data.id;
          setShowImportModal(true);
          setImportTask({ id: taskId, status: TaskStatus.INITIALIZING });
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = setInterval(() => pollTaskStatus(taskId), 1500);
        }
      } catch (error) {
        Taro.showToast({ title: '任务创建失败', icon: 'none' });
      }
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return `https://picsum.photos/100/100`;
    if (url.startsWith('http')) return url;
    return `${getBaseURL()}${url}`;
  };

  const renderList = () => {
    const data = activeTab === 'playlists' ? playlists : (activeTab === 'favorites' ? favorites : history);
    
    if (loading && data.length === 0) {
      return <View className='center-msg'><Text>加载中...</Text></View>;
    }

    if (data.length === 0) {
      return <View className='center-msg'><Text>暂无数据</Text></View>;
    }

    return data.map((item) => {
      const isPlaylist = activeTab === 'playlists';
      const isAlbum = activeTab !== 'playlists' && (mode === 'AUDIOBOOK' || activeSubTab === 'album');
      
      return (
        <View 
          key={item.id} 
          className='item-row'
          onClick={() => {
            if (isPlaylist) {
              Taro.navigateTo({ url: `/pages/playlist/index?id=${item.id}` });
            } else if (isAlbum) {
              Taro.navigateTo({ url: `/pages/album/index?id=${item.id}` });
            } else {
              const list = activeTab === 'favorites' ? favorites : history;
              const index = list.findIndex(t => t.id === item.id);
              playTrackList(list, index);
            }
          }}
        >
          {isPlaylist ? (
            <StackedCover tracks={item.tracks || []} />
          ) : (
            <View className='cover-wrapper'>
              <Image src={getImageUrl(item.cover)} className='item-cover' mode='aspectFill' />
              {isAlbum && activeTab === 'history' && mode === 'AUDIOBOOK' && item.progress > 0 && (
                <View className='progress-bar-mini'>
                  <View className='progress-fill' style={{ width: `${item.progress}%` }} />
                </View>
              )}
            </View>
          )}
          <View className='item-info'>
            <Text className='item-name' numberOfLines={1}>{item.name}</Text>
            <Text className='item-sub' numberOfLines={1}>
              {isPlaylist 
                ? `${item._count?.tracks || item.tracks?.length || 0} 首` 
                : (isAlbum ? (item.artist || '') : item.artist)}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <View className='personal-container'>
      <View className='header-actions'>
        <View className='action-btn' onClick={() => setShowMenu(!showMenu)}>
          <Text className='icon icon-add' />
        </View>
        {showMenu && (
          <View className='menu-dropdown'>
            <View className='menu-item' onClick={() => { setShowMenu(false); setShowCreateModal(true); }}>
              <Text>新建播放列表</Text>
            </View>
            <View className='menu-item' onClick={() => handleUpdateLibrary('incremental')}>
              <Text>增量音频入库</Text>
            </View>
            <View className='menu-item' onClick={() => handleUpdateLibrary('full')}>
              <Text>全量重置库</Text>
            </View>
          </View>
        )}
        <View className='action-btn' onClick={() => {/* Future: Settings */}}>
          <Text className='icon icon-settings' />
        </View>
      </View>

      <View className='user-profile'>
        <Image src='https://picsum.photos/200/200' className='avatar' />
        <Text className='username'>{user?.username || '未登录'}</Text>
        {!user && <View className='login-btn' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>去登录</View>}
      </View>

      <View className='tabs-row'>
        <View className={`tab ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}>
          <Text>播放列表</Text>
        </View>
        <View className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          <Text>收藏</Text>
        </View>
        <View className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Text>听过</Text>
        </View>
      </View>

      {mode === 'MUSIC' && (activeTab === 'favorites' || activeTab === 'history') && (
        <View className='sub-tabs-row'>
          <View className={`sub-tab ${activeSubTab === 'album' ? 'active' : ''}`} onClick={() => setActiveSubTab('album')}>
            <Text>专辑</Text>
          </View>
          <View className={`sub-tab ${activeSubTab === 'track' ? 'active' : ''}`} onClick={() => setActiveSubTab('track')}>
            <Text>单曲</Text>
          </View>
        </View>
      )}

      <ScrollView scrollY className='list-scroll'>
        <View className='list-content'>
          {renderList()}
        </View>
      </ScrollView>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <View className='modal-overlay' onClick={() => setShowCreateModal(false)}>
          <View className='modal-content' onClick={e => e.stopPropagation()}>
            <Text className='modal-title'>新建播放列表</Text>
            <Input 
              className='modal-input' 
              placeholder='请输入列表名称' 
              value={newPlaylistName}
              onInput={e => setNewPlaylistName(e.detail.value)}
              focus
            />
            <View className='modal-btns'>
              <View className='modal-btn cancel' onClick={() => setShowCreateModal(false)}>取消</View>
              <View className='modal-btn confirm' onClick={handleCreatePlaylist}>
                {creating ? '创建中...' : '确定'}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Import Task Modal */}
      {showImportModal && (
        <View className='modal-overlay'>
          <View className='modal-content'>
            <Text className='modal-title'>库文件入库进度</Text>
            <View className='status-row'>
              <Text>状态：</Text>
              <Text className='status-val'>
                {importTask?.status === TaskStatus.INITIALIZING ? '初始化...' : 
                 importTask?.status === TaskStatus.PARSING ? '解析媒体...' :
                 importTask?.status === TaskStatus.SUCCESS ? '完成' :
                 importTask?.status === TaskStatus.FAILED ? '失败' : '准备中'}
              </Text>
            </View>
            <View className='progress-container'>
              <View 
                className='progress-fill' 
                style={{ width: `${importTask?.total ? Math.round((importTask.current || 0) / importTask.total * 100) : 0}%` }} 
              />
            </View>
            <Text className='progress-text'>
              进度：{importTask?.current || 0} / {importTask?.total || 0}
            </Text>
            <View className='modal-btns'>
              <View className='modal-btn single' onClick={() => setShowImportModal(false)}>后台运行</View>
            </View>
          </View>
        </View>
      )}

      <View className='logout-footer' onClick={logout}>
        <Text>退出登录</Text>
      </View>

      <MiniPlayer />
    </View>
  );
}
