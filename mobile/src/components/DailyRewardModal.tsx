import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { rewardApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius } from '../theme/colors';

// Popup điểm danh hàng ngày — hiện 1 lần mỗi lần mở app nếu hôm nay chưa nhận.
// Idempotency do server đảm bảo (unique index), client chỉ gọi claim.
export default function DailyRewardModal() {
  const { user, setUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    rewardApi.getStatus()
      .then((status) => {
        if (status.canClaim) {
          setRewardPoints(status.rewardPoints);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [user?._id]);

  const handleClaim = async () => {
    setClaiming(true);
    setError('');
    try {
      const res = await rewardApi.claim();
      setUser(res.user);
      setClaimed(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không nhận được thưởng, thử lại sau'));
    } finally {
      setClaiming(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Ionicons
            name={claimed ? 'checkmark-circle' : 'gift'}
            size={56}
            color={claimed ? colors.success : colors.primary}
          />
          <Text style={styles.title}>
            {claimed ? 'Đã nhận thưởng!' : 'Điểm danh hàng ngày'}
          </Text>
          <Text style={styles.message}>
            {claimed
              ? `+${rewardPoints} điểm đã vào tài khoản. Số dư: ${user?.points ?? 0} điểm`
              : `Nhận ngay +${rewardPoints} điểm thưởng cho hôm nay`}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {claimed ? (
            <TouchableOpacity style={styles.button} onPress={() => setVisible(false)}>
              <Text style={styles.buttonText}>Đóng</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={handleClaim} disabled={claiming}>
                {claiming
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Nhận thưởng</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.later}>Để sau</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 340,
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  message: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  error: { fontSize: 13, color: colors.error, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  later: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
