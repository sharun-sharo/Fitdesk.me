"use client";

import * as React from "react";

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastState = {
  toasts: Toast[];
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let memoryState: ToastState = { toasts: [] };

function reducer(state: ToastState, action: { type: string; toast?: Toast; id?: string }): ToastState {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      };
    case actionTypes.DISMISS_TOAST: {
      const { id } = action;
      if (id) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === id ? { ...t, open: false } : t
          ),
        };
      }
      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.id === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    default:
      return state;
  }
}

const listeners: Array<(state: ToastState) => void> = [];

function dispatch(action: { type: string; toast?: Toast; id?: string }) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function toast(props: Omit<Toast, "id">) {
  const id = genId();
  const update = (updater: (prev: Toast) => Toast) =>
    dispatch({ type: actionTypes.UPDATE_TOAST, toast: updater({ ...props, id }) });
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, id }),
  };
}
