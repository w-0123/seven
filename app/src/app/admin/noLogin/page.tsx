'use client';

import { FC, ReactElement, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
interface ComponentProps {
  className?: string;
}
// 动态导入地图组件以避免SSR问题
const AmapComponent = dynamic(() => import('../amap/page'), {
  ssr: false,
  loading: () => <div>加载地图中...</div>
});

// 头像图标组件
const UserAvatar: FC<ComponentProps> = ({ className }): ReactElement => (
  <svg 
    className={`w-[1.5rem] h-[1.5rem] text-white ${className || ''}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <circle cx="12" cy="8" r="5" strokeWidth="2"/>
    <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 顶部导航栏组件
const Header: FC = (): ReactElement => {
  const router = useRouter();

  const handleAvatarClick = () => {
    router.push('/admin/login');
  };

  return (
    <div 
      className="h-[2.75rem] flex items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/images/logo-bj.png")' }}
    >
      <div 
        className="absolute left-[1rem] cursor-pointer"
        onClick={handleAvatarClick}
      >
        <UserAvatar />
      </div>
      <span className="text-[0.875rem] text-white">白菜中心</span>
    </div>
  );
};
// const Header: FC = (): ReactElement => (
//   <div 
//     className="h-[2.75rem] flex items-center justify-center relative bg-cover bg-center bg-no-repeat"
//     style={{ backgroundImage: 'url("/images/logo-bj.png")' }}
//   >
//     <div className="absolute left-[1rem]">
//       <UserAvatar />
//     </div>
//     <span className="text-[0.875rem] text-white">白菜中心</span>
//   </div>
// );

// 未登录提示弹窗组件
const NotLoggedInModal: FC<{ visible: boolean; onClose: () => void; onLogin: () => void }> = ({ visible, onClose, onLogin }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[240px] flex flex-col items-center">
        <div className="text-gray-800 text-base mb-4">未登录，无法操作</div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mb-2 w-full"
          onClick={onLogin}
        >
          去登录
        </button>
        <button
          className="text-gray-400 text-sm"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
};

// 搜索框组件
const SearchBar: FC<{ onShowModal: () => void }> = ({ onShowModal }): ReactElement => (
  <div className="absolute top-[0.75rem] left-[1rem] right-[1rem]">
    <div
      className="bg-white rounded-[0.375rem] shadow-md flex items-center px-[1rem] py-[0.75rem] cursor-pointer"
      onClick={onShowModal}
    >
      <svg 
        viewBox="0 0 24 24" 
        className="w-[1.125rem] h-[1.125rem] text-gray-400 mr-[0.5rem]"
      >
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <span className="text-[0.875rem] text-gray-400">617综合出行日百万私家车等专车体验！</span>
    </div>
  </div>
);

interface LocationDotProps extends ComponentProps {
  color: 'blue' | 'green';
}

const LocationDot: FC<LocationDotProps> = ({ color, className }): ReactElement => (
  <div className={`w-[0.5rem] h-[0.5rem] rounded-full mr-[0.75rem] ${color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} ${className || ''}`} />
);

// 地址列表组件
const AddressList: FC<{ onShowModal: () => void }> = ({ onShowModal }): ReactElement => (
  <div className="fixed left-[1rem] right-[1rem] bottom-[8rem] bg-white z-10">
    <div className="border-t border-gray-100">
      <div
        className="flex items-center px-[1rem] py-[0.875rem] border-b border-gray-100 cursor-pointer"
        onClick={onShowModal}
      >
        <LocationDot color="blue" />
        <div className="flex-1 min-w-0">
          <span className="text-[0.875rem] text-gray-900 block">超秀智慧城D广场-停车场</span>
          <span className="text-[0.75rem] text-blue-500 block mt-[0.125rem]">推荐上车点</span>
        </div>
      </div>
      <div
        className="flex items-center px-[1rem] py-[0.875rem] cursor-pointer"
        onClick={onShowModal}
      >
        <LocationDot color="green" />
        <div className="flex-1 min-w-0">
          <span className="text-[0.875rem] text-gray-900 block">您要去哪儿</span>
        </div>
      </div>
    </div>
  </div>
);

interface NavItemProps {
  icon: ReactElement;
  title: string;
  subtitle: string;
}

const NavItem: FC<NavItemProps & { onShowModal: () => void }> = ({ icon, title, subtitle, onShowModal }): ReactElement => (
  <div className="flex items-center py-[0.875rem] px-[1rem] cursor-pointer" onClick={onShowModal}>
    {icon}
    <div>
      <div className="text-[0.875rem] text-gray-900">{title}</div>
      <div className="text-[0.75rem] text-gray-400">{subtitle}</div>
    </div>
  </div>
);

const HomeIcon: FC<ComponentProps> = ({ className }): ReactElement => (
  <svg 
    viewBox="0 0 24 24" 
    className={`w-[1.25rem] h-[1.25rem] text-gray-400 mr-[0.75rem] ${className || ''}`} 
    stroke="currentColor" 
    fill="none" 
    strokeWidth="1.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const CompanyIcon: FC<ComponentProps> = ({ className }): ReactElement => (
  <svg 
    viewBox="0 0 24 24" 
    className={`w-[1.25rem] h-[1.25rem] text-gray-400 mr-[0.75rem] ${className || ''}`} 
    stroke="currentColor" 
    fill="none" 
    strokeWidth="1.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

// 底部导航组件
const BottomNav: FC<{ onShowModal: () => void }> = ({ onShowModal }): ReactElement => (
  <div className="fixed left-[1rem] right-[1rem] bottom-[1rem] bg-white shadow-lg z-20">
    <div className="mx-[1rem] my-[1rem]">
      <div className="grid grid-cols-2 divide-x divide-gray-100 bg-white rounded-lg">
        <NavItem
          icon={<HomeIcon />}
          title="家"
          subtitle="设置家的地址"
          onShowModal={onShowModal}
        />
        <NavItem
          icon={<CompanyIcon />}
          title="公司"
          subtitle="设置公司的地址"
          onShowModal={onShowModal}
        />
      </div>
    </div>
  </div>
);

// // 指北针组件
// const Compass: FC = (): ReactElement => (
//   <div className="absolute right-[1rem] top-[8rem] w-[2.5rem] h-[2.5rem] bg-white rounded-full shadow-lg flex items-center justify-center">
//     <span className="text-[0.875rem] text-gray-700 font-semibold">N</span>
//   </div>
// );
// 主页面组件
const NoLoginPage: FC = (): ReactElement => {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const handleShowModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);
  const handleLogin = () => {
    setModalVisible(false);
    router.push('/admin/login');
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <AmapComponent />
        <SearchBar onShowModal={handleShowModal} />
        {/* <Compass /> */}
        <AddressList onShowModal={handleShowModal} />
        <BottomNav onShowModal={handleShowModal} />
        <NotLoggedInModal visible={modalVisible} onClose={handleCloseModal} onLogin={handleLogin} />
      </div>
    </div>
  );
};

export default NoLoginPage;
