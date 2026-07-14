import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  LoaderCircle,
  ShieldX,
  X,
  XCircle,
} from 'lucide-react';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
  icon: 'h-11 w-11 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = 'Đang xử lý',
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'ds-focus-ring inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold transition duration-200',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : leftIcon}
      {loading ? <span>{loadingLabel}</span> : children}
      {!loading && rightIcon}
    </button>
  );
});

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, required, disabled, children }: FieldShellProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className={cn('grid gap-2', disabled && 'opacity-70')}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-slate-800">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-red-600">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  'ds-focus-ring min-h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id: providedId, label, hint, error, required, disabled, className, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} disabled={disabled}>
      <input
        ref={ref}
        id={id}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined}
        className={cn(
          controlBase,
          error ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-primary-500',
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id: providedId,
    label,
    hint,
    error,
    required,
    disabled,
    placeholder = 'Chọn một giá trị',
    options,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} disabled={disabled}>
      <select
        ref={ref}
        id={id}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined}
        className={cn(
          controlBase,
          'appearance-none bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%] bg-[size:5px_5px,5px_5px] bg-no-repeat pr-10',
          error ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-primary-500',
          className,
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id: providedId, label, hint, error, required, disabled, className, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} disabled={disabled}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined}
        className={cn(
          controlBase,
          'min-h-28 resize-y py-3 leading-6',
          error ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-primary-500',
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
});

