import { CompactType, DirTypes, DisplayGrid, GridType } from './gridsterConfig.interface';
export const GridsterConfigService = {
    gridType: GridType.Fit,
    scale: 1,
    // 'scrollVertical' will fit on width and height of the items will be the same as the width
    // 'scrollHorizontal' will fit on height and width of the items will be the same as the height
    // 'fixed' will set the rows and columns dimensions based on fixedColWidth and fixedRowHeight options
    // 'verticalFixed' will set the rows to fixedRowHeight and columns width will fit the space available
    // 'horizontalFixed' will set the columns to fixedColWidth and rows height will fit the space available
    fixedColWidth: 250,
    fixedRowHeight: 250,
    keepFixedHeightInMobile: false,
    keepFixedWidthInMobile: false,
    setGridSize: false,
    compactType: CompactType.None,
    mobileBreakpoint: 640,
    useBodyForBreakpoint: false,
    allowMultiLayer: false,
    defaultLayerIndex: 0,
    maxLayerIndex: 2,
    baseLayerIndex: 1,
    minCols: 1,
    maxCols: 100,
    minRows: 1,
    maxRows: 100,
    defaultItemCols: 1,
    defaultItemRows: 1,
    maxItemCols: 50,
    maxItemRows: 50,
    minItemCols: 1,
    minItemRows: 1,
    minItemArea: 1,
    maxItemArea: 2500,
    addEmptyRowsCount: 0,
    rowHeightRatio: 1,
    margin: 10,
    outerMargin: true,
    outerMarginTop: null,
    outerMarginRight: null,
    outerMarginBottom: null,
    outerMarginLeft: null,
    useTransformPositioning: true,
    scrollSensitivity: 10,
    scrollSpeed: 20,
    initCallback: undefined,
    destroyCallback: undefined,
    gridSizeChangedCallback: undefined,
    itemChangeCallback: undefined,
    // Arguments: gridsterItem, gridsterItemComponent
    itemResizeCallback: undefined,
    // Arguments: gridsterItem, gridsterItemComponent
    itemInitCallback: undefined,
    // Arguments: gridsterItem, gridsterItemComponent
    itemRemovedCallback: undefined,
    // Arguments: gridsterItem, gridsterItemComponent
    itemValidateCallback: undefined,
    // Arguments: gridsterItem
    enableEmptyCellClick: false,
    enableEmptyCellContextMenu: false,
    enableEmptyCellDrop: false,
    enableEmptyCellDrag: false,
    enableOccupiedCellDrop: false,
    emptyCellClickCallback: undefined,
    emptyCellContextMenuCallback: undefined,
    emptyCellDropCallback: undefined,
    emptyCellDragCallback: undefined,
    emptyCellDragMaxCols: 50,
    emptyCellDragMaxRows: 50,
    // Arguments: event, gridsterItem{x, y, rows: defaultItemRows, cols: defaultItemCols}
    ignoreMarginInRow: false,
    draggable: {
        delayStart: 0,
        enabled: false,
        ignoreContentClass: 'gridster-item-content',
        ignoreContent: false,
        dragHandleClass: 'drag-handler',
        stop: undefined,
        start: undefined,
        // Arguments: item, gridsterItem, event
        dropOverItems: false,
        dropOverItemsCallback: undefined // callback on drop over another item
        // Arguments: source, target, gridComponent
    },
    resizable: {
        delayStart: 0,
        enabled: false,
        handles: {
            s: true,
            e: true,
            n: true,
            w: true,
            se: true,
            ne: true,
            sw: true,
            nw: true
        },
        stop: undefined,
        start: undefined // callback when resizing an item starts.
        // Arguments: item, gridsterItem, event
    },
    swap: true,
    swapWhileDragging: false,
    pushItems: false,
    disablePushOnDrag: false,
    disablePushOnResize: false,
    pushDirections: { north: true, east: true, south: true, west: true },
    pushResizeItems: false,
    displayGrid: DisplayGrid.OnDragAndResize,
    disableWindowResize: false,
    disableWarnings: false,
    scrollToNewItems: false,
    disableScrollHorizontal: false,
    disableScrollVertical: false,
    enableBoundaryControl: false,
    disableAutoPositionOnConflict: false,
    dirType: DirTypes.LTR // page direction, rtl=right to left ltr= left to right, if you use rtl language set dirType to rtl
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJDb25maWcuY29uc3RhbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWdyaWRzdGVyMi9zcmMvbGliL2dyaWRzdGVyQ29uZmlnLmNvbnN0YW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxXQUFXLEVBQ1gsUUFBUSxFQUNSLFdBQVcsRUFFWCxRQUFRLEVBQ1QsTUFBTSw0QkFBNEIsQ0FBQztBQUVwQyxNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDbkQsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHO0lBQ3RCLEtBQUssRUFBRSxDQUFDO0lBQ1IsMkZBQTJGO0lBQzNGLDhGQUE4RjtJQUM5RixxR0FBcUc7SUFDckcscUdBQXFHO0lBQ3JHLHVHQUF1RztJQUN2RyxhQUFhLEVBQUUsR0FBRztJQUNsQixjQUFjLEVBQUUsR0FBRztJQUNuQix1QkFBdUIsRUFBRSxLQUFLO0lBQzlCLHNCQUFzQixFQUFFLEtBQUs7SUFDN0IsV0FBVyxFQUFFLEtBQUs7SUFDbEIsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJO0lBQzdCLGdCQUFnQixFQUFFLEdBQUc7SUFDckIsb0JBQW9CLEVBQUUsS0FBSztJQUMzQixlQUFlLEVBQUUsS0FBSztJQUN0QixpQkFBaUIsRUFBRSxDQUFDO0lBQ3BCLGFBQWEsRUFBRSxDQUFDO0lBQ2hCLGNBQWMsRUFBRSxDQUFDO0lBQ2pCLE9BQU8sRUFBRSxDQUFDO0lBQ1YsT0FBTyxFQUFFLEdBQUc7SUFDWixPQUFPLEVBQUUsQ0FBQztJQUNWLE9BQU8sRUFBRSxHQUFHO0lBQ1osZUFBZSxFQUFFLENBQUM7SUFDbEIsZUFBZSxFQUFFLENBQUM7SUFDbEIsV0FBVyxFQUFFLEVBQUU7SUFDZixXQUFXLEVBQUUsRUFBRTtJQUNmLFdBQVcsRUFBRSxDQUFDO0lBQ2QsV0FBVyxFQUFFLENBQUM7SUFDZCxXQUFXLEVBQUUsQ0FBQztJQUNkLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLGlCQUFpQixFQUFFLENBQUM7SUFDcEIsY0FBYyxFQUFFLENBQUM7SUFDakIsTUFBTSxFQUFFLEVBQUU7SUFDVixXQUFXLEVBQUUsSUFBSTtJQUNqQixjQUFjLEVBQUUsSUFBSTtJQUNwQixnQkFBZ0IsRUFBRSxJQUFJO0lBQ3RCLGlCQUFpQixFQUFFLElBQUk7SUFDdkIsZUFBZSxFQUFFLElBQUk7SUFDckIsdUJBQXVCLEVBQUUsSUFBSTtJQUM3QixpQkFBaUIsRUFBRSxFQUFFO0lBQ3JCLFdBQVcsRUFBRSxFQUFFO0lBQ2YsWUFBWSxFQUFFLFNBQVM7SUFDdkIsZUFBZSxFQUFFLFNBQVM7SUFDMUIsdUJBQXVCLEVBQUUsU0FBUztJQUNsQyxrQkFBa0IsRUFBRSxTQUFTO0lBQzdCLGlEQUFpRDtJQUNqRCxrQkFBa0IsRUFBRSxTQUFTO0lBQzdCLGlEQUFpRDtJQUNqRCxnQkFBZ0IsRUFBRSxTQUFTO0lBQzNCLGlEQUFpRDtJQUNqRCxtQkFBbUIsRUFBRSxTQUFTO0lBQzlCLGlEQUFpRDtJQUNqRCxvQkFBb0IsRUFBRSxTQUFTO0lBQy9CLDBCQUEwQjtJQUMxQixvQkFBb0IsRUFBRSxLQUFLO0lBQzNCLDBCQUEwQixFQUFFLEtBQUs7SUFDakMsbUJBQW1CLEVBQUUsS0FBSztJQUMxQixtQkFBbUIsRUFBRSxLQUFLO0lBQzFCLHNCQUFzQixFQUFFLEtBQUs7SUFDN0Isc0JBQXNCLEVBQUUsU0FBUztJQUNqQyw0QkFBNEIsRUFBRSxTQUFTO0lBQ3ZDLHFCQUFxQixFQUFFLFNBQVM7SUFDaEMscUJBQXFCLEVBQUUsU0FBUztJQUNoQyxvQkFBb0IsRUFBRSxFQUFFO0lBQ3hCLG9CQUFvQixFQUFFLEVBQUU7SUFDeEIscUZBQXFGO0lBQ3JGLGlCQUFpQixFQUFFLEtBQUs7SUFDeEIsU0FBUyxFQUFFO1FBQ1QsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEVBQUUsS0FBSztRQUNkLGtCQUFrQixFQUFFLHVCQUF1QjtRQUMzQyxhQUFhLEVBQUUsS0FBSztRQUNwQixlQUFlLEVBQUUsY0FBYztRQUMvQixJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTO1FBQ2hCLHVDQUF1QztRQUN2QyxhQUFhLEVBQUUsS0FBSztRQUNwQixxQkFBcUIsRUFBRSxTQUFTLENBQUMscUNBQXFDO1FBQ3RFLDJDQUEyQztLQUM1QztJQUNELFNBQVMsRUFBRTtRQUNULFVBQVUsRUFBRSxDQUFDO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxPQUFPLEVBQUU7WUFDUCxDQUFDLEVBQUUsSUFBSTtZQUNQLENBQUMsRUFBRSxJQUFJO1lBQ1AsQ0FBQyxFQUFFLElBQUk7WUFDUCxDQUFDLEVBQUUsSUFBSTtZQUNQLEVBQUUsRUFBRSxJQUFJO1lBQ1IsRUFBRSxFQUFFLElBQUk7WUFDUixFQUFFLEVBQUUsSUFBSTtZQUNSLEVBQUUsRUFBRSxJQUFJO1NBQ1Q7UUFDRCxJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTLENBQUMseUNBQXlDO1FBQzFELHVDQUF1QztLQUN4QztJQUNELElBQUksRUFBRSxJQUFJO0lBQ1YsaUJBQWlCLEVBQUUsS0FBSztJQUN4QixTQUFTLEVBQUUsS0FBSztJQUNoQixpQkFBaUIsRUFBRSxLQUFLO0lBQ3hCLG1CQUFtQixFQUFFLEtBQUs7SUFDMUIsY0FBYyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtJQUNwRSxlQUFlLEVBQUUsS0FBSztJQUN0QixXQUFXLEVBQUUsV0FBVyxDQUFDLGVBQWU7SUFDeEMsbUJBQW1CLEVBQUUsS0FBSztJQUMxQixlQUFlLEVBQUUsS0FBSztJQUN0QixnQkFBZ0IsRUFBRSxLQUFLO0lBQ3ZCLHVCQUF1QixFQUFFLEtBQUs7SUFDOUIscUJBQXFCLEVBQUUsS0FBSztJQUM1QixxQkFBcUIsRUFBRSxLQUFLO0lBQzVCLDZCQUE2QixFQUFFLEtBQUs7SUFDcEMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUdBQW1HO0NBQzFILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wYWN0VHlwZSxcbiAgRGlyVHlwZXMsXG4gIERpc3BsYXlHcmlkLFxuICBHcmlkc3RlckNvbmZpZyxcbiAgR3JpZFR5cGVcbn0gZnJvbSAnLi9ncmlkc3RlckNvbmZpZy5pbnRlcmZhY2UnO1xuXG5leHBvcnQgY29uc3QgR3JpZHN0ZXJDb25maWdTZXJ2aWNlOiBHcmlkc3RlckNvbmZpZyA9IHtcbiAgZ3JpZFR5cGU6IEdyaWRUeXBlLkZpdCwgLy8gJ2ZpdCcgd2lsbCBmaXQgdGhlIGl0ZW1zIGluIHRoZSBjb250YWluZXIgd2l0aG91dCBzY3JvbGw7XG4gIHNjYWxlOiAxLCAvLyBzY2FsZSBwYXJhbSB0byB6b29tIGluL3pvb20gb3V0XG4gIC8vICdzY3JvbGxWZXJ0aWNhbCcgd2lsbCBmaXQgb24gd2lkdGggYW5kIGhlaWdodCBvZiB0aGUgaXRlbXMgd2lsbCBiZSB0aGUgc2FtZSBhcyB0aGUgd2lkdGhcbiAgLy8gJ3Njcm9sbEhvcml6b250YWwnIHdpbGwgZml0IG9uIGhlaWdodCBhbmQgd2lkdGggb2YgdGhlIGl0ZW1zIHdpbGwgYmUgdGhlIHNhbWUgYXMgdGhlIGhlaWdodFxuICAvLyAnZml4ZWQnIHdpbGwgc2V0IHRoZSByb3dzIGFuZCBjb2x1bW5zIGRpbWVuc2lvbnMgYmFzZWQgb24gZml4ZWRDb2xXaWR0aCBhbmQgZml4ZWRSb3dIZWlnaHQgb3B0aW9uc1xuICAvLyAndmVydGljYWxGaXhlZCcgd2lsbCBzZXQgdGhlIHJvd3MgdG8gZml4ZWRSb3dIZWlnaHQgYW5kIGNvbHVtbnMgd2lkdGggd2lsbCBmaXQgdGhlIHNwYWNlIGF2YWlsYWJsZVxuICAvLyAnaG9yaXpvbnRhbEZpeGVkJyB3aWxsIHNldCB0aGUgY29sdW1ucyB0byBmaXhlZENvbFdpZHRoIGFuZCByb3dzIGhlaWdodCB3aWxsIGZpdCB0aGUgc3BhY2UgYXZhaWxhYmxlXG4gIGZpeGVkQ29sV2lkdGg6IDI1MCwgLy8gZml4ZWQgY29sIHdpZHRoIGZvciBncmlkVHlwZTogJ2ZpeGVkJ1xuICBmaXhlZFJvd0hlaWdodDogMjUwLCAvLyBmaXhlZCByb3cgaGVpZ2h0IGZvciBncmlkVHlwZTogJ2ZpeGVkJ1xuICBrZWVwRml4ZWRIZWlnaHRJbk1vYmlsZTogZmFsc2UsIC8vIGtlZXAgdGhlIGhlaWdodCBmcm9tIGZpeGVkIGdyaWRUeXBlIGluIG1vYmlsZSBsYXlvdXRcbiAga2VlcEZpeGVkV2lkdGhJbk1vYmlsZTogZmFsc2UsIC8vIGtlZXAgdGhlIHdpZHRoIGZyb20gZml4ZWQgZ3JpZFR5cGUgaW4gbW9iaWxlIGxheW91dFxuICBzZXRHcmlkU2l6ZTogZmFsc2UsIC8vIHNldHMgZ3JpZCBzaXplIGRlcGVuZGluZyBvbiBjb250ZW50XG4gIGNvbXBhY3RUeXBlOiBDb21wYWN0VHlwZS5Ob25lLCAvLyBjb21wYWN0IGl0ZW1zOiAnbm9uZScgfCAnY29tcGFjdFVwJyB8ICdjb21wYWN0TGVmdCcgfCAnY29tcGFjdFVwJkxlZnQnIHwgJ2NvbXBhY3RMZWZ0JlVwJ1xuICBtb2JpbGVCcmVha3BvaW50OiA2NDAsIC8vIGlmIHRoZSBzY3JlZW4gaXMgbm90IHdpZGVyIHRoYXQgdGhpcywgcmVtb3ZlIHRoZSBncmlkIGxheW91dCBhbmQgc3RhY2sgdGhlIGl0ZW1zXG4gIHVzZUJvZHlGb3JCcmVha3BvaW50OiBmYWxzZSwgLy8gd2hldGhlciB0byB1c2UgdGhlIGJvZHkgd2lkdGggdG8gZGV0ZXJtaW5lIHRoZSBtb2JpbGUgYnJlYWtwb2ludC4gVXNlcyB0aGUgZWxlbWVudCB3aWR0aCB3aGVuIGZhbHNlLlxuICBhbGxvd011bHRpTGF5ZXI6IGZhbHNlLFxuICBkZWZhdWx0TGF5ZXJJbmRleDogMCxcbiAgbWF4TGF5ZXJJbmRleDogMixcbiAgYmFzZUxheWVySW5kZXg6IDEsXG4gIG1pbkNvbHM6IDEsIC8vIG1pbmltdW0gYW1vdW50IG9mIGNvbHVtbnMgaW4gdGhlIGdyaWRcbiAgbWF4Q29sczogMTAwLCAvLyBtYXhpbXVtIGFtb3VudCBvZiBjb2x1bW5zIGluIHRoZSBncmlkXG4gIG1pblJvd3M6IDEsIC8vIG1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIGdyaWRcbiAgbWF4Um93czogMTAwLCAvLyBtYXhpbXVtIGFtb3VudCBvZiByb3dzIGluIHRoZSBncmlkXG4gIGRlZmF1bHRJdGVtQ29sczogMSwgLy8gZGVmYXVsdCB3aWR0aCBvZiBhbiBpdGVtIGluIGNvbHVtbnNcbiAgZGVmYXVsdEl0ZW1Sb3dzOiAxLCAvLyBkZWZhdWx0IGhlaWdodCBvZiBhbiBpdGVtIGluIHJvd3NcbiAgbWF4SXRlbUNvbHM6IDUwLCAvLyBtYXggaXRlbSBudW1iZXIgb2YgY29sc1xuICBtYXhJdGVtUm93czogNTAsIC8vIG1heCBpdGVtIG51bWJlciBvZiByb3dzXG4gIG1pbkl0ZW1Db2xzOiAxLCAvLyBtaW4gaXRlbSBudW1iZXIgb2YgY29sdW1uc1xuICBtaW5JdGVtUm93czogMSwgLy8gbWluIGl0ZW0gbnVtYmVyIG9mIHJvd3NcbiAgbWluSXRlbUFyZWE6IDEsIC8vIG1pbiBpdGVtIGFyZWE6IGNvbHMgKiByb3dzXG4gIG1heEl0ZW1BcmVhOiAyNTAwLCAvLyBtYXggaXRlbSBhcmVhOiBjb2xzICogcm93c1xuICBhZGRFbXB0eVJvd3NDb3VudDogMCwgLy8gYWRkIGEgbnVtYmVyIG9mIGV4dHJhIGVtcHR5IHJvd3MgYXQgdGhlIGVuZFxuICByb3dIZWlnaHRSYXRpbzogMSwgLy8gcm93IGhlaWdodCByYXRpbyBmcm9tIGNvbHVtbiB3aWR0aFxuICBtYXJnaW46IDEwLCAvLyBtYXJnaW4gYmV0d2VlbiBncmlkIGl0ZW1zXG4gIG91dGVyTWFyZ2luOiB0cnVlLCAvLyBpZiBtYXJnaW5zIHdpbGwgYXBwbHkgdG8gdGhlIHNpZGVzIG9mIHRoZSBjb250YWluZXJcbiAgb3V0ZXJNYXJnaW5Ub3A6IG51bGwsIC8vIG92ZXJyaWRlIG91dGVyIG1hcmdpbiBmb3IgZ3JpZFxuICBvdXRlck1hcmdpblJpZ2h0OiBudWxsLCAvLyBvdmVycmlkZSBvdXRlciBtYXJnaW4gZm9yIGdyaWRcbiAgb3V0ZXJNYXJnaW5Cb3R0b206IG51bGwsIC8vIG92ZXJyaWRlIG91dGVyIG1hcmdpbiBmb3IgZ3JpZFxuICBvdXRlck1hcmdpbkxlZnQ6IG51bGwsIC8vIG92ZXJyaWRlIG91dGVyIG1hcmdpbiBmb3IgZ3JpZFxuICB1c2VUcmFuc2Zvcm1Qb3NpdGlvbmluZzogdHJ1ZSwgLy8gdG9nZ2xlIGJldHdlZW4gdHJhbnNmb3JtIG9yIHRvcC9sZWZ0IHBvc2l0aW9uaW5nIG9mIGl0ZW1zXG4gIHNjcm9sbFNlbnNpdGl2aXR5OiAxMCwgLy8gbWFyZ2luIG9mIHRoZSBkYXNoYm9hcmQgd2hlcmUgdG8gc3RhcnQgc2Nyb2xsaW5nXG4gIHNjcm9sbFNwZWVkOiAyMCwgLy8gaG93IG11Y2ggdG8gc2Nyb2xsIGVhY2ggbW91c2UgbW92ZSB3aGVuIGluIHRoZSBzY3JvbGxTZW5zaXRpdml0eSB6b25lXG4gIGluaXRDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBjYWxsYmFjayB0byBjYWxsIGFmdGVyIGdyaWQgaGFzIGluaXRpYWxpemVkLiBBcmd1bWVudHM6IGdyaWRzdGVyQ29tcG9uZW50XG4gIGRlc3Ryb3lDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBjYWxsYmFjayB0byBjYWxsIGFmdGVyIGdyaWQgaGFzIGRlc3Ryb3llZC4gQXJndW1lbnRzOiBncmlkc3RlckNvbXBvbmVudFxuICBncmlkU2l6ZUNoYW5nZWRDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBjYWxsYmFjayB0byBjYWxsIGFmdGVyIGdyaWQgaGFzIGNoYW5nZWQgc2l6ZS4gQXJndW1lbnRzOiBncmlkc3RlckNvbXBvbmVudFxuICBpdGVtQ2hhbmdlQ2FsbGJhY2s6IHVuZGVmaW5lZCwgLy8gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBpdGVtIHdoZW4gaXMgY2hhbmdlcyB4LCB5LCByb3dzLCBjb2xzLlxuICAvLyBBcmd1bWVudHM6IGdyaWRzdGVySXRlbSwgZ3JpZHN0ZXJJdGVtQ29tcG9uZW50XG4gIGl0ZW1SZXNpemVDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBjYWxsYmFjayB0byBjYWxsIGZvciBlYWNoIGl0ZW0gd2hlbiB3aWR0aC9oZWlnaHQgY2hhbmdlcy5cbiAgLy8gQXJndW1lbnRzOiBncmlkc3Rlckl0ZW0sIGdyaWRzdGVySXRlbUNvbXBvbmVudFxuICBpdGVtSW5pdENhbGxiYWNrOiB1bmRlZmluZWQsIC8vIGNhbGxiYWNrIHRvIGNhbGwgZm9yIGVhY2ggaXRlbSB3aGVuIGlzIGluaXRpYWxpemVkLlxuICAvLyBBcmd1bWVudHM6IGdyaWRzdGVySXRlbSwgZ3JpZHN0ZXJJdGVtQ29tcG9uZW50XG4gIGl0ZW1SZW1vdmVkQ2FsbGJhY2s6IHVuZGVmaW5lZCwgLy8gY2FsbGJhY2sgdG8gY2FsbCBmb3IgZWFjaCBpdGVtIHdoZW4gaXMgaW5pdGlhbGl6ZWQuXG4gIC8vIEFyZ3VtZW50czogZ3JpZHN0ZXJJdGVtLCBncmlkc3Rlckl0ZW1Db21wb25lbnRcbiAgaXRlbVZhbGlkYXRlQ2FsbGJhY2s6IHVuZGVmaW5lZCwgLy8gY2FsbGJhY2sgdG8gY2FsbCB0byB2YWxpZGF0ZSBpdGVtIHBvc2l0aW9uL3NpemUuIFJldHVybiB0cnVlIGlmIHZhbGlkLlxuICAvLyBBcmd1bWVudHM6IGdyaWRzdGVySXRlbVxuICBlbmFibGVFbXB0eUNlbGxDbGljazogZmFsc2UsIC8vIGVuYWJsZSBlbXB0eSBjZWxsIGNsaWNrIGV2ZW50c1xuICBlbmFibGVFbXB0eUNlbGxDb250ZXh0TWVudTogZmFsc2UsIC8vIGVuYWJsZSBlbXB0eSBjZWxsIGNvbnRleHQgbWVudSAocmlnaHQgY2xpY2spIGV2ZW50c1xuICBlbmFibGVFbXB0eUNlbGxEcm9wOiBmYWxzZSwgLy8gZW5hYmxlIGVtcHR5IGNlbGwgZHJvcCBldmVudHNcbiAgZW5hYmxlRW1wdHlDZWxsRHJhZzogZmFsc2UsIC8vIGVuYWJsZSBlbXB0eSBjZWxsIGRyYWcgZXZlbnRzXG4gIGVuYWJsZU9jY3VwaWVkQ2VsbERyb3A6IGZhbHNlLCAvLyBlbmFibGUgb2NjdXBpZWQgY2VsbCBkcm9wIGV2ZW50c1xuICBlbXB0eUNlbGxDbGlja0NhbGxiYWNrOiB1bmRlZmluZWQsIC8vIGVtcHR5IGNlbGwgY2xpY2sgY2FsbGJhY2tcbiAgZW1wdHlDZWxsQ29udGV4dE1lbnVDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBlbXB0eSBjZWxsIGNvbnRleHQgbWVudSAocmlnaHQgY2xpY2spIGNhbGxiYWNrXG4gIGVtcHR5Q2VsbERyb3BDYWxsYmFjazogdW5kZWZpbmVkLCAvLyBlbXB0eSBjZWxsIGRyYWcgZHJvcCBjYWxsYmFjay4gSFRNTDUgRHJhZyAmIERyb3BcbiAgZW1wdHlDZWxsRHJhZ0NhbGxiYWNrOiB1bmRlZmluZWQsIC8vIGVtcHR5IGNlbGwgZHJhZyBhbmQgY3JlYXRlIGl0ZW0gbGlrZSBleGNlbCBjZWxsIHNlbGVjdGlvblxuICBlbXB0eUNlbGxEcmFnTWF4Q29sczogNTAsIC8vIGxpbWl0IGVtcHR5IGNlbGwgZHJhZyBtYXggY29sc1xuICBlbXB0eUNlbGxEcmFnTWF4Um93czogNTAsIC8vIGxpbWl0IGVtcHR5IGNlbGwgZHJhZyBtYXggcm93c1xuICAvLyBBcmd1bWVudHM6IGV2ZW50LCBncmlkc3Rlckl0ZW17eCwgeSwgcm93czogZGVmYXVsdEl0ZW1Sb3dzLCBjb2xzOiBkZWZhdWx0SXRlbUNvbHN9XG4gIGlnbm9yZU1hcmdpbkluUm93OiBmYWxzZSwgLy8gaWdub3JlIHRoZSBnYXAgYmV0d2VlbiByb3dzIGZvciBpdGVtcyB3aGljaCBzcGFuIG11bHRpcGxlIHJvd3MgKHNlZSAjMTYyLCAjMjI0KVxuICBkcmFnZ2FibGU6IHtcbiAgICBkZWxheVN0YXJ0OiAwLCAvLyBtaWxsaXNlY29uZHMgdG8gZGVsYXkgdGhlIHN0YXJ0IG9mIGRyYWcsIHVzZWZ1bCBmb3IgdG91Y2ggaW50ZXJhY3Rpb25cbiAgICBlbmFibGVkOiBmYWxzZSwgLy8gZW5hYmxlL2Rpc2FibGUgZHJhZ2dhYmxlIGl0ZW1zXG4gICAgaWdub3JlQ29udGVudENsYXNzOiAnZ3JpZHN0ZXItaXRlbS1jb250ZW50JywgLy8gZGVmYXVsdCBjb250ZW50IGNsYXNzIHRvIGlnbm9yZSB0aGUgZHJhZyBldmVudCBmcm9tXG4gICAgaWdub3JlQ29udGVudDogZmFsc2UsIC8vIGlmIHRydWUgZHJhZyB3aWxsIHN0YXJ0IG9ubHkgZnJvbSBlbGVtZW50cyBmcm9tIGBkcmFnSGFuZGxlQ2xhc3NgXG4gICAgZHJhZ0hhbmRsZUNsYXNzOiAnZHJhZy1oYW5kbGVyJywgLy8gZHJhZyBldmVudCBvbmx5IGZyb20gdGhpcyBjbGFzcy4gSWYgYGlnbm9yZUNvbnRlbnRgIGlzIHRydWUuXG4gICAgc3RvcDogdW5kZWZpbmVkLCAvLyBjYWxsYmFjayB3aGVuIGRyYWdnaW5nIGFuIGl0ZW0gc3RvcHMuICBBY2NlcHRzIFByb21pc2UgcmV0dXJuIHRvIGNhbmNlbC9hcHByb3ZlIGRyYWcuXG4gICAgc3RhcnQ6IHVuZGVmaW5lZCwgLy8gY2FsbGJhY2sgd2hlbiBkcmFnZ2luZyBhbiBpdGVtIHN0YXJ0cy5cbiAgICAvLyBBcmd1bWVudHM6IGl0ZW0sIGdyaWRzdGVySXRlbSwgZXZlbnRcbiAgICBkcm9wT3Zlckl0ZW1zOiBmYWxzZSwgLy8gZW5hYmxlIGRyb3AgaXRlbXMgb24gdG9wIG90aGVyIGl0ZW1cbiAgICBkcm9wT3Zlckl0ZW1zQ2FsbGJhY2s6IHVuZGVmaW5lZCAvLyBjYWxsYmFjayBvbiBkcm9wIG92ZXIgYW5vdGhlciBpdGVtXG4gICAgLy8gQXJndW1lbnRzOiBzb3VyY2UsIHRhcmdldCwgZ3JpZENvbXBvbmVudFxuICB9LFxuICByZXNpemFibGU6IHtcbiAgICBkZWxheVN0YXJ0OiAwLCAvLyBtaWxsaXNlY29uZHMgdG8gZGVsYXkgdGhlIHN0YXJ0IG9mIHJlc2l6ZSwgdXNlZnVsIGZvciB0b3VjaCBpbnRlcmFjdGlvblxuICAgIGVuYWJsZWQ6IGZhbHNlLCAvLyBlbmFibGUvZGlzYWJsZSByZXNpemFibGUgaXRlbXNcbiAgICBoYW5kbGVzOiB7XG4gICAgICBzOiB0cnVlLFxuICAgICAgZTogdHJ1ZSxcbiAgICAgIG46IHRydWUsXG4gICAgICB3OiB0cnVlLFxuICAgICAgc2U6IHRydWUsXG4gICAgICBuZTogdHJ1ZSxcbiAgICAgIHN3OiB0cnVlLFxuICAgICAgbnc6IHRydWVcbiAgICB9LCAvLyByZXNpemFibGUgZWRnZXMgb2YgYW4gaXRlbVxuICAgIHN0b3A6IHVuZGVmaW5lZCwgLy8gY2FsbGJhY2sgd2hlbiByZXNpemluZyBhbiBpdGVtIHN0b3BzLiBBY2NlcHRzIFByb21pc2UgcmV0dXJuIHRvIGNhbmNlbC9hcHByb3ZlIHJlc2l6ZS5cbiAgICBzdGFydDogdW5kZWZpbmVkIC8vIGNhbGxiYWNrIHdoZW4gcmVzaXppbmcgYW4gaXRlbSBzdGFydHMuXG4gICAgLy8gQXJndW1lbnRzOiBpdGVtLCBncmlkc3Rlckl0ZW0sIGV2ZW50XG4gIH0sXG4gIHN3YXA6IHRydWUsIC8vIGFsbG93IGl0ZW1zIHRvIHN3aXRjaCBwb3NpdGlvbiBpZiBkcm9wIG9uIHRvcCBvZiBhbm90aGVyXG4gIHN3YXBXaGlsZURyYWdnaW5nOiBmYWxzZSwgLy8gYWxsb3cgaXRlbXMgdG8gc3dpdGNoIHBvc2l0aW9uIHdoaWxlIGRyYWdnaW5nXG4gIHB1c2hJdGVtczogZmFsc2UsIC8vIHB1c2ggaXRlbXMgd2hlbiByZXNpemluZyBhbmQgZHJhZ2dpbmdcbiAgZGlzYWJsZVB1c2hPbkRyYWc6IGZhbHNlLCAvLyBkaXNhYmxlIHB1c2ggb24gZHJhZ1xuICBkaXNhYmxlUHVzaE9uUmVzaXplOiBmYWxzZSwgLy8gZGlzYWJsZSBwdXNoIG9uIHJlc2l6ZVxuICBwdXNoRGlyZWN0aW9uczogeyBub3J0aDogdHJ1ZSwgZWFzdDogdHJ1ZSwgc291dGg6IHRydWUsIHdlc3Q6IHRydWUgfSwgLy8gY29udHJvbCB0aGUgZGlyZWN0aW9ucyBpdGVtcyBhcmUgcHVzaGVkXG4gIHB1c2hSZXNpemVJdGVtczogZmFsc2UsIC8vIG9uIHJlc2l6ZSBvZiBpdGVtIHdpbGwgc2hyaW5rIGFkamFjZW50IGl0ZW1zXG4gIGRpc3BsYXlHcmlkOiBEaXNwbGF5R3JpZC5PbkRyYWdBbmRSZXNpemUsIC8vIGRpc3BsYXkgYmFja2dyb3VuZCBncmlkIG9mIHJvd3MgYW5kIGNvbHVtbnNcbiAgZGlzYWJsZVdpbmRvd1Jlc2l6ZTogZmFsc2UsIC8vIGRpc2FibGUgdGhlIHdpbmRvdyBvbiByZXNpemUgbGlzdGVuZXIuIFRoaXMgd2lsbCBzdG9wIGdyaWQgdG8gcmVjYWxjdWxhdGUgb24gd2luZG93IHJlc2l6ZS5cbiAgZGlzYWJsZVdhcm5pbmdzOiBmYWxzZSwgLy8gZGlzYWJsZSBjb25zb2xlIGxvZyB3YXJuaW5ncyBhYm91dCBtaXNwbGFjZW1lbnQgb2YgZ3JpZCBpdGVtc1xuICBzY3JvbGxUb05ld0l0ZW1zOiBmYWxzZSwgLy8gc2Nyb2xsIHRvIG5ldyBpdGVtcyBwbGFjZWQgaW4gYSBzY3JvbGxhYmxlIHZpZXdcbiAgZGlzYWJsZVNjcm9sbEhvcml6b250YWw6IGZhbHNlLCAvLyBkaXNhYmxlIGhvcml6b250YWwgc2Nyb2xsaW5nXG4gIGRpc2FibGVTY3JvbGxWZXJ0aWNhbDogZmFsc2UsIC8vIGRpc2FibGUgdmVydGljYWwgc2Nyb2xsaW5nXG4gIGVuYWJsZUJvdW5kYXJ5Q29udHJvbDogZmFsc2UsIC8vIGVuYWJsZSBib3VuZGFyeSBjb250cm9sIHdoaWxlIGRyYWdnaW5nIGl0ZW1zXG4gIGRpc2FibGVBdXRvUG9zaXRpb25PbkNvbmZsaWN0OiBmYWxzZSwgLy8gZGlzYWJsZSBhdXRvLXBvc2l0aW9uIG9mIGl0ZW1zIG9uIGNvbmZsaWN0IHN0YXRlLFxuICBkaXJUeXBlOiBEaXJUeXBlcy5MVFIgLy8gcGFnZSBkaXJlY3Rpb24sIHJ0bD1yaWdodCB0byBsZWZ0IGx0cj0gbGVmdCB0byByaWdodCwgaWYgeW91IHVzZSBydGwgbGFuZ3VhZ2Ugc2V0IGRpclR5cGUgdG8gcnRsXG59O1xuIl19