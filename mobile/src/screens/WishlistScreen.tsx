import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { wishlistApi } from '../api';
import { resolveImageUrl } from '../api/client';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { IBook } from '../types/models';
import { formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      wishlistApi.getWishlist()
        .then(setBooks)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  const remove = async (bookId: string) => {
    setBooks(await wishlistApi.remove(bookId));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={48} color={colors.textPlaceholder} />
        <Text style={styles.emptyText}>Chưa có sách yêu thích</Text>
        <Text style={styles.emptyHint}>Bấm biểu tượng trái tim ở trang chi tiết sách để lưu lại đây</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.safe}
      data={books}
      keyExtractor={(b) => b._id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('BookDetail', { slug: item.slug })}
        >
          <Image source={{ uri: resolveImageUrl(item.images[0]) }} style={styles.thumb} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
            <Text style={styles.price}>{formatPrice(item.discountPrice ?? item.price)}</Text>
            {item.stockQuantity <= 0 && <Text style={styles.outOfStock}>Hết hàng</Text>}
          </View>
          <TouchableOpacity onPress={() => remove(item._id)} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, gap: 8, padding: 24,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 74, borderRadius: 8, backgroundColor: colors.background },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  author: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  outOfStock: { fontSize: 11, color: colors.error, fontWeight: '600' },
  removeBtn: { padding: 8 },
});
