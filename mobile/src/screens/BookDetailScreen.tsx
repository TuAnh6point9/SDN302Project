import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { bookApi, reviewApi, subscriptionApi, wishlistApi } from '../api';
import { getApiErrorMessage, resolveImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { IBook, IReview } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Stars({ value, size = 14, onSelect }: { value: number; size?: number; onSelect?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} disabled={!onSelect} onPress={() => onSelect?.(i)}>
          <Ionicons
            name={i <= Math.round(value) ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BookDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'BookDetail'>>();
  const navigation = useNavigation<Nav>();
  const { user, refreshUser } = useAuth();
  const { addItem } = useCart();

  const [book, setBook] = useState<IBook | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await bookApi.getBook(params.slug);
        setBook(b);
        reviewApi.getBookReviews(b._id).then(setReviews).catch(() => {});
        wishlistApi.getWishlist()
          .then((list) => setWishlisted(list.some((w) => w._id === b._id)))
          .catch(() => {});
        if (b.stockQuantity <= 0) {
          subscriptionApi.getStatus(b._id)
            .then((s) => setSubscribed(s.subscribed))
            .catch(() => {});
        }
      } catch {
        Alert.alert('Lỗi', 'Không tải được thông tin sách');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  if (loading || !book) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const price = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const outOfStock = book.stockQuantity <= 0;
  const categoryName = typeof book.category === 'object' ? book.category.name : '';
  const alreadyReviewed = reviews.some((r) => r.user._id === user?._id);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(book._id, quantity);
      Alert.alert('Đã thêm vào giỏ', `${book.title} x${quantity}`);
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không thêm được vào giỏ hàng'));
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (wishlisted) {
        await wishlistApi.remove(book._id);
        setWishlisted(false);
      } else {
        await wishlistApi.add(book._id);
        setWishlisted(true);
      }
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không cập nhật được yêu thích'));
    }
  };

  const toggleSubscription = async () => {
    setSubLoading(true);
    try {
      const res = subscribed
        ? await subscriptionApi.unsubscribe(book._id)
        : await subscriptionApi.subscribe(book._id);
      setSubscribed(res.subscribed);
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không cập nhật được đăng ký'));
    } finally {
      setSubLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (myRating === 0) return Alert.alert('Thiếu thông tin', 'Chọn số sao trước khi gửi');
    setSubmittingReview(true);
    try {
      await reviewApi.createReview(book._id, myRating, myComment.trim() || undefined);
      const [freshReviews, freshBook] = await Promise.all([
        reviewApi.getBookReviews(book._id),
        bookApi.getBook(params.slug),
      ]);
      setReviews(freshReviews);
      setBook(freshBook);
      setMyRating(0);
      setMyComment('');
      refreshUser().catch(() => {}); // review được thưởng +5 điểm
      Alert.alert('Cảm ơn bạn', 'Đánh giá đã được ghi nhận, bạn nhận +5 điểm thưởng');
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không gửi được đánh giá'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 32 }}>
      <View>
        <Image
          source={{ uri: resolveImageUrl(book.images[imageIndex] ?? book.images[0]) }}
          style={styles.hero}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.heartBtn} onPress={toggleWishlist}>
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={wishlisted ? colors.error : colors.text}
          />
        </TouchableOpacity>
      </View>

      {book.images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {book.images.map((img, i) => (
            <TouchableOpacity key={i} onPress={() => setImageIndex(i)}>
              <Image
                source={{ uri: resolveImageUrl(img) }}
                style={[styles.thumb, i === imageIndex && styles.thumbActive]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.body}>
        {categoryName ? <Text style={styles.category}>{categoryName}</Text> : null}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}{book.publisher ? ` · ${book.publisher}` : ''}</Text>

        <View style={styles.ratingRow}>
          <Stars value={book.ratingAverage} />
          <Text style={styles.ratingText}>
            {book.ratingAverage.toFixed(1)} · {book.numReviews} đánh giá
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(book.price)}</Text>}
        </View>

        <Text style={[styles.stock, outOfStock && { color: colors.error }]}>
          {outOfStock ? 'Hết hàng' : `Còn ${book.stockQuantity} cuốn`}
        </Text>

        {outOfStock ? (
          <TouchableOpacity
            style={[styles.subscribeBtn, subscribed && styles.subscribedBtn]}
            onPress={toggleSubscription}
            disabled={subLoading}
          >
            {subLoading ? (
              <ActivityIndicator color={subscribed ? colors.primary : '#fff'} />
            ) : (
              <>
                <Ionicons
                  name={subscribed ? 'notifications' : 'notifications-outline'}
                  size={18}
                  color={subscribed ? colors.primary : '#fff'}
                />
                <Text style={[styles.subscribeText, subscribed && { color: colors.primary }]}>
                  {subscribed ? 'Đã đăng ký báo hàng về' : 'Báo khi có hàng'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.cartRow}>
            <View style={styles.qtyBox}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.min(book.stockQuantity, q + 1))}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} disabled={adding}>
              {adding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Thêm vào giỏ</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>{book.description}</Text>

        {(book.pages || book.publishedYear || book.language) && (
          <View style={styles.metaBox}>
            {book.language ? <Text style={styles.metaText}>Ngôn ngữ: {book.language}</Text> : null}
            {book.pages ? <Text style={styles.metaText}>Số trang: {book.pages}</Text> : null}
            {book.publishedYear ? <Text style={styles.metaText}>Năm xuất bản: {book.publishedYear}</Text> : null}
          </View>
        )}

        <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>

        {!alreadyReviewed && (
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormLabel}>Đánh giá của bạn</Text>
            <Stars value={myRating} size={26} onSelect={setMyRating} />
            <TextInput
              style={styles.reviewInput}
              placeholder="Chia sẻ cảm nhận về cuốn sách (tùy chọn)"
              placeholderTextColor={colors.textPlaceholder}
              value={myComment}
              onChangeText={setMyComment}
              multiline
            />
            <TouchableOpacity
              style={styles.reviewSubmit}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.reviewSubmitText}>Gửi đánh giá</Text>}
            </TouchableOpacity>
          </View>
        )}

        {reviews.length === 0 ? (
          <Text style={styles.emptyReviews}>Chưa có đánh giá nào cho cuốn sách này</Text>
        ) : (
          reviews.map((r) => (
            <View key={r._id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{r.user.name}</Text>
                <Stars value={r.rating} size={12} />
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hero: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbRow: { padding: 12, gap: 8 },
  thumb: {
    width: 56, height: 74, borderRadius: 8,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface,
  },
  thumbActive: { borderColor: colors.primary },
  body: { padding: 16, gap: 6 },
  category: { fontSize: 12, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  author: { fontSize: 14, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratingText: { fontSize: 13, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary },
  oldPrice: { fontSize: 15, color: colors.textPlaceholder, textDecorationLine: 'line-through' },
  stock: { fontSize: 13, color: colors.textSecondary },
  cartRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 28, textAlign: 'center' },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subscribeBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 12,
  },
  subscribedBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  subscribeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 20 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  metaBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
    marginTop: 8,
  },
  metaText: { fontSize: 13, color: colors.textSecondary },
  reviewForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  reviewFormLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 70,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  reviewSubmit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSubmitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyReviews: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
    marginTop: 8,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  reviewDate: { fontSize: 11, color: colors.textPlaceholder },
});
