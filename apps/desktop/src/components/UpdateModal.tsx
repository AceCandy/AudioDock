import { DownloadOutlined } from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';
import React from 'react';
import type { UpdateInfo } from '../hooks/useCheckUpdate';

const { Paragraph, Text } = Typography;

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onCancel: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, updateInfo, onCancel }) => {
  if (!updateInfo) return null;

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
        if ((window as any).ipcRenderer) {
            (window as any).ipcRenderer.openExternal(updateInfo.downloadUrl);
        } else {
            window.open(updateInfo.downloadUrl, '_blank');
        }
    }
  };

  return (
    <Modal
      title={`发现新版本 ${updateInfo.version}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          暂不更新
        </Button>,
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          去下载
        </Button>,
      ]}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Paragraph>
          <Text strong>更新内容：</Text>
        </Paragraph>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {updateInfo.body}
        </div>
      </div>
    </Modal>
  );
};

export default UpdateModal;
