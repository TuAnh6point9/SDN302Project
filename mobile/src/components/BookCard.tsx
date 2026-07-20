import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, Star, ShoppingCart } from 'lucide-react-native';
import { resolveImageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook } from '../types/models';
import { formatPrice } from '../utils/format';

interface Props {
  book: IBook;
  onPress: () => void;
  isBestSeller?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

function BookCard({ book, onPress, isBestSeller = false, isWishlisted = false, onToggleWishlist }: Props) {
  const { addItem } = useCart();
  
  const price = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const discountPercent = hasDiscount
    ? Math.round(((book.price - book.discountPrice!) / book.price) * 100)
    : 0;
  const outOfStock = book.stockQuantity <= 0;

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addItem(book._id, 1).catch(() => {});
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: resolveImageUrl(book.images[0]) }}
          style={styles.image}
          resizeMode="cover"
        />
        {hasDiscount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        ) : isBestSeller ? (
          <View style={[styles.badge, styles.bestSellerBadge]}>
            <Text style={styles.badgeText}>Bán chạy</Text>
          </View>
        ) : book.isFeatured ? (
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <Text style={styles.badgeText}>Mới</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={(e) => {
            e.stopPropagation();
            onToggleWishlist?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={20}
            color={isWishlisted ? colors.error : colors.textSecondary}
            fill={isWishlisted ? colors.error : 'none'}
          />
        </TouchableOpacity>
        {outOfStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.ratingRow}>
          <Star size={14} color={colors.warning} fill={colors.warning} />
          <Text style={styles.rating}>
            {book.ratingAverage.toFixed(1)} <Text style={styles.reviewCount}>({book.numReviews})</Text>
          </Text>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(book.price)}</Text>}
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
            <ShoppingCart size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(BookCard);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.divider,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bestSellerBadge: {
    backgroundColor: colors.warning,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStock: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  body: {
    padding: 12,
    gap: 4,
  },
  title: {
    ...typography.h3,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 40,
  },
  author: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rating: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  reviewCount: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  price: {
    ...typography.h2,
    fontSize: 16,
    color: colors.primary,
  },
  oldPrice: {
    ...typography.caption,
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
    fontSize: 12,
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
