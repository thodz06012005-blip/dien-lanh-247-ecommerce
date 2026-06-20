import { useEffect } from 'react';

export default function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Điện Lạnh 247` : 'Điện Lạnh 247 - Thiết bị & Dịch vụ lắp đặt vệ sinh uy tín';
    
    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    
    const descContent = description || 'Hệ thống Điện Lạnh 247 phân phối thiết bị điều hòa, tủ lạnh, máy giặt chính hãng và dịch vụ sửa chữa bảo trì khẩn cấp siêu tốc trong 2h tại Hà Nội & HCM.';
    metaDesc.setAttribute('content', descContent);
    
    // Update Open Graph tags in head
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title ? `${title} | Điện Lạnh 247` : 'Điện Lạnh 247');

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', descContent);
  }, [title, description]);
}
