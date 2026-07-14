import { useEffect, useRef } from 'react';

export default function useUnsavedChanges(
  isDirty: boolean,
  message = 'Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?',
) {
  const acceptedHash = useRef(window.location.hash);
  const restoring = useRef(false);

  useEffect(() => {
    if (!isDirty) acceptedHash.current = window.location.hash;
  }, [isDirty]);

  useEffect(() => {
    const handleHashChange = () => {
      if (restoring.current) {
        restoring.current = false;
        return;
      }
      if (!isDirty) {
        acceptedHash.current = window.location.hash;
        return;
      }
      if (window.confirm(message)) {
        acceptedHash.current = window.location.hash;
        return;
      }
      restoring.current = true;
      window.location.hash = acceptedHash.current || '#/';
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
}
