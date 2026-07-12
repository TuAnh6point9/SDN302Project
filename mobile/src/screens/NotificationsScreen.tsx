import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { notificationApi } from '../api';
import { colors, radius } from '../theme/colors';
import { INotification } from '../types/models';
import { formatDate } from '../utils/format';

const TYPE_ICONS: Record<INotification['type'], keyof typeof Ionicons.glyphMap> = {
  order: 'receipt-outline',
  payment: 'card-outline',
  inventory: 'cube-outline',
  system: 'information-circle-outline',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi.getNotifications()
      .then((res) => {
        setNotifications(res.notifications);
        if (res.unreadCount > 0) notificationApi.markRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="notifications-off-outline" size={48} color={colors.textPlaceholder} />
        <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.safe}
      data={notifications}
      keyExtractor={(n) => n._id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={[styles.item, !item.readAt && styles.itemUnread]}>
          <Ionicons name={TYPE_ICONS[item.type] ?? 'information-circle-outline'} size={22} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, gap: 12,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  itemUnread: { borderColor: colors.primaryLight, backgroundColor: '#F0F7F0' },
  title: { fontSize: 13, fontWeight: '700', color: colors.text },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  date: { fontSize: 11, color: colors.textPlaceholder },
});
