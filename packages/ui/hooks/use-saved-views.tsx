import * as React from "react";
import { Filter, FilterAdapter } from "@/config/data-table";
import { SortingState, VisibilityState } from "@tanstack/react-table";

export interface SavedView<TAdapter extends FilterAdapter> {
  isDefault?: boolean;
  id: string;
  name: string;
  filters: Filter<TAdapter>[];
  joinOperator: "and" | "or";
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  pageSize?: number;
  savedFields: {
    filters: boolean;
    sorting: boolean;
    columnVisibility: boolean;
    pageSize: boolean;
  };
  createdAt?: Date;
}

export interface SavedViewsState<TAdapter extends FilterAdapter> {
  views: SavedView<TAdapter>[];
  activeViewId: string | null;
}

type SavedViewsAction<TAdapter extends FilterAdapter> =
  | { type: "ADD_VIEW"; payload: SavedView<TAdapter> }
  | { type: "UPDATE_VIEW"; payload: { id: string; updates: Partial<SavedView<TAdapter>> } }
  | { type: "DELETE_VIEW"; payload: { id: string } }
  | { type: "SET_ACTIVE_VIEW"; payload: { id: string | null } }
  | { type: "SET_DEFAULT_VIEW"; payload: { id: string } }
  | { type: "RESET" };

const LOCAL_STORAGE_KEY = "data-table-saved-views";

function createSavedViewsReducer<TAdapter extends FilterAdapter>() {
  return function savedViewsReducer(
    state: SavedViewsState<TAdapter>,
    action: SavedViewsAction<TAdapter>
  ): SavedViewsState<TAdapter> {
    switch (action.type) {
      case "ADD_VIEW":
        return {
          ...state,
          views: [...state.views, action.payload],
          activeViewId: action.payload.id,
        };
      case "UPDATE_VIEW":
        return {
          ...state,
          views: state.views.map((view) =>
            view.id === action.payload.id
              ? { ...view, ...action.payload.updates }
              : view
          ),
        };
      case "DELETE_VIEW":
        return {
          ...state,
          views: state.views.filter((view) => view.id !== action.payload.id),
          activeViewId:
            state.activeViewId === action.payload.id ? null : state.activeViewId,
        };
      case "SET_ACTIVE_VIEW":
        return {
          ...state,
          activeViewId: action.payload.id,
        };
      case "SET_DEFAULT_VIEW":
        return {
          ...state,
          views: state.views.map((view) => ({
            ...view,
            isDefault: view.id === action.payload.id,
          })),
        };
      case "RESET":
        return {
          views: [],
          activeViewId: null,
        };
      default:
        return state;
    }
  };
}

export function useSavedViews<TAdapter extends FilterAdapter>(
  tableId: string,
  initialState: SavedViewsState<TAdapter> = { views: [], activeViewId: null }
) {
  const [state, dispatch] = React.useReducer(
    createSavedViewsReducer<TAdapter>(),
    initialState
  );

  React.useEffect(() => {
    try {
      const savedState = window.localStorage.getItem(`${LOCAL_STORAGE_KEY}-${tableId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as SavedViewsState<TAdapter>;
        const views = parsedState.views.map((view: any) => ({
          ...view,
          createdAt: new Date(view.createdAt),
        }));
        dispatch({
          type: "SET_ACTIVE_VIEW",
          payload: { id: parsedState.activeViewId },
        });
        views.forEach((view: SavedView<TAdapter>) => {
          dispatch({
            type: "ADD_VIEW",
            payload: view,
          });
        });
      }
    } catch (error) {
      console.error("Error loading saved views:", error);
    }
  }, [tableId]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        `${LOCAL_STORAGE_KEY}-${tableId}`,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error("Error saving views to localStorage:", error);
    }
  }, [state, tableId]);

  const activeView = React.useMemo(
    () => state.views.find((view) => view.id === state.activeViewId) || null,
    [state.views, state.activeViewId]
  );

  const defaultView = React.useMemo(
    () => state.views.find((view) => view.isDefault) || null,
    [state.views]
  );

  const addView = React.useCallback(
    (view: Omit<SavedView<TAdapter>, "id" | "createdAt">) => {
      const newView: SavedView<TAdapter> = {
        ...view,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      dispatch({ type: "ADD_VIEW", payload: newView });
      return newView;
    },
    []
  );

  const updateView = React.useCallback(
    (id: string, updates: Partial<SavedView<TAdapter>>) => {
      dispatch({ type: "UPDATE_VIEW", payload: { id, updates } });
    },
    []
  );

  const deleteView = React.useCallback((id: string) => {
    dispatch({ type: "DELETE_VIEW", payload: { id } });
  }, []);

  const setActiveView = React.useCallback((id: string | null) => {
    dispatch({ type: "SET_ACTIVE_VIEW", payload: { id } });
  }, []);

  const setDefaultView = React.useCallback((id: string) => {
    dispatch({ type: "SET_DEFAULT_VIEW", payload: { id } });
  }, []);

  const resetViews = React.useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    views: state.views,
    activeViewId: state.activeViewId,
    activeView,
    defaultView,
    addView,
    updateView,
    deleteView,
    setActiveView,
    setDefaultView,
    resetViews,
  };
}