import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ServiceBookingSuccess() {
  useDocumentTitle('Đặt lịch thành công');

  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || '';

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-2xs p-8 md:p-12 max-w-lg w-full text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl font-black text-slate-900 mb-2"
          >
            Đặt lịch thành công!
          </motion.h1>

          {/* Request ID */}
          {requestId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-4"
            >
              <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Mã yêu cầu</span>
              <span className="text-lg font-black text-primary-600 bg-primary-50 border border-primary-100 px-4 py-1.5 rounded-xl inline-block">
                {requestId}
              </span>
            </motion.div>
          )}

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto"
          >
            Điện Lạnh 247 sẽ liên hệ xác nhận lịch hẹn trong vòng 30 phút. Vui lòng để ý điện thoại để nhận cuộc gọi xác nhận.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/my-services">
              <Button
                variant="primary"
                size="md"
                className="rounded-xl text-xs font-bold w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Theo dõi lịch sử
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="outline"
                size="md"
                className="rounded-xl text-xs font-bold w-full sm:w-auto"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Về trang chủ
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
