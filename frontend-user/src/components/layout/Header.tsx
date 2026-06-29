import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, Phone, MessageSquare, ChevronRight, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import MiniCart from '../cart/MiniCart';
import MobileMenu from './MobileMenu';
import api from '../../services/api';
import type { Product } from '../../mock/data';
import { useSettings } from '../../hooks/useSettings';

export default function Header() {
  const { settings } = useSettings();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMiniCartOpen(false);
    setShowSuggestions(false);
    setIsAccountMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside and keydown listeners to close search suggestions & account dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounced search suggestion query
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length >= 2) {
        setIsSearching(true);
        try {
          const response = await api.get('/products/search', { params: { q: trimmed } });
          if (response.data?.success) {
            setSuggestions(response.data.data);
          }
        } catch (error) {
          console.error('Error loading search suggestions', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const submitSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/products/${slug}`);
  };

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    navigate('/', { replace: true });
  };

  const navItems = [
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Ưu đãi', path: '/products?sort=bestSeller' },
    { name: 'Lắp đặt', path: '/products?categoryId=dich-vu' },
    { name: 'Sửa chữa', path: '/services' },
    { name: 'Bảo hành', path: '/policy/warranty' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-40 glass border-b border-slate-100/80">
        {/* Top utility bar */}
        <div className="bg-[#040e1b] text-white text-3xs font-medium py-1.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-500 animate-pulse fill-orange-500/10" />
                Hotline kỹ thuật 24/7: <strong className="text-orange-400 font-extrabold text-2xs">{settings.hotline}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <a href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                Hỗ trợ Zalo tư vấn ngay
              </a>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <Link to="/policy/shipping" className="hover:text-white transition-colors">Giao lắp siêu tốc 2h</Link>
              <span>•</span>
              <Link to="/policy/warranty" className="hover:text-white transition-colors">Cam kết bảo hành dài hạn</Link>
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px] md:h-[76px] gap-4">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
                  <span className="text-white font-black text-base md:text-lg">D</span>
                </div>
                <span className="font-extrabold text-sm md:text-base tracking-tight text-slate-900 leading-none">
                  Điện Lạnh <span className="text-primary-600 block md:inline text-xs md:text-base">247</span>
                </span>
              </Link>
            </div>

            {/* Middle: Autocomplete Search Bar */}
            <div ref={searchRef} className="flex-grow max-w-[160px] xl:max-w-[240px] relative hidden lg:block">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm thiết bị hoặc phụ tùng linh kiện..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-4 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-3xs transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-2xl overflow-hidden z-50">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Gợi ý sản phẩm ({suggestions.length})</span>
                    {isSearching && <span className="animate-pulse text-primary-500">Đang tìm...</span>}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {suggestions.length === 0 ? (
                      <div className="p-4 text-center text-3xs text-slate-400">
                        Không tìm thấy sản phẩm nào khớp với từ khóa.
                      </div>
                    ) : (
                      suggestions.map((product) => {
                        const price = product.salePrice || product.basePrice;
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleSuggestionClick(product.slug)}
                            className="w-full px-3 py-2 flex gap-3 items-center hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-b-0 cursor-pointer"
                          >
                            <img
                              src={product.images?.[0]?.url || '/placeholder-product.png'}
                              alt={product.name}
                              className="w-8 h-8 object-cover rounded border border-slate-100 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.png';
                              }}
                            />
                            <div className="flex-grow">
                              <h4 className="text-3xs font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                              <p className="text-[9px] text-slate-400 mt-0.5">SKU: {product.sku}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-3xs font-extrabold text-primary-600">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(price)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="text-[10px] font-extrabold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Xem tất cả kết quả tìm kiếm <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? 'text-primary-600 bg-primary-50/70'
                        : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right-side Icons */}
            <div className="flex items-center gap-2.5 md:gap-4">
              
              {/* Account Dropdown */}
              {isAuthenticated ? (
                <div ref={accountMenuRef} className="relative hidden sm:block">
                  <button
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                    className="flex items-center gap-1.5 py-1 text-slate-600 hover:text-primary-600 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs">
                      {(user?.firstName || user?.email || 'K').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-3xs font-bold hidden xl:block max-w-[80px] truncate">
                      {user?.firstName || user?.email?.split('@')[0] || 'Tài khoản'}
                    </span>
                  </button>
                  {/* Dropdown content */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 ring-1 ring-black/5 z-50">
                      <div className="px-3 py-1.5 border-b border-slate-50">
                        <p className="text-[9px] font-semibold text-slate-400">Tài khoản</p>
                        <p className="text-3xs font-bold text-slate-800 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/account?tab=profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-3 py-2 text-3xs font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-3 py-2 text-3xs font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/my-services"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-3 py-2 text-3xs font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        Lịch sử sửa chữa
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-3xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50 cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-3xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Đăng nhập
                </Link>
              )}

              {/* Cart Icon */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="text-slate-600 hover:text-primary-600 transition-colors relative p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer shrink-0"
                title="Giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-sm shadow-red-500/30">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <Link
                to="/service-booking"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 hover:-translate-y-0.5 transition-all shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                Đặt lịch sửa chữa
              </Link>

              {/* Hamburger Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-slate-600 hover:text-primary-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Search Row (visible on mobile only) */}
        <div className="px-4 pb-2.5 sm:hidden border-t border-slate-50 bg-white/90 flex gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-grow mt-1.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm thiết bị, linh kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] transition-all focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2 text-slate-400 hover:text-primary-600 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <Link
            to="/service-booking"
            className="mt-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm"
          >
            Đặt lịch
          </Link>
        </div>
      </header>

      {/* Slide-out Drawers */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
