import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UpdateModalProps {
  visible: boolean;
  progress: number;
  onBackground: () => void; // 新增回调：点击后台下载
}

export const UpdateModal = ({ visible, progress, onBackground }: UpdateModalProps) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={onBackground}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>正在更新</Text>
          
          {/* 进度条区域 */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          <Text style={styles.percentText}>{(progress * 100).toFixed(0)}%</Text>
          
          {progress < 1 && (
            <ActivityIndicator size="small" color="#2196F3" style={{ marginVertical: 10 }} />
          )}

          {/* 底部按钮区域 */}
          <TouchableOpacity style={styles.backgroundBtn} onPress={onBackground}>
            <Text style={styles.backgroundBtnText}>隐藏弹窗（后台继续下载）</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 8, // 安卓阴影
    shadowColor: '#000', // iOS阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  percentText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  backgroundBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  backgroundBtnText: {
    color: '#666',
    fontSize: 14,
  },
});