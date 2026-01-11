import {
  addSearchRecord, Album, Artist, clearSearchHistory,
  getHotSearches,
  getSearchHistory,
  searchAlbums,
  searchArtists,
  searchTracks, Track
} from '@soundx/services';
import { Image, Input, ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayMode } from '../../utils/playMode';
import { getBaseURL } from '../../utils/request';
import './index.scss';

export default function Search() {
  const { mode } = usePlayMode();
  const { playTrack } = usePlayer();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tracks: Track[];
    artists: Artist[];
    albums: Album[];
  }>({
    tracks: [],
    artists: [],
    albums: []
  });

  const [history, setHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<{ keyword: string; count: number }[]>([]);

  useEffect(() => {
    fetchSearchMeta();
  }, []);

  const fetchSearchMeta = async () => {
    try {
      const [hRes, hotRes] = await Promise.all([
        getSearchHistory(),
        getHotSearches()
      ]);
      if (hRes.code === 200) setHistory(hRes.data || []);
      if (hotRes.code === 200) setHotSearches(hotRes.data || []);
    } catch (e) {
      console.error("Failed to fetch search meta:", e);
    }
  };

  const clearHistory = async () => {
    try {
      await clearSearchHistory();
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  const handleSearch = async (kw?: string) => {
    const query = kw !== undefined ? kw : keyword;
    if (!query || query.trim().length === 0) {
        setResults({ tracks: [], artists: [], albums: [] });
        return;
    }
    
    // Update input data if triggered by click
    if (kw) setKeyword(kw);

    setLoading(true);
    try {
        const [tracksRes, artistsRes, albumsRes] = await Promise.all([
          searchTracks(query, mode),
          searchArtists(query, mode),
          searchAlbums(query, mode),
        ]);
  
        setResults({
          tracks: tracksRes.code === 200 ? tracksRes.data : [],
          artists: artistsRes.code === 200 ? artistsRes.data : [],
          albums: albumsRes.code === 200 ? albumsRes.data : [],
        });
  
        // Record search
        addSearchRecord(query);
        // Refresh history
        getSearchHistory().then(res => {
            if (res.code === 200) setHistory(res.data || []);
        });

      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
  };

  const handleInputConfirm = (e) => {
      const val = e.detail.value;
      handleSearch(val);
  }

  const getImageUrl = (url: string | null) => {
      if (!url) return `https://picsum.photos/100`;
      if (url.startsWith('http')) return url;
      return `${getBaseURL()}${url}`;
  }

  const renderItem = (item: any, type: string) => {
    let coverUrl = getImageUrl(type === 'artist' ? item.avatar : item.cover);

    return (
      <View 
        className='result-item' 
        onClick={() => {
          if (type === "track") {
            playTrack(item);
          } else if (type === "artist") {
             Taro.navigateTo({ url: `/pages/artist/index?id=${item.id}` });
          } else if (type === "album") {
             Taro.navigateTo({ url: `/pages/album/index?id=${item.id}` });
          }
        }}
      >
        <Image 
            src={coverUrl} 
            className={`item-image ${type === 'artist' ? 'circle' : 'rounded'}`} 
            mode='aspectFill'
        />
        <View className='item-info'>
          <Text className='item-title' numberOfLines={1}>{item.name}</Text>
          <Text className='item-subtitle' numberOfLines={1}>
            {type === "track" ? item.artist : type === "album" ? item.artist : "艺术家"}
          </Text>
        </View>
        <Text className='item-arrow'>›</Text>
      </View>
    );
  };

  const sections = [
    { title: "艺术家", data: results.artists, type: "artist" },
    { title: "专辑", data: results.albums, type: "album" },
    { title: "单曲", data: results.tracks, type: "track" },
  ].filter(s => s.data && s.data.length > 0);

  const showSuggestions = keyword.trim().length === 0 && sections.length === 0;

  return (
    <View className='search-container'>
      <View className='header'>
         <View className='search-input-box'>
             <Text className='search-icon icon icon-search' />
             <Input 
                className='search-input' 
                placeholder='搜索单曲，艺术家，专辑' 
                value={keyword}
                onInput={(e) => setKeyword(e.detail.value)}
                onConfirm={handleInputConfirm}
             />
             {keyword.length > 0 && (
                 <View className='clear-btn' onClick={() => { setKeyword(''); setResults({ tracks: [], artists: [], albums: [] }); }}>
                     <Text className='clear-icon icon icon-close' />
                 </View>
             )}
         </View>
         <Text className='cancel-btn' onClick={() => Taro.navigateBack()}>取消</Text>
      </View>

      <ScrollView scrollY className='content-scroll'>
        {loading ? (
             <View className='loading-state'><Text>加载中...</Text></View>
        ) : showSuggestions ? (
            <View>
                {/* Search History */}
                {history.length > 0 && (
                    <View className='suggest-section'>
                        <View className='suggest-header'>
                            <Text className='suggest-title'>搜索历史</Text>
                            <Text className='clear-history' onClick={clearHistory}>清空</Text>
                        </View>
                        <View className='tag-group'>
                            {history.map((kw, i) => (
                                <View key={i} className='tag' onClick={() => handleSearch(kw)}>
                                    <Text className='tag-text'>{kw}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                
                {/* Hot Searches */}
                {hotSearches.length > 0 && (
                    <View className='suggest-section'>
                        <View className='suggest-header'>
                            <Text className='suggest-title'>热搜榜</Text>
                        </View>
                        <View className='hot-list'>
                            {hotSearches.map((hot, i) => (
                                <View key={i} className='hot-item' onClick={() => handleSearch(hot.keyword)}>
                                    <Text className={`rank ${i < 3 ? 'top-rank' : ''}`}>{i + 1}</Text>
                                    <Text className='hot-keyword'>{hot.keyword}</Text>
                                    {i < 3 && <View className='hot-badge'><Text className='hot-badge-text'>HOT</Text></View>}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        ) : (
            <View>
                 {sections.length === 0 && keyword.trim().length > 0 && !loading && (
                     <View className='empty-state'><Text>未找到相关结果</Text></View>
                 )}
                 {sections.map((section, idx) => (
                     <View key={idx} className='result-section'>
                         <View className='section-header'>
                             <Text className='section-title'>{section.title}</Text>
                         </View>
                         {section.data.map(item => (
                             <View key={item.id}>
                                 {renderItem(item, section.type)}
                             </View>
                         ))}
                     </View>
                 ))}
            </View>
        )}
      </ScrollView>
    </View>
  )
}
