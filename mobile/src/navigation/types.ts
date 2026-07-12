import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Otp: { email: string };
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  BookDetail: { slug: string };
  Checkout: undefined;
  OrderDetail: { orderId: string };
  Wishlist: undefined;
  Notifications: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  CartTab: undefined;
  Rewards: undefined;
  Orders: undefined;
  Profile: undefined;
};