function useOverlayA11y(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;
      const elements = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  return panelRef;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useOverlayA11y(open, onClose);

  if (!open || typeof document === 'undefined') return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/60 bg-white shadow-2xl sm:rounded-3xl',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-black text-slate-950">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export interface DrawerProps extends Omit<ModalProps, 'size'> {
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 'md',
  closeOnBackdrop = true,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useOverlayA11y(open, onClose);

  if (!open || typeof document === 'undefined') return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Đóng ngăn trượt"
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'absolute inset-y-0 flex w-[min(92vw,42rem)] flex-col bg-white shadow-2xl',
          side === 'left' ? 'left-0 rounded-r-3xl' : 'right-0 rounded-l-3xl',
          widths[width],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-black text-slate-950">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function Tabs({ items, value, onChange, ariaLabel = 'Danh mục nội dung' }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (currentIndex: number, direction: 1 | -1) => {
    let next = currentIndex;
    for (let count = 0; count < items.length; count += 1) {
      next = (next + direction + items.length) % items.length;
      if (!items[next].disabled) {
        refs.current[next]?.focus();
        onChange(items[next].id);
        return;
      }
    }
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveFocus(index, 1);
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveFocus(index, -1);
              }
              if (event.key === 'Home') {
                event.preventDefault();
                refs.current[0]?.focus();
                onChange(items[0].id);
              }
              if (event.key === 'End') {
                event.preventDefault();
                refs.current[items.length - 1]?.focus();
                onChange(items[items.length - 1].id);
              }
            }}
            className={cn(
              'ds-focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition',
              active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
              'disabled:cursor-not-allowed disabled:opacity-45',
            )}
          >
            {item.label}
            {item.badge !== undefined && (
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-700">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
};

export function Badge({
  variant = 'neutral',
  className,
  children,
}: { variant?: BadgeVariant; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const alertStyles: Record<AlertVariant, { wrapper: string; icon: typeof Info }> = {
  info: { wrapper: 'border-blue-200 bg-blue-50 text-blue-950', icon: Info },
  success: { wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-950', icon: CheckCircle2 },
  warning: { wrapper: 'border-amber-200 bg-amber-50 text-amber-950', icon: AlertCircle },
  danger: { wrapper: 'border-red-200 bg-red-50 text-red-950', icon: XCircle },
};

export function Alert({
  variant = 'info',
  title,
  children,
  action,
}: {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const config = alertStyles[variant];
  const Icon = config.icon;

  return (
    <div role={variant === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl border p-4', config.wrapper)}>
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{title}</p>
        {children && <div className="mt-1 text-sm leading-6 opacity-85">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-slate-200', className)} {...props} />;
}

export interface StatePanelProps {
  state: 'loading' | 'empty' | 'error' | 'permission-denied';
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function StatePanel({ state, title, description, action }: StatePanelProps) {
  const config = {
    loading: {
      icon: LoaderCircle,
      title: 'Đang tải dữ liệu',
      description: 'Vui lòng chờ trong giây lát.',
      iconClass: 'animate-spin text-primary-600',
    },
    empty: {
      icon: Info,
      title: 'Chưa có dữ liệu',
      description: 'Nội dung sẽ hiển thị khi có dữ liệu phù hợp.',
      iconClass: 'text-slate-500',
    },
    error: {
      icon: XCircle,
      title: 'Không thể tải nội dung',
      description: 'Đã xảy ra lỗi. Hãy thử lại hoặc liên hệ bộ phận hỗ trợ.',
      iconClass: 'text-red-600',
    },
    'permission-denied': {
      icon: ShieldX,
      title: 'Bạn không có quyền truy cập',
      description: 'Tài khoản hiện tại không được phép xem nội dung này.',
      iconClass: 'text-amber-700',
    },
  }[state];
  const Icon = config.icon;

  return (
    <section
      role={state === 'error' ? 'alert' : 'status'}
      className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon aria-hidden="true" className={cn('h-6 w-6', config.iconClass)} />
      </div>
      <h2 className="text-lg font-black text-slate-950">{title || config.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description || config.description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ interactive = false, padding = 'md', className, children, ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' };
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_-18px_rgba(15,23,42,0.25)]',
        interactive && 'transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_18px_42px_-18px_rgba(37,99,235,0.28)]',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Đường dẫn trang" className="overflow-x-auto">
      <ol className="flex min-h-10 items-center gap-1 whitespace-nowrap text-sm">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-400" />}
              {current || !item.href ? (
                <span aria-current={current ? 'page' : undefined} className={current ? 'font-bold text-slate-900' : 'text-slate-500'}>
                  {item.label}
                </span>
              ) : (
                <a className="ds-focus-ring rounded-md text-slate-500 hover:text-primary-700" href={item.href}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const pages = useMemo(() => {
    const safeCount = Math.max(1, pageCount);
    const start = Math.max(1, Math.min(page - 2, safeCount - 4));
    const end = Math.min(safeCount, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pageCount]);

  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </Button>
      {pages.map((item) => (
        <Button
          key={item}
          variant={item === page ? 'primary' : 'ghost'}
          size="icon"
          aria-label={`Trang ${item}`}
          aria-current={item === page ? 'page' : undefined}
          onClick={() => onPageChange(item)}
        >
          {item}
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        aria-label="Trang sau"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </nav>
  );
}

type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, 'id'> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function DesignSystemToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration = 5000, ...input }: Omit<ToastItem, 'id'> & { duration?: number }) => {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setItems((current) => [...current.slice(-3), { id, ...input }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useDesignSystemToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useDesignSystemToast must be used inside DesignSystemToastProvider');
  return context;
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (typeof document === 'undefined') return null;

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertCircle,
    danger: XCircle,
  };
  const styles = {
    info: 'border-blue-200 text-blue-950',
    success: 'border-emerald-200 text-emerald-950',
    warning: 'border-amber-200 text-amber-950',
    danger: 'border-red-200 text-red-950',
  };

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[380px]"
    >
      {items.map((item) => {
        const Icon = icons[item.variant];
        return (
          <div
            key={item.id}
            role={item.variant === 'danger' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full gap-3 rounded-2xl border bg-white p-4 shadow-2xl',
              styles[item.variant],
            )}
          >
            <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-5 opacity-75">{item.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => onDismiss(item.id)}
              className="ds-focus-ring -m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
