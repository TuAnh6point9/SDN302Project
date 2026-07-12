import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { resolveImageUrl } from '../api/client';
import { colors, radius } from '../theme/colors';
import { IBook } from '../types/models';
import { formatPrice } from '../utils/format';

interface Props {
  book: IBook;
  onPress: () => void;
}

export default function BookCard({ book, onPress }: Props) {
  const price = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const outOfStock = book.stockQuantity <= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: resolveImageUrl(book.images[0]) }}
          style={styles.image}
          resizeMode="cover"
        />
        {outOfStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={styles.rating}>
            {book.ratingAverage.toFixed(1)} ({book.numReviews})
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(book.price)}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.background },
  outOfStock: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  body: { padding: 10, gap: 3 },
  title: { fontSize: 13, fontWeight: '600', color: colors.text, minHeight: 34 },
  author: { fontSize: 11, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 11, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  oldPrice: { fontSize: 11, color: colors.textPlaceholder, textDecorationLine: 'line-through' },
});
