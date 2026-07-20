import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Otp: { email: string };
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  BookDetail: { slug: string };
  Checkout: undefined;
  OrderDetail: { orderId: string };
  Wishlist: undefined;
  Notifications: undefined;
  EditProfile: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  CartTab: undefined;
  Rewards: { claimCode?: string } | undefined;
  Orders: undefined;
  Profile: undefined;
};
