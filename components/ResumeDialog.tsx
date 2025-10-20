import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Play, RotateCcw } from 'lucide-react-native';

interface ResumeDialogProps {
  visible: boolean;
  episodeNumber: number;
  seasonNumber: number;
  episodeTitle: string;
  progress: number;
  onResume: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

export default function ResumeDialog({
  visible,
  episodeNumber,
  seasonNumber,
  episodeTitle,
  progress,
  onResume,
  onRestart,
  onCancel,
}: ResumeDialogProps) {
  const formatProgress = (percent: number) => {
    return `${Math.floor(percent)}% assistido`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Continuar Assistindo?</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.episodeInfo}>
              Temporada {seasonNumber} • Episódio {episodeNumber}
            </Text>
            <Text style={styles.episodeTitle} numberOfLines={2}>
              {episodeTitle}
            </Text>
            <Text style={styles.progressText}>{formatProgress(progress)}</Text>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.restartButton} onPress={onRestart}>
              <RotateCcw size={20} color="#fff" />
              <Text style={styles.restartText}>Reiniciar</Text>
            </Pressable>

            <Pressable style={styles.resumeButton} onPress={onResume}>
              <Play size={20} color="#fff" fill="#fff" />
              <Text style={styles.resumeText}>Continuar</Text>
            </Pressable>
          </View>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  episodeInfo: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressText: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
  },
  restartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
  },
  resumeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  },
});