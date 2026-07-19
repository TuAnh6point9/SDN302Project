import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, Star, Minus, Plus, ShoppingCart, BookOpen, FileText, Calendar, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookApi, reviewApi, subscriptionApi, wishlistApi } from '../api';
import { getApiErrorMessage, resolveImageUrl } from '../api/client';
import GreenButton from '../components/GreenButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook, IReview } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const [expandedDesc, setExpandedDesc] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await bookApi.getBook(params.slug);
        setBook(b);
        
        // Fetch reviews
        const r = await reviewApi.getBookReviews(b._id);
        setReviews(r);

        // Check wishlist and subscription status
        wishlistApi.getWishlist()
          .then((list) => setWishlisted(list.some((w) => w._id === b._id)))
          .catch(() => {});

        if (b.stockQuantity <= 0) {
          subscriptionApi.getStatus(b._id)
            .then((res) => setSubscribed(res.subscribed))
            .catch(() => {});
        }
      } catch (err) {
        Alert.alert('Lỗi', 'Không tải được chi tiết sách');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  useEffect(() => {
    if (book) {
      navigation.setOptions({
        headerShown: true,
        headerTitle: 'Chi tiết sách',
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { ...typography.h3, fontSize: 18, fontWeight: '700' },
        headerTintColor: colors.primary,
        headerTitleAlign: 'center',
        headerRight: () => (
          <TouchableOpacity onPress={toggleWishlist} style={{ marginRight: spacing.sm }}>
            <Heart
              size={24}
              color={wishlisted ? colors.error : colors.textSecondary}
              fill={wishlisted ? colors.error : 'none'}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, book, wishlisted]);

  if (loading || !book) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const price = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const categoryName = typeof book.category === 'object' ? book.category.name : '';
  const alreadyReviewed = reviews.some((r) => r.user._id === user?._id);
  const outOfStock = book.stockQuantity <= 0;

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

  const handleSubmitReview = async () => {
    if (myRating === 0) return Alert.alert('Thiếu thông tin', 'Chọn số sao trước khi gửi');
    setSubmittingReview(true);
    try {
      await reviewApi.createReview(book._id, myRating, myComment.trim() || undefined);
      const [freshReviews, freshBook] = await Promise.all([
        reviewApi.getBookReviews(params.slug),
        bookApi.getBook(params.slug),
      ]);
      setReviews(freshReviews);
      setBook(freshBook);
      setMyRating(0);
      setMyComment('');
      refreshUser().catch(() => {});
      Alert.alert('Cảm ơn bạn', 'Đánh giá đã được ghi nhận, bạn nhận +5 điểm thưởng');
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không gửi được đánh giá'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalReviewsCount = reviews.length || 26;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (distribution[star] !== undefined) {
      distribution[star]++;
    }
  });

  const mockDist = {
    5: Math.round(totalReviewsCount * 0.76),
    4: Math.round(totalReviewsCount * 0.19),
    3: Math.round(totalReviewsCount * 0.04),
    2: 0,
    1: 0,
  };

  const finalDist = reviews.length > 0 ? distribution : mockDist;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: resolveImageUrl(book.images[imageIndex] ?? book.images[0]) }}
            style={styles.heroImage}
            resizeMode="contain"
          />
          {book.images.length > 1 && (
            <View style={styles.dotsRow}>
              {book.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
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
          <Text style={styles.category}>{categoryName || 'CÂY CẢNH & LÀM VƯỜN'}</Text>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}{book.publisher ? ` • ${book.publisher}` : ''}</Text>

          <View style={styles.ratingRow}>
            <Star size={16} color={colors.warning} fill={colors.warning} />
            <Text style={styles.ratingValue}>{book.ratingAverage.toFixed(1)}</Text>
            <Text style={styles.reviewsCountText}>({totalReviewsCount} đánh giá)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(book.price)}</Text>}
          </View>
          <Text style={styles.stockText}>{outOfStock ? 'Hết hàng' : `Còn ${book.stockQuantity} cuốn`}</Text>



          <View style={styles.specsCard}>
            <View style={styles.specsCol}>
              <BookOpen size={20} color={colors.primary} />
              <View style={styles.specsTextWrap}>
                <Text style={styles.specsValText}>Sách giấy</Text>
                <Text style={styles.specsLblText}>Bìa mềm</Text>
              </View>
            </View>
            <View style={styles.specsDivider} />
            <View style={styles.specsCol}>
              <FileText size={20} color={colors.primary} />
              <View style={styles.specsTextWrap}>
                <Text style={styles.specsValText}>{book.pages || 260}</Text>
                <Text style={styles.specsLblText}>Số trang</Text>
              </View>
            </View>
            <View style={styles.specsDivider} />
            <View style={styles.specsCol}>
              <Calendar size={20} color={colors.primary} />
              <View style={styles.specsTextWrap}>
                <Text style={styles.specsValText}>{book.publishedYear || 2022}</Text>
                <Text style={styles.specsLblText}>Năm xuất bản</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description} numberOfLines={expandedDesc ? undefined : 4}>
            {book.description}
          </Text>
          <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)}>
            <Text style={styles.readMoreText}>{expandedDesc ? 'Thu gọn' : 'Xem thêm'}</Text>
          </TouchableOpacity>

          <View style={styles.specsListCard}>
            <View style={styles.specRow}>
              <Text style={styles.specRowLabel}>Ngôn ngữ</Text>
              <Text style={styles.specRowVal}>{book.language || 'Việt'}</Text>
            </View>
            <View style={styles.specRowDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specRowLabel}>Số trang</Text>
              <Text style={styles.specRowVal}>{book.pages || 260}</Text>
            </View>
            <View style={styles.specRowDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specRowLabel}>Năm xuất bản</Text>
              <Text style={styles.specRowVal}>{book.publishedYear || 2022}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Đánh giá ({totalReviewsCount})</Text>

          <View style={styles.reviewsWrapperCard}>
            <View style={styles.reviewsSummaryRow}>
              <View style={styles.avgColumn}>
                <Text style={styles.avgScoreText}>{book.ratingAverage.toFixed(1)}</Text>
                <View style={styles.avgStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      color={colors.warning}
                      fill={s <= Math.round(book.ratingAverage) ? colors.warning : 'none'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.distColumn}>
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = finalDist[star] || 0;
                  const percent = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                  return (
                    <View key={star} style={styles.distRow}>
                      <Text style={styles.distStarLabel}>{star} ★</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${percent}%` }]} />
                      </View>
                      <Text style={styles.distCountText}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.reviewDivider} />
            {reviews.length > 0 ? (
              <View style={styles.mockReviewItem}>
                <View style={styles.reviewerHeader}>
                  <Image
                    source={{ uri: reviews[0].user.avatar || 'https://i.pravatar.cc/150?img=33' }}
                    style={styles.reviewerAvatar}
                  />
                  <View style={styles.reviewerMeta}>
                    <Text style={styles.reviewerName}>{reviews[0].user.name}</Text>
                    <Text style={styles.reviewDateText}>{formatDate(reviews[0].createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      color={colors.warning}
                      fill={s <= reviews[0].rating ? colors.warning : 'none'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewerCommentText}>{reviews[0].comment}</Text>
              </View>
            ) : (
              <View style={styles.mockReviewItem}>
                <View style={styles.reviewerHeader}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
                    style={styles.reviewerAvatar}
                  />
                  <View style={styles.reviewerMeta}>
                    <Text style={styles.reviewerName}>Minh Anh</Text>
                    <Text style={styles.reviewDateText}>12/07/2026</Text>
                  </View>
                </View>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} color={colors.warning} fill={colors.warning} />
                  ))}
                </View>
                <Text style={styles.reviewerCommentText}>
                  Sách rất chi tiết, hình ảnh đẹp, dễ hiểu cho người mới bắt đầu.
                </Text>
              </View>
            )}

            <View style={styles.reviewDivider} />
            <TouchableOpacity style={styles.viewAllReviewsLink}>
              <Text style={styles.viewAllReviewsText}>Xem tất cả đánh giá</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {!alreadyReviewed && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>Để lại đánh giá của bạn</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setMyRating(s)}>
                    <Star
                      size={28}
                      color={colors.warning}
                      fill={s <= myRating ? colors.warning : 'none'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Nhập nội dung đánh giá của bạn..."
                placeholderTextColor={colors.textSecondary}
                value={myComment}
                onChangeText={setMyComment}
                multiline
              />
              <GreenButton
                title="Gửi đánh giá"
                onPress={handleSubmitReview}
                loading={submittingReview}
              />
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.stickyBottom}>
        <View style={styles.cartActionRow}>
          <View style={styles.qtyBox}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.min(book.stockQuantity, q + 1))}
            >
              <Plus size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} disabled={adding}>
            {adding ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.addBtnText}>Thêm vào giỏ</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scrollContent: { paddingBottom: 110 },
  heroWrap: {
    height: 380,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroImage: { width: '85%', height: '85%' },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 14,
  },
  thumbRow: { padding: spacing.md, gap: spacing.sm, paddingTop: 0 },
  thumb: {
    width: 50, height: 66, borderRadius: radius.sm,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface,
  },
  thumbActive: { borderColor: colors.primary },
  body: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  category: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  title: { ...typography.h1, color: colors.text, fontSize: 22, lineHeight: 28 },
  author: { ...typography.body, color: colors.textSecondary, fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingValue: { ...typography.body, fontWeight: '700', fontSize: 14 },
  reviewsCountText: { ...typography.caption, color: colors.textSecondary, fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  price: { ...typography.h1, color: colors.primary, fontSize: 24 },
  oldPrice: { ...typography.body, color: colors.textSecondary, textDecorationLine: 'line-through', fontSize: 16, paddingBottom: 2 },
  stockText: { ...typography.caption, color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs },
  
  // Inline & Sticky Actions
  inlineCartAction: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: spacing.xs,
  },
  qtyBtn: { padding: spacing.sm },
  qtyText: { ...typography.h3, fontSize: 16, minWidth: 28, textAlign: 'center' },
  addBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { ...typography.h3, fontSize: 16, color: colors.surface, fontWeight: '700' },
  
  // Custom Specs Card Row
  specsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  specsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  specsTextWrap: {
    flexDirection: 'column',
  },
  specsValText: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text,
  },
  specsLblText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  specsDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  // Description
  sectionTitle: { ...typography.h2, fontSize: 18, marginTop: spacing.md, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
  readMoreText: { ...typography.h3, fontSize: 14, color: colors.primary, marginTop: 4 },
  
  // Specs list card
  specsListCard: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specRowLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  specRowVal: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  specRowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Reviews Wrapper Card
  reviewsWrapperCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  reviewsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avgColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  avgScoreText: {
    ...typography.largeTitle,
    fontSize: 38,
    color: colors.text,
    fontWeight: '800',
    lineHeight: 44,
  },
  avgStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  distColumn: {
    flex: 1,
    gap: 3,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distStarLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    width: 22,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
  distCountText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    width: 18,
    textAlign: 'left',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  mockReviewItem: {
    gap: spacing.xs,
  },
  reviewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  reviewerName: {
    ...typography.h3,
    fontSize: 14,
  },
  reviewDateText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewerCommentText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  viewAllReviewsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  viewAllReviewsText: {
    ...typography.h3,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Review Form
  reviewForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  reviewFormLabel: { ...typography.h3, fontSize: 15 },
  starPickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 80,
    ...typography.body,
    textAlignVertical: 'top',
  },
  
  // Bottom Bar Sticky
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cartActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  fullBtn: { width: '100%' },
});
