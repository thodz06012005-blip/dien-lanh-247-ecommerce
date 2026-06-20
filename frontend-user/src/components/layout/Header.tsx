import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, Phone, MessageSquare, ChevronRight } from 'lucide-react';
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
  
  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMiniCartOpen(false);
    setShowSuggestions(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside to close search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setShowSuggestions(false);
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/products/${slug}`);
  };

  const navItems = [
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Khuyến mãi', path: '/products?sort=bestSeller' },
    { name: 'Dịch vụ lắp đặt', path: '/products?categoryId=dich-vu' },
    { name: 'Chính sách bảo hành', path: '/policy/warranty' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-40 glass border-b border-slate-100">
        {/* Top utility bar */}
        <div className="bg-primary-900 text-white text-3xs font-medium py-1.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary-400" />
                Hotline hỗ trợ: <strong className="text-primary-300">{settings.hotline}</strong>
              </span>
              <span className="text-slate-350">|</span>
              <a href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-200 transition-colors">
                <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                Chat Zalo tư vấn
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/policy/shipping" className="hover:text-primary-200 transition-colors">Giao hàng 2h</Link>
              <span>•</span>
              <Link to="/policy/warranty" className="hover:text-primary-200 transition-colors">Bảo hành 24/7</Link>
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20 gap-4">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  <span className="text-white font-black text-lg md:text-xl">D</span>
                </div>
                <span className="font-black text-base md:text-lg tracking-tight text-slate-900 leading-none">
                  Điện Lạnh <span className="text-primary-600 block text-2xs md:inline md:text-base">247</span>
                </span>
              </Link>
            </div>

            {/* Middle: Autocomplete Search Bar */}
            <div ref={searchRef} className="flex-grow max-w-md relative hidden sm:block">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm điều hòa, tủ lạnh, máy giặt..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-205 rounded-2xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-3xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Gợi ý sản phẩm ({suggestions.length})</span>
                    {isSearching && <span className="animate-pulse text-primary-500">Đang tìm...</span>}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto">
                    {suggestions.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-450">
                        Không tìm thấy sản phẩm nào khớp với từ khóa.
                      </div>
                    ) : (
                      suggestions.map((product) => {
                        const price = product.salePrice || product.basePrice;
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleSuggestionClick(product.slug)}
                            className="w-full px-4 py-3 flex gap-3 items-center hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-b-0 cursor-pointer"
                          >
                            <img
                              src={product.images?.[0]?.url || '/placeholder-product.png'}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.png';
                              }}
                            />
                            <div className="flex-grow">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                              <p className="text-3xs font-bold text-slate-400 mt-0.5">SKU: {product.sku}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs font-bold text-primary-600">
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
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-2xs font-extrabold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Xem tất cả kết quả tìm kiếm <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right-side Icons */}
            <div className="flex items-center gap-3 md:gap-5">
              
              {/* Account Dropdown */}
              {isAuthenticated ? (
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-2 py-1 text-slate-650 hover:text-primary-600 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm">
                      {(user?.firstName || user?.email || 'K').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold hidden xl:block max-w-[100px] truncate">
                      {user?.firstName || user?.email?.split('@')[0] || 'Tài khoản'}
                    </span>
                  </button>
                  {/* Dropdown content */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 ring-1 ring-black/5 hidden group-hover:block z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-2xs font-semibold text-slate-400">Tài khoản</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <Link to="/account" className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      Hồ sơ cá nhân
                    </Link>
                    <Link to="/account?tab=orders" className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      Đơn hàng của tôi
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50 cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/15 hover:scale-103 transition-all"
                >
                  Đăng nhập
                </Link>
              )}

              {/* Cart Icon */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="text-slate-650 hover:text-primary-600 transition-colors relative p-2 rounded-full hover:bg-slate-50 cursor-pointer"
                title="Giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 md:w-5.5 md:h-5.5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-3xs font-black rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-sm shadow-red-500/30">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Hamburger Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-slate-650 hover:text-primary-600 p-2 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <Menu className="w-5 h-5 md:w-5.5 md:h-5.5" />
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Search Row (visible on mobile only) */}
        <div className="px-4 pb-3 sm:hidden border-t border-slate-50 bg-white/80">
          <form onSubmit={handleSearchSubmit} className="mt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm điều hòa, tủ lạnh, máy giặt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-2xs transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 text-slate-450 hover:text-primary-600 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Slide-out Drawers */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
