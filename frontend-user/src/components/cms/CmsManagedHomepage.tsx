import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Quote, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteContent, type SiteBanner, type SiteContentBundle } from '@/services/contentApi';

interface FallbackTestimonial {
  name: string;
  role: string;
  rating: number;
  quote: string;
}

interface CmsManagedHomepageProps {
  fallbackTestimonials: FallbackTestimonial[];
}

function resolveMedia(value?: string | null) {
  const url = String(value || '');
  if (!url.startsWith('/')) return url;
  const api = import.meta.env.VITE_CONTENT_API_BASE_URL || 'http://localhost:3000/api/v1';
  return `${api.replace(/\/api\/v1\/?$/, '')}${url}`;
}

function Cta({ href, label }: { href?: string | null; label?: string | null }) {
  if (!href || !label) return null;
  const className = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5';
  return href.startsWith('/') ? <Link to={href} className={className}>{label}<ArrowRight className="h-4 w-4" /></Link> : <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{label}<ArrowRight className="h-4 w-4" /></a>;
}

function CampaignBanner({ banner }: { banner: SiteBanner }) {
  const image = resolveMedia(banner.desktopMediaUrl || banner.mobileMediaUrl);
  return (
    <section className="relative isolate overflow-hidden bg-[#061527] py-16 text-white sm:py-20">
      {image && <img src={image} alt={banner.title} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" loading="lazy" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/55" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {banner.eyebrow && <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{banner.eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{banner.title}</h2>
          {banner.subtitle && <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{banner.subtitle}</p>}
          <div className="mt-7 flex flex-wrap gap-3"><Cta href={banner.ctaUrl} label={banner.ctaLabel} />{banner.secondaryCtaUrl && banner.secondaryCtaLabel && (banner.secondaryCtaUrl.startsWith('/') ? <Link to={banner.secondaryCtaUrl} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white backdrop-blur hover:bg-white/15">{banner.secondaryCtaLabel}</Link> : <a href={banner.secondaryCtaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white backdrop-blur hover:bg-white/15">{banner.secondaryCtaLabel}</a>)}</div>
        </div>
      </div>
    </section>
  );
}

export default function CmsManagedHomepage({ fallbackTestimonials }: CmsManagedHomepageProps) {
  const query = useQuery({
    queryKey: ['site-content', 'home'],
    queryFn: async () => (await getSiteContent('home')).data,
    staleTime: 60_000,
    retry: 1,
  });
  const bundle: SiteContentBundle | undefined = query.data;
  const testimonials = bundle?.testimonials?.length
    ? bundle.testimonials.map((item) => ({
        name: item.customerName,
        role: [item.customerTitle, item.company].filter(Boolean).join(' · ') || item.serviceTitle || 'Khách hàng Điện Lạnh 247',
        rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
        quote: item.quote,
      }))
    : fallbackTestimonials;
  const campaign = bundle?.banners?.find((item) => item.placement !== 'HOME_HERO') || bundle?.banners?.[0];
  const sections = bundle?.sections?.filter((item) => item.sectionKey.startsWith('HOME_') && item.sectionKey !== 'HOME_HERO') || [];

  return (
    <>
      {campaign && <CampaignBanner banner={campaign} />}

      {sections.map((section) => (
        <section key={section.id} className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            {section.eyebrow && <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">{section.eyebrow}</p>}
            {section.title && <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{section.title}</h2>}
            {section.content && <div className="prose prose-slate mx-auto mt-6 max-w-none text-left text-sm leading-7" dangerouslySetInnerHTML={{ __html: section.content }} />}
          </div>
        </section>
      ))}

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Khách hàng chia sẻ</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">Trải nghiệm được tạo nên từ những chi tiết nhỏ</h2></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">{testimonials.slice(0, 6).map((item) => <figure key={`${item.name}-${item.quote}`} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><Quote aria-hidden="true" className="h-8 w-8 text-blue-100" /><div className="mt-4 flex gap-1" aria-label={`${item.rating} trên 5 sao`}>{Array.from({ length: item.rating }).map((_, index) => <Star key={index} aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div><blockquote className="mt-4 text-sm leading-7 text-slate-700">“{item.quote}”</blockquote><figcaption className="mt-6 border-t border-slate-100 pt-5"><strong className="block text-sm font-black text-slate-950">{item.name}</strong><span className="mt-1 block text-xs text-slate-500">{item.role}</span></figcaption></figure>)}</div>
        </div>
      </section>

      {bundle?.partners?.length ? (
        <section className="border-y border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary-600" /><h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Đối tác đồng hành</h2></div><div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{bundle.partners.map((partner) => { const content = <div className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">{partner.logoUrl ? <img src={resolveMedia(partner.logoUrl)} alt={partner.logoAlt || partner.name} className="max-h-12 max-w-full object-contain" loading="lazy" /> : <span className="text-sm font-black text-slate-700">{partner.name}</span>}</div>; return partner.websiteUrl ? <a key={partner.id} href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Mở website ${partner.name}`}>{content}</a> : <div key={partner.id}>{content}</div>; })}</div></div>
        </section>
      ) : null}
    </>
  );
}
