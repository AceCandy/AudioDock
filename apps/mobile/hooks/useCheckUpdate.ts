import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { compareVersions, downloadAndInstallApk, getLocalVersion } from '../src/utils/updateUtils';
// 配置常量
const GITHUB_USER = 'mmdctjj';
const GITHUB_REPO = 'AudioDock';
const USE_GHPROXY = true; // 开启加速

export const useCheckUpdate = () => {
  // UI 状态
  const [progress, setProgress] = useState(0);

  const checkUpdate = async () => {
    if (Platform.OS !== 'android') return;

    try {
      // 1. 请求 GitHub API
      const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`;
      const response = await fetch(apiUrl);
      console.log(response);
      const data = await response.json();

      // 2. 解析版本 (Tag: v1.0.59 -> 1.0.59)
      const tagName = data.tag_name;
      if (!tagName) return;
      const remoteVersion = tagName.replace(/^v/, '');
      const localVersion = getLocalVersion();

      console.log(`本地: ${localVersion}, 线上: ${remoteVersion}`);

      // 3. 比对版本
      if (compareVersions(remoteVersion, localVersion) === 1) {

        // 构造下载地址
        // 文件名格式: AudioDock-1.0.59.apk
        let downloadUrl = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/download/${tagName}/${GITHUB_REPO}-${remoteVersion}.apk`;

        if (USE_GHPROXY) {
          downloadUrl = `https://mirror.ghproxy.com/${downloadUrl}`;
        }

        // 4. 弹出确认框
        Alert.alert(
          `发现新版本 ${remoteVersion}`,
          data.body || '建议立即更新体验新功能',
          [
            { text: '下次再说', style: 'cancel' },
            {
              text: '立即更新',
              onPress: () => startDownload(downloadUrl) // 点击后开始下载
            }
          ]
        );
      }
    } catch (error) {
      console.error('检查更新失败', error);
    }
  };

  // 内部函数：处理下载流程
  const startDownload = async (url: string) => {
    setProgress(0);

    try {
      await downloadAndInstallApk(url, (p) => {
        setProgress(p); // 实时更新进度条
      });
    } catch (e) {
      Alert.alert('更新失败', '网络连接错误，请重试');
    }
  };

  // 返回：触发函数 + UI组件
  return {
    checkUpdate,
    progress
  };
};