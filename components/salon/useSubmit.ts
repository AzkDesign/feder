"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submit a form to a useActionState action WITHOUT React's automatic form reset,
 * so typed values survive when the server answers "a security code is required".
 */
export function submitKeeping(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Pass the submitter so a clicked <button name value> is included (e.g. direction=in/out).
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => action(fd));
  };
}
