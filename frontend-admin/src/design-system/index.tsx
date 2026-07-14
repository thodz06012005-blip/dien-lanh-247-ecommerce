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
  Bell,
  CheckCircle2,
  ChevronDown,
  Filter,
  Info,
  LoaderCircle,
  Menu,
  Search,
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
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
  icon: 'h-10 w-10 p-0',
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
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'admin-focus-ring inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold transition duration-200',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : leftIcon}
      {loading ? loadingLabel : children}
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
  return (
    <div className={cn('grid gap-2', disabled && 'opacity-70')}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-slate-800">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-description`} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  'admin-focus-ring min-h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

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
        className={cn(controlBase, error ? 'border-red-400' : 'border-slate-300 focus:border-primary-500', className)}
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
        className={cn(controlBase, 'appearance-none pr-10', error ? 'border-red-400' : 'border-slate-300 focus:border-primary-500', className)}
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
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-description` : undefined}
        className={cn(controlBase, 'min-h-28 resize-y py-3 leading-6', error ? 'border-red-400' : 'border-slate-300 focus:border-primary-500', className)}
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
    panel?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
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
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
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
        className={cn('relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', sizes[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-black text-slate-950">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
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
          'absolute inset-y-0 flex w-[min(94vw,42rem)] flex-col bg-white shadow-2xl',
          side === 'left' ? 'left-0 rounded-r-3xl' : 'right-0 rounded-l-3xl',
          widths[width],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-black text-slate-950">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
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

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel = 'Nhóm dữ liệu',
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (currentIndex: number, direction: 1 | -1) => {
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
    <div role="tablist" aria-label={ariaLabel} className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(element) => { refs.current[index] = element; }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move(index, 1); }
              if (event.key === 'ArrowLeft') { event.preventDefault(); move(index, -1); }
            }}
            className={cn(
              'admin-focus-ring inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition',
              active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950',
              'disabled:cursor-not-allowed disabled:opacity-45',
            )}
          >
            {item.label}
            {item.badge !== undefined && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black">{item.badge}</span>}
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

export function Badge({ variant = 'neutral', children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', badgeVariants[variant], className)}>{children}</span>;
}

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
const alertConfig: Record<AlertVariant, { style: string; icon: typeof Info }> = {
  info: { style: 'border-blue-200 bg-blue-50 text-blue-950', icon: Info },
  success: { style: 'border-emerald-200 bg-emerald-50 text-emerald-950', icon: CheckCircle2 },
  warning: { style: 'border-amber-200 bg-amber-50 text-amber-950', icon: AlertCircle },
  danger: { style: 'border-red-200 bg-red-50 text-red-950', icon: XCircle },
};

export function Alert({ variant = 'info', title, children, action }: { variant?: AlertVariant; title: string; children?: ReactNode; action?: ReactNode }) {
  const config = alertConfig[variant];
  const Icon = config.icon;
  return (
    <div role={variant === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl border p-4', config.style)}>
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

export function StatePanel({
  state,
  title,
  description,
  action,
}: {
  state: 'loading' | 'empty' | 'error' | 'permission-denied';
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const config = {
    loading: { icon: LoaderCircle, title: 'Đang tải dữ liệu', description: 'Đang đồng bộ dữ liệu quản trị.', className: 'animate-spin text-primary-600' },
    empty: { icon: Info, title: 'Không có dữ liệu', description: 'Thay đổi bộ lọc hoặc tạo bản ghi mới.', className: 'text-slate-500' },
    error: { icon: XCircle, title: 'Không thể tải dữ liệu', description: 'Kiểm tra kết nối và thử lại.', className: 'text-red-600' },
    'permission-denied': { icon: ShieldX, title: 'Không đủ quyền', description: 'Liên hệ quản trị viên để được cấp quyền.', className: 'text-amber-700' },
  }[state];
  const Icon = config.icon;
  return (
    <section role={state === 'error' ? 'alert' : 'status'} className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon aria-hidden="true" className={cn('h-6 w-6', config.className)} />
      </div>
      <h2 className="text-lg font-black text-slate-950">{title || config.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description || config.description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  caption: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  loading = false,
  emptyTitle = 'Không có bản ghi',
  emptyDescription = 'Hãy thay đổi bộ lọc hoặc tạo dữ liệu mới.',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div aria-label={`Đang tải ${caption}`} className="rounded-2xl border border-slate-200 bg-white p-4">
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="mb-3 h-12 last:mb-0" />)}
      </div>
    );
  }

  if (rows.length === 0) {
    return <StatePanel state="empty" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('whitespace-nowrap border-b border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500', column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={cn('transition hover:bg-slate-50', onRowClick && 'admin-focus-ring cursor-pointer')}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('max-w-[24rem] px-4 py-3 align-middle text-slate-700', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {rows.map((row) => (
          <article
            key={rowKey(row)}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(event) => {
              if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onRowClick(row);
              }
            }}
            className={cn('grid gap-3 p-4', onRowClick && 'admin-focus-ring cursor-pointer hover:bg-slate-50')}
          >
            {columns.map((column) => (
              <div key={column.key} className="grid grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.5fr)] gap-3 text-sm">
                <span className="font-bold text-slate-500">{column.mobileLabel || column.header}</span>
                <div className="min-w-0 overflow-wrap-anywhere text-slate-800">{column.render(row)}</div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters,
  actions,
  onOpenAdvanced,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  onOpenAdvanced?: () => void;
}) {
  return (
    <section aria-label="Bộ lọc dữ liệu" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1 xl:max-w-sm">
          <span className="sr-only">Tìm kiếm</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="admin-focus-ring min-h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        {filters && <div className="flex min-w-0 flex-1 flex-wrap gap-2">{filters}</div>}
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {onOpenAdvanced && (
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={onOpenAdvanced}>
              Bộ lọc nâng cao
            </Button>
          )}
          {actions}
        </div>
      </div>
    </section>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      }
    >
      <Alert variant={danger ? 'danger' : 'warning'} title={danger ? 'Thao tác có thể không hoàn tác' : 'Vui lòng kiểm tra kỹ'}>
        Chỉ tiếp tục khi bạn đã xác minh đúng đối tượng và phạm vi thay đổi.
      </Alert>
    </Modal>
  );
}

export function FormLayout({
  title,
  description,
  children,
  actions,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">{children}</div>
        {actions && <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{actions}</div>}
      </section>
      {aside && <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">{aside}</aside>}
    </form>
  );
}

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export function AdminSidebar({
  groups,
  collapsed = false,
  mobile = false,
  brand,
  footer,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  collapsed?: boolean;
  mobile?: boolean;
  brand: ReactNode;
  footer?: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <aside
      aria-label="Điều hướng quản trị"
      className={cn(
        'flex h-full flex-col bg-[linear-gradient(180deg,#0c1b2e_0%,#061527_100%)] text-white',
        mobile ? 'w-[min(86vw,17rem)]' : collapsed ? 'w-[4.5rem]' : 'w-[16.25rem]',
      )}
    >
      <div className="flex min-h-16 items-center border-b border-white/10 px-4">{brand}</div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <section key={group.title} className="mb-5 last:mb-0">
            {!collapsed && <h2 className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</h2>}
            <div className="grid gap-1">
              {group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.disabled ? undefined : item.href}
                  aria-current={item.active ? 'page' : undefined}
                  aria-disabled={item.disabled || undefined}
                  tabIndex={item.disabled ? -1 : 0}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={cn(
                    'admin-focus-ring flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
                    item.active ? 'bg-primary-600 text-white shadow-lg shadow-primary-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-0',
                    item.disabled && 'pointer-events-none opacity-40',
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{item.badge}</span>}
                </a>
              ))}
            </div>
          </section>
        ))}
      </nav>
      {footer && <div className="border-t border-white/10 p-4">{footer}</div>}
    </aside>
  );
}

export function AdminHeader({
  title,
  eyebrow,
  onMenuToggle,
  actions,
  userName,
  userEmail,
  onProfileClick,
}: {
  title: string;
  eyebrow?: string;
  onMenuToggle: () => void;
  actions?: ReactNode;
  userName: string;
  userEmail: string;
  onProfileClick?: () => void;
}) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 shadow-sm sm:px-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Mở hoặc thu gọn menu" onClick={onMenuToggle}>
          <Menu aria-hidden="true" className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          {eyebrow && <p className="hidden text-[10px] font-black uppercase tracking-[0.14em] text-primary-600 sm:block">{eyebrow}</p>}
          <h1 className="truncate text-sm font-black text-slate-950 sm:text-base">{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {actions}
        <Button variant="ghost" size="icon" aria-label="Thông báo">
          <Bell aria-hidden="true" className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={onProfileClick}
          className="admin-focus-ring flex min-h-10 items-center gap-2 rounded-xl px-1.5 hover:bg-slate-100 sm:px-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-sm font-black text-white">{userName.charAt(0).toUpperCase()}</span>
          <span className="hidden min-w-0 text-right sm:block">
            <span className="block max-w-36 truncate text-xs font-black text-slate-900">{userName}</span>
            <span className="block max-w-36 truncate text-[10px] text-slate-500">{userEmail}</span>
          </span>
          <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}

type ToastVariant = 'info' | 'success' | 'warning' | 'danger';
interface ToastItem { id: string; title: string; description?: string; variant: ToastVariant }
interface ToastContextValue {
  toast: (input: Omit<ToastItem, 'id'> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback(({ duration = 5000, ...input }: Omit<ToastItem, 'id'> & { duration?: number }) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current.slice(-3), { id, ...input }]);
    window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);
  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AdminToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useAdminToast must be used inside AdminToastProvider');
  return context;
}

function AdminToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (typeof document === 'undefined') return null;
  const icons = { info: Info, success: CheckCircle2, warning: AlertCircle, danger: XCircle };
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[380px]">
      {items.map((item) => {
        const Icon = icons[item.variant];
        return (
          <div key={item.id} role={item.variant === 'danger' ? 'alert' : 'status'} className="pointer-events-auto flex w-full gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <Icon aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0', item.variant === 'success' && 'text-emerald-600', item.variant === 'danger' && 'text-red-600', item.variant === 'warning' && 'text-amber-600', item.variant === 'info' && 'text-primary-600')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>}
            </div>
            <button type="button" aria-label="Đóng thông báo" onClick={() => onDismiss(item.id)} className="admin-focus-ring -m-1 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
