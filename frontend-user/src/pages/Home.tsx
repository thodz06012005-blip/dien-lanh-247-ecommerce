import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  MapPin,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import ServiceCard from '@/components/cards/ServiceCard';
import ProductCard from '@/components/cards/ProductCard';
import CategoryCard from '@/components/cards/CategoryCard';
import TrustRibbon from '@/components/trust/TrustRibbon';
import QuickContactForm from '@/components/forms/QuickContactForm';
import DeferredHomeSections from '@/components/performance/DeferredHomeSections';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useCart } from '@/hooks/useCart';
import {
  articles,
  categories,
  defaultHomepageContent,
  projects,
  trustItems,
  type HomepageContent,
} from '@/data/phase4Content';
import { CmsManagedHomepage } from '@/features/content';
import { Button, Container, Section, SectionHeader } from '@/design-system';
import OptimizedImage from '@/components/common/OptimizedImage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const serviceIcons = [Wrench, Sparkles, ShieldCheck, RotateCcw, Headphones, Wrench];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);

export default function Home() {
  useDocumentTitle(
    'Điện Lạnh 247 - Sửa chữa, bảo trì và sản phẩm điện lạnh chính hãng',
    'Đặt lịch kỹ thuật, theo dõi yêu cầu và khám phá sản phẩm điện lạnh với quy trình báo giá, lịch hẹn và bảo hành rõ ràng.',
  );
  const { services, isLoading: servicesLoading, error: servicesError } = useServices();
  const { products: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { products: catalogProducts } = useProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
  const { addToCart } = useCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const serviceHighlights = services.slice(0, 6);
  const productHighlights = (
    featuredProducts.length > 0 ? featuredProducts : catalogProducts
  ).slice(0, 4);

  const fallbackContent: HomepageContent = {
    ...defaultHomepageContent,
    stats: {
      completedRequests: 1250,
      technicianCount: 12,
      districtCoverage: 8,
    },
  };

  return (
    <CmsManagedHomepage
      fallback={
        <div className="overflow-hidden">
          <section className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden bg-[#061527] text-white md:min-h-[calc(100vh-76px)]">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1621905252472-e4b5d9fbe0c5"
              alt="Kỹ thuật viên kiểm tra hệ thống điều hòa"
              priority
              width={1600}
              height={900}
              widths={[640, 960, 1280, 1600]}
              sizes="100vw"
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
              fallbackClassName="absolute inset-0 -z-20 h-full w-full"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-[#061527]/45" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_30%,rgba(6,182,212,0.14),transparent_35%)]" />

            <Container className="flex min-h-[calc(100vh-64px)] items-center py-16 md:min-h-[calc(100vh-76px)] md:py-20">
              <div className="grid w-full gap-12 lg:grid-cols-[1fr_360px] lg:items-center">
                <div className="max-w-4xl">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="h-px w-8 bg-cyan-400" />
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
                      Dịch vụ điện lạnh chuyên nghiệp
                    </span>
                  </div>
                  <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-8xl">
                    Không gian mát lành,
                    <span className="mt-2 block text-cyan-300">dịch vụ rõ ràng từ đầu.</span>
                  </h1>
                  <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                    Sửa chữa, vệ sinh, lắp đặt và bảo trì điện lạnh với lịch hẹn, báo giá và
                    bảo hành được xác nhận minh bạch.
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Button asChild variant="primary" size="lg" className="bg-orange-700 hover:bg-orange-600">
                      <Link to="/service-booking">
                        <Wrench size={18} />
                        Đặt lịch kỹ thuật
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-white/25 bg-white/10 text-white hover:bg-white hover:text-slate-950">
                      <a href="tel:0987654321">
                        <Headphones size={18} />
                        0987 654 321
                      </a>
                    </Button>
                  </div>

                  <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-7">
                    {[
                      ['1.250+', 'Yêu cầu hoàn tất'],
                      ['12', 'Kỹ thuật viên'],
                      ['8', 'Quận phục vụ'],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <QuickContactForm className="hidden lg:block" />
              </div>
            </Container>
          </section>

          <TrustRibbon items={trustItems.slice(0, 4)} />

          <DeferredHomeSections
            render={() => (
              <>
                <Section padding="lg" className="bg-white">
                  <Container>
                    <SectionHeader
                      eyebrow="Danh mục chính"
                      title="Bạn đang cần hỗ trợ điều gì?"
                      description="Đi thẳng vào nhóm nhu cầu phổ biến thay vì phải tìm giữa quá nhiều lựa chọn."
                      action={
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/services">
                            Xem tất cả dịch vụ
                            <ArrowRight size={16} />
                          </Link>
                        </Button>
                      }
                    />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                      {categories.slice(0, 6).map((category) => (
                        <CategoryCard key={category.slug} category={category} />
                      ))}
                    </div>
                  </Container>
                </Section>

                <Section padding="lg" className="bg-slate-50">
                  <Container>
                    <SectionHeader
                      eyebrow="Dịch vụ nổi bật"
                      title="Giải pháp kỹ thuật cho từng nhu cầu"
                      description="Mỗi dịch vụ đều có phạm vi công việc, giá tham khảo và chính sách bảo hành rõ ràng."
                      align="center"
                    />

                    {servicesError ? (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
                        Chưa thể tải danh sách dịch vụ. Vui lòng thử lại sau hoặc gọi hotline để được hỗ trợ.
                      </div>
                    ) : servicesLoading ? (
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                          <div key={index} className="h-64 animate-pulse rounded-3xl bg-white" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {serviceHighlights.map((service, index) => (
                          <ServiceCard key={service.id} service={service} icon={serviceIcons[index % serviceIcons.length]} />
                        ))}
                      </div>
                    )}
                  </Container>
                </Section>

                <Section padding="lg" className="bg-white">
                  <Container>
                    <SectionHeader
                      eyebrow="Sản phẩm nổi bật"
                      title="Thiết bị được nhiều khách hàng lựa chọn"
                      description="Sản phẩm có thông tin giá, thương hiệu và tình trạng kho rõ ràng."
                      action={
                        <Button asChild variant="outline" size="sm">
                          <Link to="/products">
                            Xem tất cả sản phẩm
                            <ChevronRight size={16} />
                          </Link>
                        </Button>
                      }
                    />

                    {featuredLoading ? (
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {Array.from({ length: 4 }, (_, index) => (
                          <div key={index} className="h-96 animate-pulse rounded-3xl bg-slate-100" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {productHighlights.map((product, i) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            isBestseller={i < 2}
                            isAdding={addingProductId === product.id}
                            onAddToCart={async (variantId, quantity) => {
                              setAddingProductId(product.id);
                              try {
                                await addToCart(variantId, quantity);
                              } finally {
                                setAddingProductId(null);
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Container>
                </Section>

                <Section padding="none" className="bg-[#061527] text-white">
                  <div className="grid lg:grid-cols-2">
                    <div className="relative min-h-[420px] overflow-hidden">
                      <OptimizedImage
                        src={projects[1]?.image ?? 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'}
                        alt={projects[1]?.title ?? 'Công trình điện lạnh'}
                        width={1200}
                        height={800}
                        widths={[480, 768, 1024, 1440]}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="absolute inset-0 h-full w-full object-cover"
                        fallbackClassName="absolute inset-0 h-full w-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061527]/70 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#061527]/50" />
                    </div>
                    <div className="flex items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
                      <div className="max-w-xl">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                          Quy trình rõ ràng
                        </p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                          Không phát sinh mơ hồ trong từng bước xử lý.
                        </h2>
                        <div className="mt-8 space-y-6">
                          {[
                            ['01', 'Tiếp nhận và xác nhận', 'Ghi nhận đầy đủ nhu cầu, thời gian và khu vực phục vụ.'],
                            ['02', 'Kiểm tra và báo giá', 'Kỹ thuật viên kiểm tra hiện trạng trước khi thực hiện.'],
                            ['03', 'Hoàn tất và bảo hành', 'Cập nhật kết quả, chi phí và thời hạn bảo hành rõ ràng.'],
                          ].map(([number, title, description]) => (
                            <div key={number} className="flex gap-4 border-t border-white/15 pt-5">
                              <span className="text-lg font-black text-cyan-300">{number}</span>
                              <div>
                                <h3 className="font-bold text-white">{title}</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button asChild variant="primary" size="lg" className="mt-9 bg-orange-700 hover:bg-orange-600">
                          <Link to="/service-booking">
                            Bắt đầu đặt lịch
                            <ArrowRight size={18} />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section padding="lg" className="bg-slate-50">
                  <Container>
                    <SectionHeader
                      eyebrow="Dự án thực tế"
                      title="Không gian đã được Điện Lạnh 247 hoàn thiện"
                      description="Từ căn hộ gia đình đến văn phòng và mặt bằng kinh doanh."
                      action={
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/projects">
                            Xem tất cả dự án
                            <ArrowRight size={16} />
                          </Link>
                        </Button>
                      }
                    />
                    <div className="grid gap-5 md:grid-cols-3">
                      {projects.slice(0, 3).map((project, index) => (
                        <Link
                          key={project.slug}
                          to={`/projects/${project.slug}`}
                          className={`group relative overflow-hidden rounded-3xl ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                        >
                          <OptimizedImage
                            src={project.image}
                            alt={project.title}
                            width={index === 0 ? 1200 : 800}
                            height={index === 0 ? 900 : 600}
                            sizes={index === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                            className={`w-full object-cover transition duration-500 group-hover:scale-105 ${index === 0 ? 'h-[420px] md:h-full' : 'h-[280px]'}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                              <MapPin size={14} />
                              {project.location}
                            </div>
                            <h3 className="mt-2 text-xl font-black">{project.title}</h3>
                            <p className="mt-2 text-sm text-slate-300">
                              {project.category} · {project.completionDate}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Container>
                </Section>

                <Section padding="lg" className="bg-white">
                  <Container>
                    <SectionHeader
                      eyebrow="Góc kiến thức"
                      title="Hướng dẫn sử dụng thiết bị hiệu quả hơn"
                      description="Nội dung thực tế giúp bạn giảm điện năng, nhận biết lỗi sớm và kéo dài tuổi thọ thiết bị."
                      action={
                        <Button asChild variant="outline" size="sm">
                          <Link to="/articles">
                            Xem tất cả bài viết
                            <ArrowRight size={16} />
                          </Link>
                        </Button>
                      }
                    />
                    <div className="grid gap-6 md:grid-cols-3">
                      {articles.slice(0, 3).map((article) => (
                        <article key={article.slug} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                          <Link to={`/articles/${article.slug}`}>
                            <OptimizedImage
                              src={article.image}
                              alt={article.title}
                              width={800}
                              height={500}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="p-5">
                              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                <span>{article.category}</span>
                                <span>{article.readTime}</span>
                              </div>
                              <h3 className="mt-3 text-lg font-black leading-snug text-slate-900 group-hover:text-blue-700">
                                {article.title}
                              </h3>
                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                                {article.excerpt}
                              </p>
                            </div>
                          </Link>
                        </article>
                      ))}
                    </div>
                  </Container>
                </Section>
              </>
            )}
          />
        </div>
      }
      fallbackContent={fallbackContent}
      formatPrice={formatPrice}
      productHighlights={productHighlights}
      serviceHighlights={serviceHighlights}
    />
  );
}
