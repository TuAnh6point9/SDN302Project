import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RouteTitle from '../components/RouteTitle';
import TopLoadingBar from '../components/TopLoadingBar';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopLoadingBar />
      <RouteTitle />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
