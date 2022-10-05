import "./AgGridStyles.scss";

import clsx from "clsx";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AgGridContext } from "../contexts/AgGridContext";
import { AgGridReact } from "ag-grid-react";
import { CellClickedEvent, ColDef } from "ag-grid-community";
import { GridReadyEvent, SelectionChangedEvent } from "ag-grid-community/dist/lib/events";
import { GridOptions } from "ag-grid-community/dist/lib/entities/gridOptions";
import {usePostSortRowsHook} from "./PostSortRowHook";
import { defaultAgGridProps } from "./AgGridUtils";
import { AgGridSelectHeader } from "./AgGridSelectHeader";
import { difference, last, xorBy } from "lodash-es";
import { isNotEmpty } from "../utils/util";

export interface AgGridProps {
  dataTestId?: string;
  quickFilterValue?: string;
  externalSelectedItems: any[];
  setExternalSelectedItems: (items: any[]) => void;
  onGridReady?: GridOptions["onGridReady"];
  defaultColDef: GridOptions["defaultColDef"];
  columnDefs: GridOptions["columnDefs"];
  rowData: GridOptions["rowData"];
  noRowsOverlayText?: string;
}

/**
 * Wrapper for AgGrid to add commonly used functionality.
 */
export const AgGrid = (params: AgGridProps): JSX.Element => {
  const {
    gridReady,
    setGridApi,
    setQuickFilter,
    ensureRowVisible,
    setSelectedRowIds,
    ensureSelectedRowIsVisible,
  } = useContext(AgGridContext);

  const lastSelectedIds = useRef<number[]>([]);
  const [staleGrid, setStaleGrid] = useState(false);
  const postSortRows = usePostSortRowsHook({ setStaleGrid });

  /**
   * AgGrid checkbox select does not pass clicks within cell but not on the checkbox to checkbox.
   * This passes the event to the checkbox when you click anywhere in the cell.
   */
  const clickSelectorCheckboxWhenContainingCellClicked = useCallback(({ event }: CellClickedEvent) => {
    if (!event) return;
    const input = (event.target as Element).querySelector("input");
    input?.dispatchEvent(event);
  }, []);

  /**
   * Ensure external selected items list is in sync with panel.
   */
  const synchroniseExternalStateToGridSelection = ({ api }: SelectionChangedEvent) => {
    const selectedRows = api.getSelectedRows();
    // We don't want to update selected Items if it hasn't changed to prevent excess renders
    if (
      params.externalSelectedItems.length != selectedRows.length ||
      isNotEmpty(xorBy(selectedRows, params.externalSelectedItems, (row) => row.id))
    ) {
      params.setExternalSelectedItems([...selectedRows]);
    }
  };

  /**
   * Synchronise externally selected items to grid.
   * If new ids are selected scroll them into view.
   */
  const synchroniseExternallySelectedItemsToGrid = useCallback(() => {
    if (!gridReady()) return;

    const selectedIds = params.externalSelectedItems.map((row) => row.id) as number[];
    const lastNewId = last(difference(selectedIds, lastSelectedIds.current));
    if (lastNewId != null) ensureRowVisible(lastNewId);
    lastSelectedIds.current = selectedIds;
    setSelectedRowIds(selectedIds);
  }, [params.externalSelectedItems, ensureRowVisible, gridReady, setSelectedRowIds]);

  /**
   * Synchronise quick filter to grid
   */
  const updateQuickFilter = useCallback(() => {
    if (!gridReady()) return;
    if (params.quickFilterValue == null) return;
    setQuickFilter(params.quickFilterValue);
  }, [gridReady, params.quickFilterValue, setQuickFilter]);

  /**
   * Synchronise quick filter to grid
   */
  useEffect(() => {
    updateQuickFilter();
  }, [updateQuickFilter]);

  /**
   * Synchronise externally selected items to grid on externalSelectedItems change
   */
  useEffect(() => {
    synchroniseExternallySelectedItemsToGrid();
  }, [synchroniseExternallySelectedItemsToGrid]);

  const columnDefs = useMemo(
    () => [
      {
        colId: "selection",
        editable: false,
        initialWidth: 35,
        minWidth: 35,
        maxWidth: 35,
        suppressSizeToFit: true,
        checkboxSelection: true,
        headerComponent: AgGridSelectHeader,
        onCellClicked: clickSelectorCheckboxWhenContainingCellClicked,
      },
      ...(params.columnDefs as ColDef[]),
    ],
    [clickSelectorCheckboxWhenContainingCellClicked, params.columnDefs],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      params.onGridReady && params.onGridReady(event);
      synchroniseExternallySelectedItemsToGrid();
      updateQuickFilter();
    },
    [params, setGridApi, synchroniseExternallySelectedItemsToGrid, updateQuickFilter],
  );

  const noRowsOverlayComponent = useCallback(
    () => (
      <span className="ag-overlay-no-rows-center">{params.noRowsOverlayText ?? "There are currently no rows"}</span>
    ),
    [params.noRowsOverlayText],
  );

  const defaultProps = useMemo(() => defaultAgGridProps(), []);

  return (
    <div
      data-testid={params.dataTestId}
      className={clsx("ag-grid-grid", "ag-grid-grid--editing", "ag-theme-alpine", staleGrid && "aggrid-sortIsStale")}
      onContextMenu={(event) => {
        // we don't want context menu to bubble outside of container
        event.preventDefault();
        return false;
      }}
    >
      <AgGridReact
        {...defaultProps}
        onCellClicked={() => {
          /* override old aggrid default */
        }}
        onCellDoubleClicked={(event) => {
          if (event.column.getColId() === "selection") return;
          defaultProps.onCellContextMenu(event);
        }}
        columnDefs={columnDefs}
        defaultColDef={params.defaultColDef}
        rowData={params.rowData}
        noRowsOverlayComponent={noRowsOverlayComponent}
        onGridReady={onGridReady}
        onSortChanged={ensureSelectedRowIsVisible}
        postSortRows={postSortRows}
        onSelectionChanged={synchroniseExternalStateToGridSelection}
        suppressBrowserResizeObserver={true}
      />
    </div>
  );
};