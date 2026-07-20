import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Star } from 'lucide-react-native';
import { reviewApi } from '../api';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IReview } from '../types/models';
import { formatDate } from '../utils/format';

export default function AdminReviewsScreen() {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setReviews(await reviewApi.getAllReviews());
    } catch {
      Alert.alert('Lỗi', 'Không tải được danh sách đánh giá');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Đánh giá',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleDeleteReview = (id: string) => {
    Alert.alert('Xoá đánh giá', 'Bạn có chắc chắn muốn xoá đánh giá này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewApi.deleteReview(id);
            Alert.alert('Thành công', 'Đã xoá đánh giá');
            fetchReviews();
          } catch {
            Alert.alert('Lỗi', 'Không xoá được đánh giá');
          }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            color={i < rating ? '#FFB300' : '#E0E0E0'}
            fill={i < rating ? '#FFB300' : 'none'}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewMain}>
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{item.user.name}</Text>
                <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
              </View>
              {renderStars(item.rating)}
              {item.comment ? (
                <Text style={styles.commentText}>{item.comment}</Text>
              ) : (
                <Text style={styles.noCommentText}>Không có bình luận.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteReview(item._id)}>
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reviewMain: { flex: 1, gap: 4 },
  userMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { ...typography.body, fontWeight: '700', fontSize: 13, color: colors.text },
  reviewDate: { fontSize: 10, color: colors.textPlaceholder },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 2 },
  commentText: { ...typography.body, fontSize: 13, color: colors.text },
  noCommentText: { ...typography.body, fontSize: 13, color: colors.textPlaceholder, fontStyle: 'italic' },
  deleteBtn: { padding: spacing.sm },
});
