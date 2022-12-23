import { NgForOf, NgStyle, NgIf } from '@angular/common';
import * as i0 from '@angular/core';
import { Component, ViewEncapsulation, Input, EventEmitter, ElementRef, Renderer2, ChangeDetectorRef, NgZone, Inject, Output, HostBinding, NgModule } from '@angular/core';
import { Subject, debounceTime, takeUntil, switchMap, timer } from 'rxjs';

var GridType;
(function (GridType) {
    GridType["Fit"] = "fit";
    GridType["ScrollVertical"] = "scrollVertical";
    GridType["ScrollHorizontal"] = "scrollHorizontal";
    GridType["Fixed"] = "fixed";
    GridType["VerticalFixed"] = "verticalFixed";
    GridType["HorizontalFixed"] = "horizontalFixed";
})(GridType || (GridType = {}));
var DisplayGrid;
(function (DisplayGrid) {
    DisplayGrid["Always"] = "always";
    DisplayGrid["OnDragAndResize"] = "onDrag&Resize";
    DisplayGrid["None"] = "none";
})(DisplayGrid || (DisplayGrid = {}));
var CompactType;
(function (CompactType) {
    CompactType["None"] = "none";
    CompactType["CompactUp"] = "compactUp";
    CompactType["CompactLeft"] = "compactLeft";
    CompactType["CompactUpAndLeft"] = "compactUp&Left";
    CompactType["CompactLeftAndUp"] = "compactLeft&Up";
    CompactType["CompactRight"] = "compactRight";
    CompactType["CompactUpAndRight"] = "compactUp&Right";
    CompactType["CompactRightAndUp"] = "compactRight&Up";
    CompactType["CompactDown"] = "compactDown";
    CompactType["CompactDownAndLeft"] = "compactDown&Left";
    CompactType["CompactLeftAndDown"] = "compactLeft&Down";
    CompactType["CompactDownAndRight"] = "compactDown&Right";
    CompactType["CompactRightAndDown"] = "compactRight&Down";
})(CompactType || (CompactType = {}));
var DirTypes;
(function (DirTypes) {
    DirTypes["LTR"] = "ltr";
    DirTypes["RTL"] = "rtl";
})(DirTypes || (DirTypes = {}));

class GridsterCompact {
    constructor(gridster) {
        this.gridster = gridster;
    }
    destroy() {
        this.gridster = null;
    }
    checkCompact() {
        if (this.gridster.$options.compactType !== CompactType.None) {
            if (this.gridster.$options.compactType === CompactType.CompactUp) {
                this.checkCompactMovement('y', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeft) {
                this.checkCompactMovement('x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactUpAndLeft) {
                this.checkCompactMovement('y', -1);
                this.checkCompactMovement('x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeftAndUp) {
                this.checkCompactMovement('x', -1);
                this.checkCompactMovement('y', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactRight) {
                this.checkCompactMovement('x', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactUpAndRight) {
                this.checkCompactMovement('y', -1);
                this.checkCompactMovement('x', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactRightAndUp) {
                this.checkCompactMovement('x', 1);
                this.checkCompactMovement('y', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDown) {
                this.checkCompactMovement('y', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDownAndLeft) {
                this.checkCompactMovement('y', 1);
                this.checkCompactMovement('x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDownAndRight) {
                this.checkCompactMovement('y', 1);
                this.checkCompactMovement('x', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeftAndDown) {
                this.checkCompactMovement('x', -1);
                this.checkCompactMovement('y', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactRightAndDown) {
                this.checkCompactMovement('x', 1);
                this.checkCompactMovement('y', 1);
            }
        }
    }
    checkCompactItem(item) {
        if (this.gridster.$options.compactType !== CompactType.None) {
            if (this.gridster.$options.compactType === CompactType.CompactUp) {
                this.moveTillCollision(item, 'y', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeft) {
                this.moveTillCollision(item, 'x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactUpAndLeft) {
                this.moveTillCollision(item, 'y', -1);
                this.moveTillCollision(item, 'x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeftAndUp) {
                this.moveTillCollision(item, 'x', -1);
                this.moveTillCollision(item, 'y', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactUpAndRight) {
                this.moveTillCollision(item, 'y', -1);
                this.moveTillCollision(item, 'x', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDown) {
                this.moveTillCollision(item, 'y', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDownAndLeft) {
                this.moveTillCollision(item, 'y', 1);
                this.moveTillCollision(item, 'x', -1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactLeftAndDown) {
                this.moveTillCollision(item, 'x', -1);
                this.moveTillCollision(item, 'y', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactDownAndRight) {
                this.moveTillCollision(item, 'y', 1);
                this.moveTillCollision(item, 'x', 1);
            }
            else if (this.gridster.$options.compactType === CompactType.CompactRightAndDown) {
                this.moveTillCollision(item, 'x', 1);
                this.moveTillCollision(item, 'y', 1);
            }
        }
    }
    checkCompactMovement(direction, delta) {
        let widgetMoved = false;
        this.gridster.grid.forEach((widget) => {
            if (widget.$item.compactEnabled !== false) {
                const moved = this.moveTillCollision(widget.$item, direction, delta);
                if (moved) {
                    widgetMoved = true;
                    widget.item[direction] = widget.$item[direction];
                    widget.itemChanged();
                }
            }
        });
        if (widgetMoved) {
            this.checkCompact();
        }
    }
    moveTillCollision(item, direction, delta) {
        item[direction] += delta;
        if (this.gridster.checkCollision(item)) {
            item[direction] -= delta;
            return false;
        }
        else {
            this.moveTillCollision(item, direction, delta);
            return true;
        }
    }
}

const GridsterConfigService = {
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

class GridsterUtils {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static merge(obj1, obj2, properties) {
        for (const p in obj2) {
            if (obj2[p] !== void 0 && properties.hasOwnProperty(p)) {
                if (typeof obj2[p] === 'object') {
                    // create an empty object for the property if obj1 does not already have one.
                    if (!(p in obj1)) {
                        obj1[p] = {};
                    }
                    obj1[p] = GridsterUtils.merge(obj1[p], obj2[p], properties[p]);
                }
                else {
                    obj1[p] = obj2[p];
                }
            }
        }
        return obj1;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static checkTouchEvent(e) {
        if (e.clientX === undefined && e.touches) {
            if (e.touches && e.touches.length) {
                e.clientX = e.touches[0].clientX;
                e.clientY = e.touches[0].clientY;
            }
            else if (e.changedTouches && e.changedTouches.length) {
                e.clientX = e.changedTouches[0].clientX;
                e.clientY = e.changedTouches[0].clientY;
            }
        }
    }
    static checkContentClassForEvent(gridster, e) {
        if (gridster.$options.draggable.ignoreContent) {
            if (!GridsterUtils.checkDragHandleClass(e.target, e.currentTarget, gridster.$options.draggable.dragHandleClass, gridster.$options.draggable.ignoreContentClass)) {
                return true;
            }
        }
        else {
            if (GridsterUtils.checkContentClass(e.target, e.currentTarget, gridster.$options.draggable.ignoreContentClass)) {
                return true;
            }
        }
        return false;
    }
    static checkContentClassForEmptyCellClickEvent(gridster, e) {
        return (GridsterUtils.checkContentClass(e.target, e.currentTarget, gridster.$options.draggable.ignoreContentClass) ||
            GridsterUtils.checkContentClass(e.target, e.currentTarget, gridster.$options.draggable.dragHandleClass));
    }
    static checkDragHandleClass(target, current, dragHandleClass, ignoreContentClass) {
        if (!target || target === current) {
            return false;
        }
        if (target.hasAttribute('class')) {
            const classnames = target.getAttribute('class').split(' ');
            if (classnames.indexOf(dragHandleClass) > -1) {
                return true;
            }
            if (classnames.indexOf(ignoreContentClass) > -1) {
                return false;
            }
        }
        return GridsterUtils.checkDragHandleClass(target.parentNode, current, dragHandleClass, ignoreContentClass);
    }
    static checkContentClass(target, current, contentClass) {
        if (!target || target === current) {
            return false;
        }
        if (target.hasAttribute('class') &&
            target.getAttribute('class').split(' ').indexOf(contentClass) > -1) {
            return true;
        }
        else {
            return GridsterUtils.checkContentClass(target.parentNode, current, contentClass);
        }
    }
    static compareItems(a, b) {
        if (a.y > b.y) {
            return -1;
        }
        else if (a.y < b.y) {
            return 1;
        }
        else if (a.x > b.x) {
            return -1;
        }
        else {
            return 1;
        }
    }
}

class GridsterEmptyCell {
    constructor(gridster) {
        this.gridster = gridster;
        this.emptyCellClickCb = (e) => {
            if (!this.gridster ||
                this.gridster.movingItem ||
                GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
                return;
            }
            const item = this.getValidItemFromEvent(e);
            if (!item) {
                return;
            }
            if (this.gridster.options.emptyCellClickCallback) {
                this.gridster.options.emptyCellClickCallback(e, item);
            }
            this.gridster.cdRef.markForCheck();
        };
        this.emptyCellContextMenuCb = (e) => {
            if (this.gridster.movingItem ||
                GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            const item = this.getValidItemFromEvent(e);
            if (!item) {
                return;
            }
            if (this.gridster.options.emptyCellContextMenuCallback) {
                this.gridster.options.emptyCellContextMenuCallback(e, item);
            }
            this.gridster.cdRef.markForCheck();
        };
        this.emptyCellDragDrop = (e) => {
            const item = this.getValidItemFromEvent(e);
            if (!item) {
                return;
            }
            if (this.gridster.options.emptyCellDropCallback) {
                this.gridster.options.emptyCellDropCallback(e, item);
            }
            this.gridster.cdRef.markForCheck();
        };
        this.emptyCellDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = this.getValidItemFromEvent(e);
            if (item) {
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'move';
                }
                this.gridster.movingItem = item;
            }
            else {
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'none';
                }
                this.gridster.movingItem = null;
            }
            this.gridster.previewStyle();
        };
        this.emptyCellMouseDown = (e) => {
            if (GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            const item = this.getValidItemFromEvent(e);
            const leftMouseButtonCode = 1;
            if (!item ||
                (e.buttons !== leftMouseButtonCode && !(e instanceof TouchEvent))) {
                return;
            }
            this.initialItem = item;
            this.gridster.movingItem = item;
            this.gridster.previewStyle();
            this.gridster.zone.runOutsideAngular(() => {
                this.removeWindowMousemoveListenerFn = this.gridster.renderer.listen('window', 'mousemove', this.emptyCellMouseMove);
                this.removeWindowTouchmoveListenerFn = this.gridster.renderer.listen('window', 'touchmove', this.emptyCellMouseMove);
            });
            this.removeWindowMouseupListenerFn = this.gridster.renderer.listen('window', 'mouseup', this.emptyCellMouseUp);
            this.removeWindowTouchendListenerFn = this.gridster.renderer.listen('window', 'touchend', this.emptyCellMouseUp);
        };
        this.emptyCellMouseMove = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = this.getValidItemFromEvent(e, this.initialItem);
            if (!item) {
                return;
            }
            this.gridster.movingItem = item;
            this.gridster.previewStyle();
        };
        this.emptyCellMouseUp = (e) => {
            this.removeWindowMousemoveListenerFn();
            this.removeWindowTouchmoveListenerFn();
            this.removeWindowMouseupListenerFn();
            this.removeWindowTouchendListenerFn();
            const item = this.getValidItemFromEvent(e, this.initialItem);
            if (item) {
                this.gridster.movingItem = item;
            }
            if (this.gridster.options.emptyCellDragCallback &&
                this.gridster.movingItem) {
                this.gridster.options.emptyCellDragCallback(e, this.gridster.movingItem);
            }
            setTimeout(() => {
                this.initialItem = null;
                if (this.gridster) {
                    this.gridster.movingItem = null;
                    this.gridster.previewStyle();
                }
            });
            this.gridster.cdRef.markForCheck();
        };
    }
    destroy() {
        if (this.gridster.previewStyle) {
            this.gridster.previewStyle();
        }
        this.gridster.movingItem = null;
        this.initialItem = this.gridster = null;
        if (this.removeDocumentDragendListenerFn) {
            this.removeDocumentDragendListenerFn();
            this.removeDocumentDragendListenerFn = null;
        }
    }
    updateOptions() {
        if (this.gridster.$options.enableEmptyCellClick &&
            !this.removeEmptyCellClickListenerFn &&
            this.gridster.options.emptyCellClickCallback) {
            this.removeEmptyCellClickListenerFn = this.gridster.renderer.listen(this.gridster.el, 'click', this.emptyCellClickCb);
            this.removeEmptyCellTouchendListenerFn = this.gridster.renderer.listen(this.gridster.el, 'touchend', this.emptyCellClickCb);
        }
        else if (!this.gridster.$options.enableEmptyCellClick &&
            this.removeEmptyCellClickListenerFn &&
            this.removeEmptyCellTouchendListenerFn) {
            this.removeEmptyCellClickListenerFn();
            this.removeEmptyCellTouchendListenerFn();
            this.removeEmptyCellClickListenerFn = null;
            this.removeEmptyCellTouchendListenerFn = null;
        }
        if (this.gridster.$options.enableEmptyCellContextMenu &&
            !this.removeEmptyCellContextMenuListenerFn &&
            this.gridster.options.emptyCellContextMenuCallback) {
            this.removeEmptyCellContextMenuListenerFn = this.gridster.renderer.listen(this.gridster.el, 'contextmenu', this.emptyCellContextMenuCb);
        }
        else if (!this.gridster.$options.enableEmptyCellContextMenu &&
            this.removeEmptyCellContextMenuListenerFn) {
            this.removeEmptyCellContextMenuListenerFn();
            this.removeEmptyCellContextMenuListenerFn = null;
        }
        if (this.gridster.$options.enableEmptyCellDrop &&
            !this.removeEmptyCellDropListenerFn &&
            this.gridster.options.emptyCellDropCallback) {
            this.removeEmptyCellDropListenerFn = this.gridster.renderer.listen(this.gridster.el, 'drop', this.emptyCellDragDrop);
            this.gridster.zone.runOutsideAngular(() => {
                this.removeEmptyCellDragoverListenerFn = this.gridster.renderer.listen(this.gridster.el, 'dragover', this.emptyCellDragOver);
            });
            this.removeDocumentDragendListenerFn = this.gridster.renderer.listen('document', 'dragend', () => {
                this.gridster.movingItem = null;
                this.gridster.previewStyle();
            });
        }
        else if (!this.gridster.$options.enableEmptyCellDrop &&
            this.removeEmptyCellDropListenerFn &&
            this.removeEmptyCellDragoverListenerFn &&
            this.removeDocumentDragendListenerFn) {
            this.removeEmptyCellDropListenerFn();
            this.removeEmptyCellDragoverListenerFn();
            this.removeDocumentDragendListenerFn();
            this.removeEmptyCellDragoverListenerFn = null;
            this.removeEmptyCellDropListenerFn = null;
            this.removeDocumentDragendListenerFn = null;
        }
        if (this.gridster.$options.enableEmptyCellDrag &&
            !this.removeEmptyCellMousedownListenerFn &&
            this.gridster.options.emptyCellDragCallback) {
            this.removeEmptyCellMousedownListenerFn = this.gridster.renderer.listen(this.gridster.el, 'mousedown', this.emptyCellMouseDown);
            this.removeEmptyCellTouchstartListenerFn = this.gridster.renderer.listen(this.gridster.el, 'touchstart', this.emptyCellMouseDown);
        }
        else if (!this.gridster.$options.enableEmptyCellDrag &&
            this.removeEmptyCellMousedownListenerFn &&
            this.removeEmptyCellTouchstartListenerFn) {
            this.removeEmptyCellMousedownListenerFn();
            this.removeEmptyCellTouchstartListenerFn();
            this.removeEmptyCellMousedownListenerFn = null;
            this.removeEmptyCellTouchstartListenerFn = null;
        }
    }
    getPixelsX(e, rect) {
        const scale = this.gridster.options.scale;
        if (scale) {
            return ((e.clientX - rect.left) / scale +
                this.gridster.el.scrollLeft -
                this.gridster.gridRenderer.getLeftMargin());
        }
        return (e.clientX +
            this.gridster.el.scrollLeft -
            rect.left -
            this.gridster.gridRenderer.getLeftMargin());
    }
    getPixelsY(e, rect) {
        const scale = this.gridster.options.scale;
        if (scale) {
            return ((e.clientY - rect.top) / scale +
                this.gridster.el.scrollTop -
                this.gridster.gridRenderer.getTopMargin());
        }
        return (e.clientY +
            this.gridster.el.scrollTop -
            rect.top -
            this.gridster.gridRenderer.getTopMargin());
    }
    getValidItemFromEvent(e, oldItem) {
        e.preventDefault();
        e.stopPropagation();
        GridsterUtils.checkTouchEvent(e);
        const rect = this.gridster.el.getBoundingClientRect();
        const x = this.getPixelsX(e, rect);
        const y = this.getPixelsY(e, rect);
        const item = {
            x: this.gridster.pixelsToPositionX(x, Math.floor, true),
            y: this.gridster.pixelsToPositionY(y, Math.floor, true),
            cols: this.gridster.$options.defaultItemCols,
            rows: this.gridster.$options.defaultItemRows
        };
        if (oldItem) {
            item.cols = Math.min(Math.abs(oldItem.x - item.x) + 1, this.gridster.$options.emptyCellDragMaxCols);
            item.rows = Math.min(Math.abs(oldItem.y - item.y) + 1, this.gridster.$options.emptyCellDragMaxRows);
            if (oldItem.x < item.x) {
                item.x = oldItem.x;
            }
            else if (oldItem.x - item.x >
                this.gridster.$options.emptyCellDragMaxCols - 1) {
                item.x = this.gridster.movingItem ? this.gridster.movingItem.x : 0;
            }
            if (oldItem.y < item.y) {
                item.y = oldItem.y;
            }
            else if (oldItem.y - item.y >
                this.gridster.$options.emptyCellDragMaxRows - 1) {
                item.y = this.gridster.movingItem ? this.gridster.movingItem.y : 0;
            }
        }
        if (!this.gridster.$options.enableOccupiedCellDrop &&
            this.gridster.checkCollision(item)) {
            return;
        }
        return item;
    }
}

class GridsterPreviewComponent {
    constructor(el, renderer) {
        this.renderer = renderer;
        this.el = el.nativeElement;
    }
    ngOnInit() {
        this.sub = this.previewStyle$.subscribe(options => this.previewStyle(options));
    }
    ngOnDestroy() {
        this.sub.unsubscribe();
    }
    previewStyle(item) {
        if (item) {
            this.renderer.setStyle(this.el, 'display', 'block');
            this.gridRenderer.updateItem(this.el, item, this.renderer);
        }
        else {
            this.renderer.setStyle(this.el, 'display', '');
        }
    }
}
GridsterPreviewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterPreviewComponent, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Component });
GridsterPreviewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterPreviewComponent, isStandalone: true, selector: "gridster-preview", inputs: { previewStyle$: "previewStyle$", gridRenderer: "gridRenderer" }, ngImport: i0, template: '', isInline: true, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterPreviewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-preview', template: '', encapsulation: ViewEncapsulation.None, standalone: true, styles: ["gridster-preview{position:absolute;display:none;background:rgba(0,0,0,.15)}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { previewStyle$: [{
                type: Input
            }], gridRenderer: [{
                type: Input
            }] } });

class GridsterRenderer {
    constructor(gridster) {
        this.gridster = gridster;
    }
    destroy() {
        this.gridster = null;
    }
    updateItem(el, item, renderer) {
        if (this.gridster.mobile) {
            this.clearCellPosition(renderer, el);
            if (this.gridster.$options.keepFixedHeightInMobile) {
                renderer.setStyle(el, 'height', (item.rows - 1) * this.gridster.$options.margin +
                    item.rows * this.gridster.$options.fixedRowHeight +
                    'px');
            }
            else {
                renderer.setStyle(el, 'height', (item.rows * this.gridster.curWidth) / item.cols + 'px');
            }
            if (this.gridster.$options.keepFixedWidthInMobile) {
                renderer.setStyle(el, 'width', this.gridster.$options.fixedColWidth + 'px');
            }
            else {
                renderer.setStyle(el, 'width', '');
            }
            renderer.setStyle(el, 'margin-bottom', this.gridster.$options.margin + 'px');
            renderer.setStyle(el, DirTypes.LTR ? 'margin-right' : 'margin-left', '');
        }
        else {
            const x = Math.round(this.gridster.curColWidth * item.x);
            const y = Math.round(this.gridster.curRowHeight * item.y);
            const width = this.gridster.curColWidth * item.cols - this.gridster.$options.margin;
            const height = this.gridster.curRowHeight * item.rows - this.gridster.$options.margin;
            // set the cell style
            this.setCellPosition(renderer, el, x, y);
            renderer.setStyle(el, 'width', width + 'px');
            renderer.setStyle(el, 'height', height + 'px');
            let marginBottom = null;
            let marginRight = null;
            if (this.gridster.$options.outerMargin) {
                if (this.gridster.rows === item.rows + item.y) {
                    if (this.gridster.$options.outerMarginBottom !== null) {
                        marginBottom = this.gridster.$options.outerMarginBottom + 'px';
                    }
                    else {
                        marginBottom = this.gridster.$options.margin + 'px';
                    }
                }
                if (this.gridster.columns === item.cols + item.x) {
                    if (this.gridster.$options.outerMarginBottom !== null) {
                        marginRight = this.gridster.$options.outerMarginRight + 'px';
                    }
                    else {
                        marginRight = this.gridster.$options.margin + 'px';
                    }
                }
            }
            renderer.setStyle(el, 'margin-bottom', marginBottom);
            renderer.setStyle(el, DirTypes.LTR ? 'margin-right' : 'margin-left', marginRight);
        }
    }
    updateGridster() {
        let addClass = '';
        let removeClass1 = '';
        let removeClass2 = '';
        let removeClass3 = '';
        if (this.gridster.$options.gridType === GridType.Fit) {
            addClass = GridType.Fit;
            removeClass1 = GridType.ScrollVertical;
            removeClass2 = GridType.ScrollHorizontal;
            removeClass3 = GridType.Fixed;
        }
        else if (this.gridster.$options.gridType === GridType.ScrollVertical) {
            this.gridster.curRowHeight =
                this.gridster.curColWidth * this.gridster.$options.rowHeightRatio;
            addClass = GridType.ScrollVertical;
            removeClass1 = GridType.Fit;
            removeClass2 = GridType.ScrollHorizontal;
            removeClass3 = GridType.Fixed;
        }
        else if (this.gridster.$options.gridType === GridType.ScrollHorizontal) {
            const widthRatio = this.gridster.$options.rowHeightRatio;
            const calWidthRatio = widthRatio >= 1 ? widthRatio : widthRatio + 1;
            this.gridster.curColWidth = this.gridster.curRowHeight * calWidthRatio;
            addClass = GridType.ScrollHorizontal;
            removeClass1 = GridType.Fit;
            removeClass2 = GridType.ScrollVertical;
            removeClass3 = GridType.Fixed;
        }
        else if (this.gridster.$options.gridType === GridType.Fixed) {
            this.gridster.curColWidth =
                this.gridster.$options.fixedColWidth +
                    (this.gridster.$options.ignoreMarginInRow
                        ? 0
                        : this.gridster.$options.margin);
            this.gridster.curRowHeight =
                this.gridster.$options.fixedRowHeight +
                    (this.gridster.$options.ignoreMarginInRow
                        ? 0
                        : this.gridster.$options.margin);
            addClass = GridType.Fixed;
            removeClass1 = GridType.Fit;
            removeClass2 = GridType.ScrollVertical;
            removeClass3 = GridType.ScrollHorizontal;
        }
        else if (this.gridster.$options.gridType === GridType.VerticalFixed) {
            this.gridster.curRowHeight =
                this.gridster.$options.fixedRowHeight +
                    (this.gridster.$options.ignoreMarginInRow
                        ? 0
                        : this.gridster.$options.margin);
            addClass = GridType.ScrollVertical;
            removeClass1 = GridType.Fit;
            removeClass2 = GridType.ScrollHorizontal;
            removeClass3 = GridType.Fixed;
        }
        else if (this.gridster.$options.gridType === GridType.HorizontalFixed) {
            this.gridster.curColWidth =
                this.gridster.$options.fixedColWidth +
                    (this.gridster.$options.ignoreMarginInRow
                        ? 0
                        : this.gridster.$options.margin);
            addClass = GridType.ScrollHorizontal;
            removeClass1 = GridType.Fit;
            removeClass2 = GridType.ScrollVertical;
            removeClass3 = GridType.Fixed;
        }
        if (this.gridster.mobile ||
            (this.gridster.$options.setGridSize &&
                this.gridster.$options.gridType !== GridType.Fit)) {
            this.gridster.renderer.removeClass(this.gridster.el, addClass);
        }
        else {
            this.gridster.renderer.addClass(this.gridster.el, addClass);
        }
        this.gridster.renderer.removeClass(this.gridster.el, removeClass1);
        this.gridster.renderer.removeClass(this.gridster.el, removeClass2);
        this.gridster.renderer.removeClass(this.gridster.el, removeClass3);
    }
    getGridColumnStyle(i) {
        return Object.assign(Object.assign({}, this.getLeftPosition(this.gridster.curColWidth * i)), { width: this.gridster.curColWidth - this.gridster.$options.margin + 'px', height: this.gridster.gridRows.length * this.gridster.curRowHeight -
                this.gridster.$options.margin +
                'px' });
    }
    getGridRowStyle(i) {
        return Object.assign(Object.assign({}, this.getTopPosition(this.gridster.curRowHeight * i)), { width: this.gridster.gridColumns.length * this.gridster.curColWidth -
                this.gridster.$options.margin +
                'px', height: this.gridster.curRowHeight - this.gridster.$options.margin + 'px' });
    }
    getLeftPosition(d) {
        const dPosition = this.gridster.$options.dirType === DirTypes.RTL ? -d : d;
        if (this.gridster.$options.useTransformPositioning) {
            return {
                transform: 'translateX(' + dPosition + 'px)'
            };
        }
        else {
            return {
                left: this.getLeftMargin() + dPosition + 'px'
            };
        }
    }
    getTopPosition(d) {
        if (this.gridster.$options.useTransformPositioning) {
            return {
                transform: 'translateY(' + d + 'px)'
            };
        }
        else {
            return {
                top: this.getTopMargin() + d + 'px'
            };
        }
    }
    clearCellPosition(renderer, el) {
        if (this.gridster.$options.useTransformPositioning) {
            renderer.setStyle(el, 'transform', '');
        }
        else {
            renderer.setStyle(el, 'top', '');
            renderer.setStyle(el, 'left', '');
        }
    }
    setCellPosition(renderer, el, x, y) {
        const xPosition = this.gridster.$options.dirType === DirTypes.RTL ? -x : x;
        if (this.gridster.$options.useTransformPositioning) {
            const transform = 'translate3d(' + xPosition + 'px, ' + y + 'px, 0)';
            renderer.setStyle(el, 'transform', transform);
        }
        else {
            renderer.setStyle(el, 'left', this.getLeftMargin() + xPosition + 'px');
            renderer.setStyle(el, 'top', this.getTopMargin() + y + 'px');
        }
    }
    getLeftMargin() {
        if (this.gridster.$options.outerMargin) {
            if (this.gridster.$options.outerMarginLeft !== null) {
                return this.gridster.$options.outerMarginLeft;
            }
            else {
                return this.gridster.$options.margin;
            }
        }
        else {
            return 0;
        }
    }
    getTopMargin() {
        if (this.gridster.$options.outerMargin) {
            if (this.gridster.$options.outerMarginTop !== null) {
                return this.gridster.$options.outerMarginTop;
            }
            else {
                return this.gridster.$options.margin;
            }
        }
        else {
            return 0;
        }
    }
}

class GridsterComponent {
    constructor(el, renderer, cdRef, zone) {
        this.renderer = renderer;
        this.cdRef = cdRef;
        this.zone = zone;
        this.columns = 0;
        this.rows = 0;
        this.gridColumns = [];
        this.gridRows = [];
        this.previewStyle$ = new EventEmitter();
        this.calculateLayout$ = new Subject();
        this.resize$ = new Subject();
        this.destroy$ = new Subject();
        this.optionsChanged = () => {
            this.setOptions();
            let widgetsIndex = this.grid.length - 1;
            let widget;
            for (; widgetsIndex >= 0; widgetsIndex--) {
                widget = this.grid[widgetsIndex];
                widget.updateOptions();
            }
            this.calculateLayout();
        };
        this.onResize = () => {
            if (this.el.clientWidth) {
                if (this.options.setGridSize) {
                    // reset width/height so the size is recalculated afterwards
                    this.renderer.setStyle(this.el, 'width', '');
                    this.renderer.setStyle(this.el, 'height', '');
                }
                this.setGridSize();
                this.calculateLayout();
            }
        };
        this.getNextPossiblePosition = (newItem, startingFrom = {}) => {
            if (newItem.cols === -1) {
                newItem.cols = this.$options.defaultItemCols;
            }
            if (newItem.rows === -1) {
                newItem.rows = this.$options.defaultItemRows;
            }
            this.setGridDimensions();
            let rowsIndex = startingFrom.y || 0;
            let colsIndex;
            for (; rowsIndex < this.rows; rowsIndex++) {
                newItem.y = rowsIndex;
                colsIndex = startingFrom.x || 0;
                for (; colsIndex < this.columns; colsIndex++) {
                    newItem.x = colsIndex;
                    if (!this.checkCollision(newItem)) {
                        return true;
                    }
                }
            }
            const canAddToRows = this.$options.maxRows >= this.rows + newItem.rows;
            const canAddToColumns = this.$options.maxCols >= this.columns + newItem.cols;
            const addToRows = this.rows <= this.columns && canAddToRows;
            if (!addToRows && canAddToColumns) {
                newItem.x = this.columns;
                newItem.y = 0;
                return true;
            }
            else if (canAddToRows) {
                newItem.y = this.rows;
                newItem.x = 0;
                return true;
            }
            return false;
        };
        this.getFirstPossiblePosition = (item) => {
            const tmpItem = Object.assign({}, item);
            this.getNextPossiblePosition(tmpItem);
            return tmpItem;
        };
        this.getLastPossiblePosition = (item) => {
            let farthestItem = { y: 0, x: 0 };
            farthestItem = this.grid.reduce((prev, curr) => {
                const currCoords = {
                    y: curr.$item.y + curr.$item.rows - 1,
                    x: curr.$item.x + curr.$item.cols - 1
                };
                if (GridsterUtils.compareItems(prev, currCoords) === 1) {
                    return currCoords;
                }
                else {
                    return prev;
                }
            }, farthestItem);
            const tmpItem = Object.assign({}, item);
            this.getNextPossiblePosition(tmpItem, farthestItem);
            return tmpItem;
        };
        this.el = el.nativeElement;
        this.$options = JSON.parse(JSON.stringify(GridsterConfigService));
        this.mobile = false;
        this.curWidth = 0;
        this.curHeight = 0;
        this.grid = [];
        this.curColWidth = 0;
        this.curRowHeight = 0;
        this.dragInProgress = false;
        this.emptyCell = new GridsterEmptyCell(this);
        this.compact = new GridsterCompact(this);
        this.gridRenderer = new GridsterRenderer(this);
    }
    // ------ Function for swapWhileDragging option
    // identical to checkCollision() except that here we add boundaries.
    static checkCollisionTwoItemsForSwaping(item, item2) {
        // if the cols or rows of the items are 1 , doesnt make any sense to set a boundary. Only if the item is bigger we set a boundary
        const horizontalBoundaryItem1 = item.cols === 1 ? 0 : 1;
        const horizontalBoundaryItem2 = item2.cols === 1 ? 0 : 1;
        const verticalBoundaryItem1 = item.rows === 1 ? 0 : 1;
        const verticalBoundaryItem2 = item2.rows === 1 ? 0 : 1;
        return (item.x + horizontalBoundaryItem1 < item2.x + item2.cols &&
            item.x + item.cols > item2.x + horizontalBoundaryItem2 &&
            item.y + verticalBoundaryItem1 < item2.y + item2.rows &&
            item.y + item.rows > item2.y + verticalBoundaryItem2);
    }
    checkCollisionTwoItems(item, item2) {
        const collision = item.x < item2.x + item2.cols &&
            item.x + item.cols > item2.x &&
            item.y < item2.y + item2.rows &&
            item.y + item.rows > item2.y;
        if (!collision) {
            return false;
        }
        if (!this.$options.allowMultiLayer) {
            return true;
        }
        const defaultLayerIndex = this.$options.defaultLayerIndex;
        const layerIndex = item.layerIndex === undefined ? defaultLayerIndex : item.layerIndex;
        const layerIndex2 = item2.layerIndex === undefined ? defaultLayerIndex : item2.layerIndex;
        return layerIndex === layerIndex2;
    }
    ngOnInit() {
        if (this.options.initCallback) {
            this.options.initCallback(this);
        }
        this.calculateLayout$
            .pipe(debounceTime(0), takeUntil(this.destroy$))
            .subscribe(() => this.calculateLayout());
        this.resize$
            .pipe(
        // Cancel previously scheduled DOM timer if `calculateLayout()` has been called
        // within this time range.
        switchMap(() => timer(100)), takeUntil(this.destroy$))
            .subscribe(() => this.resize());
    }
    ngOnChanges(changes) {
        if (changes.options) {
            this.setOptions();
            this.options.api = {
                optionsChanged: this.optionsChanged,
                resize: this.onResize,
                getNextPossiblePosition: this.getNextPossiblePosition,
                getFirstPossiblePosition: this.getFirstPossiblePosition,
                getLastPossiblePosition: this.getLastPossiblePosition,
                getItemComponent: (item) => this.getItemComponent(item)
            };
            this.columns = this.$options.minCols;
            this.rows = this.$options.minRows + this.$options.addEmptyRowsCount;
            this.setGridSize();
            this.calculateLayout();
        }
    }
    resize() {
        let height;
        let width;
        if (this.$options.gridType === 'fit' && !this.mobile) {
            width = this.el.offsetWidth;
            height = this.el.offsetHeight;
        }
        else {
            width = this.el.clientWidth;
            height = this.el.clientHeight;
        }
        if ((width !== this.curWidth || height !== this.curHeight) &&
            this.checkIfToResize()) {
            this.onResize();
        }
    }
    setOptions() {
        this.$options = GridsterUtils.merge(this.$options, this.options, this.$options);
        if (!this.$options.disableWindowResize && !this.windowResize) {
            this.windowResize = this.renderer.listen('window', 'resize', this.onResize);
        }
        else if (this.$options.disableWindowResize && this.windowResize) {
            this.windowResize();
            this.windowResize = null;
        }
        this.emptyCell.updateOptions();
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.previewStyle$.complete();
        if (this.windowResize) {
            this.windowResize();
        }
        if (this.options && this.options.destroyCallback) {
            this.options.destroyCallback(this);
        }
        if (this.options && this.options.api) {
            this.options.api.resize = undefined;
            this.options.api.optionsChanged = undefined;
            this.options.api.getNextPossiblePosition = undefined;
            this.options.api = undefined;
        }
        this.emptyCell.destroy();
        this.emptyCell = null;
        this.compact.destroy();
        this.compact = null;
    }
    checkIfToResize() {
        const clientWidth = this.el.clientWidth;
        const offsetWidth = this.el.offsetWidth;
        const scrollWidth = this.el.scrollWidth;
        const clientHeight = this.el.clientHeight;
        const offsetHeight = this.el.offsetHeight;
        const scrollHeight = this.el.scrollHeight;
        const verticalScrollPresent = clientWidth < offsetWidth &&
            scrollHeight > offsetHeight &&
            scrollHeight - offsetHeight < offsetWidth - clientWidth;
        const horizontalScrollPresent = clientHeight < offsetHeight &&
            scrollWidth > offsetWidth &&
            scrollWidth - offsetWidth < offsetHeight - clientHeight;
        if (verticalScrollPresent) {
            return false;
        }
        return !horizontalScrollPresent;
    }
    checkIfMobile() {
        if (this.$options.useBodyForBreakpoint) {
            return this.$options.mobileBreakpoint > document.body.clientWidth;
        }
        else {
            return this.$options.mobileBreakpoint > this.curWidth;
        }
    }
    setGridSize() {
        const el = this.el;
        let width;
        let height;
        if (this.$options.setGridSize ||
            (this.$options.gridType === GridType.Fit && !this.mobile)) {
            width = el.offsetWidth;
            height = el.offsetHeight;
        }
        else {
            width = el.clientWidth;
            height = el.clientHeight;
        }
        this.curWidth = width;
        this.curHeight = height;
    }
    setGridDimensions() {
        this.setGridSize();
        if (!this.mobile && this.checkIfMobile()) {
            this.mobile = !this.mobile;
            this.renderer.addClass(this.el, 'mobile');
        }
        else if (this.mobile && !this.checkIfMobile()) {
            this.mobile = !this.mobile;
            this.renderer.removeClass(this.el, 'mobile');
        }
        let rows = this.$options.minRows;
        let columns = this.$options.minCols;
        let widgetsIndex = this.grid.length - 1;
        let widget;
        for (; widgetsIndex >= 0; widgetsIndex--) {
            widget = this.grid[widgetsIndex];
            if (!widget.notPlaced) {
                rows = Math.max(rows, widget.$item.y + widget.$item.rows);
                columns = Math.max(columns, widget.$item.x + widget.$item.cols);
            }
        }
        rows += this.$options.addEmptyRowsCount;
        if (this.columns !== columns || this.rows !== rows) {
            this.columns = columns;
            this.rows = rows;
            if (this.options.gridSizeChangedCallback) {
                this.options.gridSizeChangedCallback(this);
            }
        }
    }
    calculateLayout() {
        if (this.compact) {
            this.compact.checkCompact();
        }
        this.setGridDimensions();
        if (this.$options.outerMargin) {
            let marginWidth = -this.$options.margin;
            if (this.$options.outerMarginLeft !== null) {
                marginWidth += this.$options.outerMarginLeft;
                this.renderer.setStyle(this.el, 'padding-left', this.$options.outerMarginLeft + 'px');
            }
            else {
                marginWidth += this.$options.margin;
                this.renderer.setStyle(this.el, 'padding-left', this.$options.margin + 'px');
            }
            if (this.$options.outerMarginRight !== null) {
                marginWidth += this.$options.outerMarginRight;
                this.renderer.setStyle(this.el, 'padding-right', this.$options.outerMarginRight + 'px');
            }
            else {
                marginWidth += this.$options.margin;
                this.renderer.setStyle(this.el, 'padding-right', this.$options.margin + 'px');
            }
            this.curColWidth = (this.curWidth - marginWidth) / this.columns;
            let marginHeight = -this.$options.margin;
            if (this.$options.outerMarginTop !== null) {
                marginHeight += this.$options.outerMarginTop;
                this.renderer.setStyle(this.el, 'padding-top', this.$options.outerMarginTop + 'px');
            }
            else {
                marginHeight += this.$options.margin;
                this.renderer.setStyle(this.el, 'padding-top', this.$options.margin + 'px');
            }
            if (this.$options.outerMarginBottom !== null) {
                marginHeight += this.$options.outerMarginBottom;
                this.renderer.setStyle(this.el, 'padding-bottom', this.$options.outerMarginBottom + 'px');
            }
            else {
                marginHeight += this.$options.margin;
                this.renderer.setStyle(this.el, 'padding-bottom', this.$options.margin + 'px');
            }
            this.curRowHeight =
                ((this.curHeight - marginHeight) / this.rows) *
                    this.$options.rowHeightRatio;
        }
        else {
            this.curColWidth = (this.curWidth + this.$options.margin) / this.columns;
            this.curRowHeight =
                ((this.curHeight + this.$options.margin) / this.rows) *
                    this.$options.rowHeightRatio;
            this.renderer.setStyle(this.el, 'padding-left', 0 + 'px');
            this.renderer.setStyle(this.el, 'padding-right', 0 + 'px');
            this.renderer.setStyle(this.el, 'padding-top', 0 + 'px');
            this.renderer.setStyle(this.el, 'padding-bottom', 0 + 'px');
        }
        this.gridRenderer.updateGridster();
        if (this.$options.setGridSize) {
            this.renderer.addClass(this.el, 'gridSize');
            if (!this.mobile) {
                this.renderer.setStyle(this.el, 'width', this.columns * this.curColWidth + this.$options.margin + 'px');
                this.renderer.setStyle(this.el, 'height', this.rows * this.curRowHeight + this.$options.margin + 'px');
            }
        }
        else {
            this.renderer.removeClass(this.el, 'gridSize');
            this.renderer.setStyle(this.el, 'width', '');
            this.renderer.setStyle(this.el, 'height', '');
        }
        this.updateGrid();
        let widgetsIndex = this.grid.length - 1;
        let widget;
        for (; widgetsIndex >= 0; widgetsIndex--) {
            widget = this.grid[widgetsIndex];
            widget.setSize();
            widget.drag.toggle();
            widget.resize.toggle();
        }
        this.resize$.next();
    }
    updateGrid() {
        if (this.$options.displayGrid === 'always' && !this.mobile) {
            this.renderer.addClass(this.el, 'display-grid');
        }
        else if (this.$options.displayGrid === 'onDrag&Resize' &&
            this.dragInProgress) {
            this.renderer.addClass(this.el, 'display-grid');
        }
        else if (this.$options.displayGrid === 'none' ||
            !this.dragInProgress ||
            this.mobile) {
            this.renderer.removeClass(this.el, 'display-grid');
        }
        this.setGridDimensions();
        this.gridColumns.length = GridsterComponent.getNewArrayLength(this.columns, this.curWidth, this.curColWidth);
        this.gridRows.length = GridsterComponent.getNewArrayLength(this.rows, this.curHeight, this.curRowHeight);
        this.cdRef.markForCheck();
    }
    addItem(itemComponent) {
        if (itemComponent.$item.cols === undefined) {
            itemComponent.$item.cols = this.$options.defaultItemCols;
            itemComponent.item.cols = itemComponent.$item.cols;
            itemComponent.itemChanged();
        }
        if (itemComponent.$item.rows === undefined) {
            itemComponent.$item.rows = this.$options.defaultItemRows;
            itemComponent.item.rows = itemComponent.$item.rows;
            itemComponent.itemChanged();
        }
        if (itemComponent.$item.x === -1 || itemComponent.$item.y === -1) {
            this.autoPositionItem(itemComponent);
        }
        else if (this.checkCollision(itemComponent.$item)) {
            if (!this.$options.disableWarnings) {
                itemComponent.notPlaced = true;
                console.warn("Can't be placed in the bounds of the dashboard, trying to auto position!/n" +
                    JSON.stringify(itemComponent.item, ['cols', 'rows', 'x', 'y']));
            }
            if (!this.$options.disableAutoPositionOnConflict) {
                this.autoPositionItem(itemComponent);
            }
            else {
                itemComponent.notPlaced = true;
            }
        }
        this.grid.push(itemComponent);
        this.calculateLayout$.next();
    }
    removeItem(itemComponent) {
        this.grid.splice(this.grid.indexOf(itemComponent), 1);
        this.calculateLayout$.next();
        if (this.options.itemRemovedCallback) {
            this.options.itemRemovedCallback(itemComponent.item, itemComponent);
        }
    }
    checkCollision(item) {
        let collision = false;
        if (this.options.itemValidateCallback) {
            collision = !this.options.itemValidateCallback(item);
        }
        if (!collision && this.checkGridCollision(item)) {
            collision = true;
        }
        if (!collision) {
            const c = this.findItemWithItem(item);
            if (c) {
                collision = c;
            }
        }
        return collision;
    }
    checkGridCollision(item) {
        const noNegativePosition = item.y > -1 && item.x > -1;
        const maxGridCols = item.cols + item.x <= this.$options.maxCols;
        const maxGridRows = item.rows + item.y <= this.$options.maxRows;
        const maxItemCols = item.maxItemCols === undefined
            ? this.$options.maxItemCols
            : item.maxItemCols;
        const minItemCols = item.minItemCols === undefined
            ? this.$options.minItemCols
            : item.minItemCols;
        const maxItemRows = item.maxItemRows === undefined
            ? this.$options.maxItemRows
            : item.maxItemRows;
        const minItemRows = item.minItemRows === undefined
            ? this.$options.minItemRows
            : item.minItemRows;
        const inColsLimits = item.cols <= maxItemCols && item.cols >= minItemCols;
        const inRowsLimits = item.rows <= maxItemRows && item.rows >= minItemRows;
        const minAreaLimit = item.minItemArea === undefined
            ? this.$options.minItemArea
            : item.minItemArea;
        const maxAreaLimit = item.maxItemArea === undefined
            ? this.$options.maxItemArea
            : item.maxItemArea;
        const area = item.cols * item.rows;
        const inMinArea = minAreaLimit <= area;
        const inMaxArea = maxAreaLimit >= area;
        return !(noNegativePosition &&
            maxGridCols &&
            maxGridRows &&
            inColsLimits &&
            inRowsLimits &&
            inMinArea &&
            inMaxArea);
    }
    findItemWithItem(item) {
        let widgetsIndex = 0;
        let widget;
        for (; widgetsIndex < this.grid.length; widgetsIndex++) {
            widget = this.grid[widgetsIndex];
            if (widget.$item !== item &&
                this.checkCollisionTwoItems(widget.$item, item)) {
                return widget;
            }
        }
        return false;
    }
    findItemsWithItem(item) {
        const a = [];
        let widgetsIndex = 0;
        let widget;
        for (; widgetsIndex < this.grid.length; widgetsIndex++) {
            widget = this.grid[widgetsIndex];
            if (widget.$item !== item &&
                this.checkCollisionTwoItems(widget.$item, item)) {
                a.push(widget);
            }
        }
        return a;
    }
    autoPositionItem(itemComponent) {
        if (this.getNextPossiblePosition(itemComponent.$item)) {
            itemComponent.notPlaced = false;
            itemComponent.item.x = itemComponent.$item.x;
            itemComponent.item.y = itemComponent.$item.y;
            itemComponent.itemChanged();
        }
        else {
            itemComponent.notPlaced = true;
            if (!this.$options.disableWarnings) {
                console.warn("Can't be placed in the bounds of the dashboard!/n" +
                    JSON.stringify(itemComponent.item, ['cols', 'rows', 'x', 'y']));
            }
        }
    }
    pixelsToPositionX(x, roundingMethod, noLimit) {
        const position = roundingMethod(x / this.curColWidth);
        if (noLimit) {
            return position;
        }
        else {
            return Math.max(position, 0);
        }
    }
    pixelsToPositionY(y, roundingMethod, noLimit) {
        const position = roundingMethod(y / this.curRowHeight);
        if (noLimit) {
            return position;
        }
        else {
            return Math.max(position, 0);
        }
    }
    positionXToPixels(x) {
        return x * this.curColWidth;
    }
    positionYToPixels(y) {
        return y * this.curRowHeight;
    }
    getItemComponent(item) {
        return this.grid.find(c => c.item === item);
    }
    // ------ Functions for swapWhileDragging option
    // identical to checkCollision() except that this function calls findItemWithItemForSwaping() instead of findItemWithItem()
    checkCollisionForSwaping(item) {
        let collision = false;
        if (this.options.itemValidateCallback) {
            collision = !this.options.itemValidateCallback(item);
        }
        if (!collision && this.checkGridCollision(item)) {
            collision = true;
        }
        if (!collision) {
            const c = this.findItemWithItemForSwapping(item);
            if (c) {
                collision = c;
            }
        }
        return collision;
    }
    // identical to findItemWithItem() except that this function calls checkCollisionTwoItemsForSwaping() instead of checkCollisionTwoItems()
    findItemWithItemForSwapping(item) {
        let widgetsIndex = this.grid.length - 1;
        let widget;
        for (; widgetsIndex > -1; widgetsIndex--) {
            widget = this.grid[widgetsIndex];
            if (widget.$item !== item &&
                GridsterComponent.checkCollisionTwoItemsForSwaping(widget.$item, item)) {
                return widget;
            }
        }
        return false;
    }
    previewStyle(drag = false) {
        if (this.movingItem) {
            if (this.compact && drag) {
                this.compact.checkCompactItem(this.movingItem);
            }
            this.previewStyle$.next(this.movingItem);
        }
        else {
            this.previewStyle$.next(null);
        }
    }
    // ------ End of functions for swapWhileDragging option
    // eslint-disable-next-line @typescript-eslint/member-ordering
    static getNewArrayLength(length, overallSize, size) {
        const newLength = Math.max(length, Math.floor(overallSize / size));
        if (newLength < 0) {
            return 0;
        }
        if (Number.isFinite(newLength)) {
            return Math.floor(newLength);
        }
        return 0;
    }
}
GridsterComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterComponent, deps: [{ token: ElementRef }, { token: Renderer2 }, { token: ChangeDetectorRef }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterComponent, isStandalone: true, selector: "gridster", inputs: { options: "options" }, usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"], dependencies: [{ kind: "directive", type: NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: GridsterPreviewComponent, selector: "gridster-preview", inputs: ["previewStyle$", "gridRenderer"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster', encapsulation: ViewEncapsulation.None, standalone: true, imports: [NgForOf, NgStyle, GridsterPreviewComponent], template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"] }]
        }], ctorParameters: function () {
        return [{ type: i0.ElementRef, decorators: [{
                        type: Inject,
                        args: [ElementRef]
                    }] }, { type: i0.Renderer2, decorators: [{
                        type: Inject,
                        args: [Renderer2]
                    }] }, { type: i0.ChangeDetectorRef, decorators: [{
                        type: Inject,
                        args: [ChangeDetectorRef]
                    }] }, { type: i0.NgZone, decorators: [{
                        type: Inject,
                        args: [NgZone]
                    }] }];
    }, propDecorators: { options: [{
                type: Input
            }] } });

class GridsterPush {
    constructor(gridsterItem) {
        this.iteration = 0;
        this.pushedItems = [];
        this.pushedItemsTemp = [];
        this.pushedItemsTempPath = [];
        this.pushedItemsPath = [];
        this.gridsterItem = gridsterItem;
        this.gridster = gridsterItem.gridster;
        this.tryPattern = {
            fromEast: [this.tryWest, this.trySouth, this.tryNorth, this.tryEast],
            fromWest: [this.tryEast, this.trySouth, this.tryNorth, this.tryWest],
            fromNorth: [this.trySouth, this.tryEast, this.tryWest, this.tryNorth],
            fromSouth: [this.tryNorth, this.tryEast, this.tryWest, this.trySouth]
        };
        this.fromSouth = 'fromSouth';
        this.fromNorth = 'fromNorth';
        this.fromEast = 'fromEast';
        this.fromWest = 'fromWest';
    }
    destroy() {
        this.gridster = this.gridsterItem = null;
    }
    pushItems(direction, disable) {
        if (this.gridster.$options.pushItems && !disable) {
            this.pushedItemsOrder = [];
            this.iteration = 0;
            const pushed = this.push(this.gridsterItem, direction);
            if (!pushed) {
                this.restoreTempItems();
            }
            this.pushedItemsOrder = [];
            this.pushedItemsTemp = [];
            this.pushedItemsTempPath = [];
            return pushed;
        }
        else {
            return false;
        }
    }
    restoreTempItems() {
        let i = this.pushedItemsTemp.length - 1;
        for (; i > -1; i--) {
            this.removeFromTempPushed(this.pushedItemsTemp[i]);
        }
    }
    restoreItems() {
        let i = 0;
        const l = this.pushedItems.length;
        let pushedItem;
        for (; i < l; i++) {
            pushedItem = this.pushedItems[i];
            pushedItem.$item.x = pushedItem.item.x || 0;
            pushedItem.$item.y = pushedItem.item.y || 0;
            pushedItem.setSize();
        }
        this.pushedItems = [];
        this.pushedItemsPath = [];
    }
    setPushedItems() {
        let i = 0;
        const l = this.pushedItems.length;
        let pushedItem;
        for (; i < l; i++) {
            pushedItem = this.pushedItems[i];
            pushedItem.checkItemChanges(pushedItem.$item, pushedItem.item);
        }
        this.pushedItems = [];
        this.pushedItemsPath = [];
    }
    checkPushBack() {
        let i = this.pushedItems.length - 1;
        let change = false;
        for (; i > -1; i--) {
            if (this.checkPushedItem(this.pushedItems[i], i)) {
                change = true;
            }
        }
        if (change) {
            this.checkPushBack();
        }
    }
    push(gridsterItem, direction) {
        if (this.iteration > 100) {
            console.warn('max iteration reached');
            return false;
        }
        if (this.gridster.checkGridCollision(gridsterItem.$item)) {
            return false;
        }
        if (direction === '') {
            return false;
        }
        const conflicts = this.gridster.findItemsWithItem(gridsterItem.$item);
        const invert = direction === this.fromNorth || direction === this.fromWest;
        // sort the list of conflicts in order of [y,x]. Invert when the push is from north and west
        // this is done so they don't conflict witch each other and revert positions, keeping the previous order
        conflicts.sort((a, b) => {
            if (invert) {
                return b.$item.y - a.$item.y || b.$item.x - a.$item.x;
            }
            else {
                return a.$item.y - b.$item.y || a.$item.x - b.$item.x;
            }
        });
        let i = 0;
        let itemCollision;
        let makePush = true;
        const pushedItems = [];
        for (; i < conflicts.length; i++) {
            itemCollision = conflicts[i];
            if (itemCollision === this.gridsterItem) {
                continue;
            }
            if (!itemCollision.canBeDragged()) {
                makePush = false;
                break;
            }
            const p = this.pushedItemsTemp.indexOf(itemCollision);
            if (p > -1 && this.pushedItemsTempPath[p].length > 10) {
                // stop if item is pushed more than 10 times to break infinite loops
                makePush = false;
                break;
            }
            if (this.tryPattern[direction][0].call(this, itemCollision, gridsterItem)) {
                this.pushedItemsOrder.push(itemCollision);
                pushedItems.push(itemCollision);
            }
            else if (this.tryPattern[direction][1].call(this, itemCollision, gridsterItem)) {
                this.pushedItemsOrder.push(itemCollision);
                pushedItems.push(itemCollision);
            }
            else if (this.tryPattern[direction][2].call(this, itemCollision, gridsterItem)) {
                this.pushedItemsOrder.push(itemCollision);
                pushedItems.push(itemCollision);
            }
            else if (this.tryPattern[direction][3].call(this, itemCollision, gridsterItem)) {
                this.pushedItemsOrder.push(itemCollision);
                pushedItems.push(itemCollision);
            }
            else {
                makePush = false;
                break;
            }
        }
        if (!makePush) {
            i = this.pushedItemsOrder.lastIndexOf(pushedItems[0]);
            if (i > -1) {
                let j = this.pushedItemsOrder.length - 1;
                for (; j >= i; j--) {
                    itemCollision = this.pushedItemsOrder[j];
                    this.pushedItemsOrder.pop();
                    this.removeFromTempPushed(itemCollision);
                    this.removeFromPushedItem(itemCollision);
                }
            }
        }
        this.iteration++;
        return makePush;
    }
    trySouth(gridsterItemCollide, gridsterItem) {
        if (!this.gridster.$options.pushDirections.south) {
            return false;
        }
        this.addToTempPushed(gridsterItemCollide);
        gridsterItemCollide.$item.y =
            gridsterItem.$item.y + gridsterItem.$item.rows;
        if (this.push(gridsterItemCollide, this.fromNorth)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            return true;
        }
        else {
            this.removeFromTempPushed(gridsterItemCollide);
        }
        return false;
    }
    tryNorth(gridsterItemCollide, gridsterItem) {
        if (!this.gridster.$options.pushDirections.north) {
            return false;
        }
        this.addToTempPushed(gridsterItemCollide);
        gridsterItemCollide.$item.y =
            gridsterItem.$item.y - gridsterItemCollide.$item.rows;
        if (this.push(gridsterItemCollide, this.fromSouth)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            return true;
        }
        else {
            this.removeFromTempPushed(gridsterItemCollide);
        }
        return false;
    }
    tryEast(gridsterItemCollide, gridsterItem) {
        if (!this.gridster.$options.pushDirections.east) {
            return false;
        }
        this.addToTempPushed(gridsterItemCollide);
        gridsterItemCollide.$item.x =
            gridsterItem.$item.x + gridsterItem.$item.cols;
        if (this.push(gridsterItemCollide, this.fromWest)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            return true;
        }
        else {
            this.removeFromTempPushed(gridsterItemCollide);
        }
        return false;
    }
    tryWest(gridsterItemCollide, gridsterItem) {
        if (!this.gridster.$options.pushDirections.west) {
            return false;
        }
        this.addToTempPushed(gridsterItemCollide);
        gridsterItemCollide.$item.x =
            gridsterItem.$item.x - gridsterItemCollide.$item.cols;
        if (this.push(gridsterItemCollide, this.fromEast)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            return true;
        }
        else {
            this.removeFromTempPushed(gridsterItemCollide);
        }
        return false;
    }
    addToTempPushed(gridsterItem) {
        let i = this.pushedItemsTemp.indexOf(gridsterItem);
        if (i === -1) {
            i = this.pushedItemsTemp.push(gridsterItem) - 1;
            this.pushedItemsTempPath[i] = [];
        }
        this.pushedItemsTempPath[i].push({
            x: gridsterItem.$item.x,
            y: gridsterItem.$item.y
        });
    }
    removeFromTempPushed(gridsterItem) {
        const i = this.pushedItemsTemp.indexOf(gridsterItem);
        const tempPosition = this.pushedItemsTempPath[i].pop();
        if (!tempPosition) {
            return;
        }
        gridsterItem.$item.x = tempPosition.x;
        gridsterItem.$item.y = tempPosition.y;
        gridsterItem.setSize();
        if (!this.pushedItemsTempPath[i].length) {
            this.pushedItemsTemp.splice(i, 1);
            this.pushedItemsTempPath.splice(i, 1);
        }
    }
    addToPushed(gridsterItem) {
        if (this.pushedItems.indexOf(gridsterItem) < 0) {
            this.pushedItems.push(gridsterItem);
            this.pushedItemsPath.push([
                { x: gridsterItem.item.x || 0, y: gridsterItem.item.y || 0 },
                { x: gridsterItem.$item.x, y: gridsterItem.$item.y }
            ]);
        }
        else {
            const i = this.pushedItems.indexOf(gridsterItem);
            this.pushedItemsPath[i].push({
                x: gridsterItem.$item.x,
                y: gridsterItem.$item.y
            });
        }
    }
    removeFromPushed(i) {
        if (i > -1) {
            this.pushedItems.splice(i, 1);
            this.pushedItemsPath.splice(i, 1);
        }
    }
    removeFromPushedItem(gridsterItem) {
        const i = this.pushedItems.indexOf(gridsterItem);
        if (i > -1) {
            this.pushedItemsPath[i].pop();
            if (!this.pushedItemsPath.length) {
                this.pushedItems.splice(i, 1);
                this.pushedItemsPath.splice(i, 1);
            }
        }
    }
    checkPushedItem(pushedItem, i) {
        const path = this.pushedItemsPath[i];
        let j = path.length - 2;
        let lastPosition;
        let x;
        let y;
        let change = false;
        for (; j > -1; j--) {
            lastPosition = path[j];
            x = pushedItem.$item.x;
            y = pushedItem.$item.y;
            pushedItem.$item.x = lastPosition.x;
            pushedItem.$item.y = lastPosition.y;
            if (!this.gridster.findItemWithItem(pushedItem.$item)) {
                pushedItem.setSize();
                path.splice(j + 1, path.length - j - 1);
                change = true;
            }
            else {
                pushedItem.$item.x = x;
                pushedItem.$item.y = y;
            }
        }
        if (path.length < 2) {
            this.removeFromPushed(i);
        }
        return change;
    }
}

let scrollSensitivity;
let scrollSpeed;
const intervalDuration = 50;
let gridsterElement;
let resizeEvent;
let resizeEventType;
let intervalE;
let intervalW;
let intervalN;
let intervalS;
function scroll(gridster, left, top, width, height, event, lastMouse, calculateItemPosition, resize, resizeEventScrollType) {
    scrollSensitivity = gridster.$options.scrollSensitivity;
    scrollSpeed = gridster.$options.scrollSpeed;
    gridsterElement = gridster.el;
    resizeEvent = resize;
    resizeEventType = resizeEventScrollType;
    const offsetWidth = gridsterElement.offsetWidth;
    const offsetHeight = gridsterElement.offsetHeight;
    const offsetLeft = gridsterElement.scrollLeft;
    const offsetTop = gridsterElement.scrollTop;
    const elemTopOffset = top - offsetTop;
    const elemBottomOffset = offsetHeight + offsetTop - top - height;
    const { clientX, clientY } = event;
    if (!gridster.$options.disableScrollVertical) {
        if (lastMouse.clientY < clientY && elemBottomOffset < scrollSensitivity) {
            cancelN();
            if ((resizeEvent && resizeEventType && !resizeEventType.south) ||
                intervalS) {
                return;
            }
            intervalS = startVertical(1, calculateItemPosition, lastMouse);
        }
        else if (lastMouse.clientY > clientY &&
            offsetTop > 0 &&
            elemTopOffset < scrollSensitivity) {
            cancelS();
            if ((resizeEvent && resizeEventType && !resizeEventType.north) ||
                intervalN) {
                return;
            }
            intervalN = startVertical(-1, calculateItemPosition, lastMouse);
        }
        else if (lastMouse.clientY !== clientY) {
            cancelVertical();
        }
    }
    const elemRightOffset = offsetLeft + offsetWidth - left - width;
    const elemLeftOffset = left - offsetLeft;
    if (!gridster.$options.disableScrollHorizontal) {
        if (lastMouse.clientX < clientX && elemRightOffset <= scrollSensitivity) {
            cancelW();
            if ((resizeEvent && resizeEventType && !resizeEventType.east) ||
                intervalE) {
                return;
            }
            intervalE = startHorizontal(1, calculateItemPosition, lastMouse);
        }
        else if (lastMouse.clientX > clientX &&
            offsetLeft > 0 &&
            elemLeftOffset < scrollSensitivity) {
            cancelE();
            if ((resizeEvent && resizeEventType && !resizeEventType.west) ||
                intervalW) {
                return;
            }
            intervalW = startHorizontal(-1, calculateItemPosition, lastMouse);
        }
        else if (lastMouse.clientX !== clientX) {
            cancelHorizontal();
        }
    }
}
function startVertical(sign, calculateItemPosition, lastMouse) {
    let clientY = lastMouse.clientY;
    return window.setInterval(() => {
        if (!gridsterElement ||
            (sign === -1 && gridsterElement.scrollTop - scrollSpeed < 0)) {
            cancelVertical();
        }
        gridsterElement.scrollTop += sign * scrollSpeed;
        clientY += sign * scrollSpeed;
        calculateItemPosition({ clientX: lastMouse.clientX, clientY });
    }, intervalDuration);
}
function startHorizontal(sign, calculateItemPosition, lastMouse) {
    let clientX = lastMouse.clientX;
    return window.setInterval(() => {
        if (!gridsterElement ||
            (sign === -1 && gridsterElement.scrollLeft - scrollSpeed < 0)) {
            cancelHorizontal();
        }
        gridsterElement.scrollLeft += sign * scrollSpeed;
        clientX += sign * scrollSpeed;
        calculateItemPosition({ clientX, clientY: lastMouse.clientY });
    }, intervalDuration);
}
function cancelScroll() {
    cancelHorizontal();
    cancelVertical();
    gridsterElement = null;
}
function cancelHorizontal() {
    cancelE();
    cancelW();
}
function cancelVertical() {
    cancelN();
    cancelS();
}
function cancelE() {
    if (intervalE) {
        clearInterval(intervalE);
        intervalE = 0;
    }
}
function cancelW() {
    if (intervalW) {
        clearInterval(intervalW);
        intervalW = 0;
    }
}
function cancelS() {
    if (intervalS) {
        clearInterval(intervalS);
        intervalS = 0;
    }
}
function cancelN() {
    if (intervalN) {
        clearInterval(intervalN);
        intervalN = 0;
    }
}

class GridsterSwap {
    constructor(gridsterItem) {
        this.gridsterItem = gridsterItem;
        this.gridster = gridsterItem.gridster;
    }
    destroy() {
        this.gridster = this.gridsterItem = this.swapedItem = null;
    }
    swapItems() {
        if (this.gridster.$options.swap) {
            this.checkSwapBack();
            this.checkSwap(this.gridsterItem);
        }
    }
    checkSwapBack() {
        if (this.swapedItem) {
            const x = this.swapedItem.$item.x;
            const y = this.swapedItem.$item.y;
            this.swapedItem.$item.x = this.swapedItem.item.x || 0;
            this.swapedItem.$item.y = this.swapedItem.item.y || 0;
            if (this.gridster.checkCollision(this.swapedItem.$item)) {
                this.swapedItem.$item.x = x;
                this.swapedItem.$item.y = y;
            }
            else {
                this.swapedItem.setSize();
                this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
                this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
                this.swapedItem = undefined;
            }
        }
    }
    restoreSwapItem() {
        if (this.swapedItem) {
            this.swapedItem.$item.x = this.swapedItem.item.x || 0;
            this.swapedItem.$item.y = this.swapedItem.item.y || 0;
            this.swapedItem.setSize();
            this.swapedItem = undefined;
        }
    }
    setSwapItem() {
        if (this.swapedItem) {
            this.swapedItem.checkItemChanges(this.swapedItem.$item, this.swapedItem.item);
            this.swapedItem = undefined;
        }
    }
    checkSwap(pushedBy) {
        let gridsterItemCollision;
        if (this.gridster.$options.swapWhileDragging) {
            gridsterItemCollision = this.gridster.checkCollisionForSwaping(pushedBy.$item);
        }
        else {
            gridsterItemCollision = this.gridster.checkCollision(pushedBy.$item);
        }
        if (gridsterItemCollision &&
            gridsterItemCollision !== true &&
            gridsterItemCollision.canBeDragged()) {
            const gridsterItemCollide = gridsterItemCollision;
            const copyCollisionX = gridsterItemCollide.$item.x;
            const copyCollisionY = gridsterItemCollide.$item.y;
            const copyX = pushedBy.$item.x;
            const copyY = pushedBy.$item.y;
            const diffX = copyX - copyCollisionX;
            const diffY = copyY - copyCollisionY;
            gridsterItemCollide.$item.x = pushedBy.item.x - diffX;
            gridsterItemCollide.$item.y = pushedBy.item.y - diffY;
            pushedBy.$item.x = gridsterItemCollide.item.x + diffX;
            pushedBy.$item.y = gridsterItemCollide.item.y + diffY;
            if (this.gridster.checkCollision(gridsterItemCollide.$item) ||
                this.gridster.checkCollision(pushedBy.$item)) {
                pushedBy.$item.x = copyX;
                pushedBy.$item.y = copyY;
                gridsterItemCollide.$item.x = copyCollisionX;
                gridsterItemCollide.$item.y = copyCollisionY;
            }
            else {
                gridsterItemCollide.setSize();
                this.swapedItem = gridsterItemCollide;
                if (this.gridster.$options.swapWhileDragging) {
                    this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
                    this.setSwapItem();
                }
            }
        }
    }
}

const GRIDSTER_ITEM_RESIZABLE_HANDLER_CLASS = 'gridster-item-resizable-handler';
var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (Direction = {}));
class GridsterDraggable {
    constructor(gridsterItem, gridster, zone) {
        this.zone = zone;
        this.collision = false;
        this.dragMove = (e) => {
            e.stopPropagation();
            e.preventDefault();
            GridsterUtils.checkTouchEvent(e);
            // get the directions of the mouse event
            let directions = this.getDirections(e);
            if (this.gridster.options.enableBoundaryControl) {
                // prevent moving up at the top of gridster
                if (directions.includes(Direction.UP) &&
                    this.gridsterItem.el.getBoundingClientRect().top <=
                        this.gridster.el.getBoundingClientRect().top + this.margin) {
                    directions = directions.filter(direction => direction != Direction.UP);
                    e = new MouseEvent(e.type, {
                        clientX: e.clientX,
                        clientY: this.lastMouse.clientY
                    });
                }
                // prevent moving left at the leftmost column of gridster
                if (directions.includes(Direction.LEFT) &&
                    this.gridsterItem.el.getBoundingClientRect().left <=
                        this.gridster.el.getBoundingClientRect().left + this.margin) {
                    directions = directions.filter(direction => direction != Direction.LEFT);
                    e = new MouseEvent(e.type, {
                        clientX: this.lastMouse.clientX,
                        clientY: e.clientY
                    });
                }
                // prevent moving right at the rightmost column of gridster
                if (directions.includes(Direction.RIGHT) &&
                    this.gridsterItem.el.getBoundingClientRect().right >=
                        this.gridster.el.getBoundingClientRect().right - this.margin) {
                    directions = directions.filter(direction => direction != Direction.RIGHT);
                    e = new MouseEvent(e.type, {
                        clientX: this.lastMouse.clientX,
                        clientY: e.clientY
                    });
                }
                // prevent moving down at the bottom of gridster
                if (directions.includes(Direction.DOWN) &&
                    this.gridsterItem.el.getBoundingClientRect().bottom >=
                        this.gridster.el.getBoundingClientRect().bottom - this.margin) {
                    directions = directions.filter(direction => direction != Direction.DOWN);
                    e = new MouseEvent(e.type, {
                        clientX: e.clientX,
                        clientY: this.lastMouse.clientY
                    });
                }
            }
            // do not change item location when there is no direction to go
            if (directions.length) {
                this.offsetLeft =
                    this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
                this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
                scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse, this.calculateItemPositionFromMousePosition);
                this.calculateItemPositionFromMousePosition(e);
                // callback
                this.dragMoveCb(e);
            }
        };
        this.calculateItemPositionFromMousePosition = (e) => {
            if (this.gridster.options.scale) {
                this.calculateItemPositionWithScale(e, this.gridster.options.scale);
            }
            else {
                this.calculateItemPositionWithoutScale(e);
            }
            this.calculateItemPosition();
            this.lastMouse.clientX = e.clientX;
            this.lastMouse.clientY = e.clientY;
            this.zone.run(() => {
                this.gridster.updateGrid();
            });
        };
        this.dragStop = (e) => {
            e.stopPropagation();
            e.preventDefault();
            cancelScroll();
            this.cancelOnBlur();
            this.mousemove();
            this.mouseup();
            this.mouseleave();
            this.touchmove();
            this.touchend();
            this.touchcancel();
            this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-moving');
            this.gridster.dragInProgress = false;
            this.gridster.updateGrid();
            this.path = [];
            if (this.gridster.options.draggable &&
                this.gridster.options.draggable.stop) {
                Promise.resolve(this.gridster.options.draggable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(this.makeDrag, this.cancelDrag);
            }
            else {
                this.makeDrag();
            }
            setTimeout(() => {
                if (this.gridster) {
                    this.gridster.movingItem = null;
                    this.gridster.previewStyle(true);
                }
            });
        };
        this.cancelDrag = () => {
            this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
            this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
            this.gridsterItem.setSize();
            if (this.push) {
                this.push.restoreItems();
            }
            if (this.swap) {
                this.swap.restoreSwapItem();
            }
            if (this.push) {
                this.push.destroy();
                this.push = null;
            }
            if (this.swap) {
                this.swap.destroy();
                this.swap = null;
            }
        };
        this.makeDrag = () => {
            if (this.gridster.$options.draggable.dropOverItems &&
                this.gridster.options.draggable &&
                this.gridster.options.draggable.dropOverItemsCallback &&
                this.collision &&
                this.collision !== true &&
                this.collision.$item) {
                this.gridster.options.draggable.dropOverItemsCallback(this.gridsterItem.item, this.collision.item, this.gridster);
            }
            this.collision = false;
            this.gridsterItem.setSize();
            this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
            if (this.push) {
                this.push.setPushedItems();
            }
            if (this.swap) {
                this.swap.setSwapItem();
            }
            if (this.push) {
                this.push.destroy();
                this.push = null;
            }
            if (this.swap) {
                this.swap.destroy();
                this.swap = null;
            }
        };
        this.dragStartDelay = (e) => {
            const target = e.target;
            if (target.classList.contains(GRIDSTER_ITEM_RESIZABLE_HANDLER_CLASS)) {
                return;
            }
            if (GridsterUtils.checkContentClassForEvent(this.gridster, e)) {
                return;
            }
            GridsterUtils.checkTouchEvent(e);
            if (!this.gridster.$options.draggable.delayStart) {
                this.dragStart(e);
                return;
            }
            const timeout = setTimeout(() => {
                this.dragStart(e);
                cancelDrag();
            }, this.gridster.$options.draggable.delayStart);
            const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
            const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
            const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
            const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
            const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
            const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);
            function cancelMove(eventMove) {
                GridsterUtils.checkTouchEvent(eventMove);
                if (Math.abs(eventMove.clientX - e.clientX) > 9 ||
                    Math.abs(eventMove.clientY - e.clientY) > 9) {
                    cancelDrag();
                }
            }
            function cancelDrag() {
                clearTimeout(timeout);
                cancelOnBlur();
                cancelMouse();
                cancelMouseLeave();
                cancelTouchMove();
                cancelTouchEnd();
                cancelTouchCancel();
            }
        };
        this.gridsterItem = gridsterItem;
        this.gridster = gridster;
        this.lastMouse = {
            clientX: 0,
            clientY: 0
        };
        this.path = [];
    }
    destroy() {
        if (this.gridster.previewStyle) {
            this.gridster.previewStyle(true);
        }
        this.gridsterItem = this.gridster = this.collision = null;
        if (this.mousedown) {
            this.mousedown();
            this.touchstart();
        }
    }
    dragStart(e) {
        if (e.which && e.which !== 1) {
            return;
        }
        if (this.gridster.options.draggable &&
            this.gridster.options.draggable.start) {
            this.gridster.options.draggable.start(this.gridsterItem.item, this.gridsterItem, e);
        }
        e.stopPropagation();
        e.preventDefault();
        this.zone.runOutsideAngular(() => {
            this.mousemove = this.gridsterItem.renderer.listen('document', 'mousemove', this.dragMove);
            this.touchmove = this.gridster.renderer.listen(this.gridster.el, 'touchmove', this.dragMove);
        });
        this.mouseup = this.gridsterItem.renderer.listen('document', 'mouseup', this.dragStop);
        this.mouseleave = this.gridsterItem.renderer.listen('document', 'mouseleave', this.dragStop);
        this.cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', this.dragStop);
        this.touchend = this.gridsterItem.renderer.listen('document', 'touchend', this.dragStop);
        this.touchcancel = this.gridsterItem.renderer.listen('document', 'touchcancel', this.dragStop);
        this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-moving');
        this.margin = this.gridster.$options.margin;
        this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
        this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
        this.left = this.gridsterItem.left - this.margin;
        this.top = this.gridsterItem.top - this.margin;
        this.originalClientX = e.clientX;
        this.originalClientY = e.clientY;
        this.width = this.gridsterItem.width;
        this.height = this.gridsterItem.height;
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.diffLeft =
                e.clientX - this.gridster.el.scrollWidth + this.gridsterItem.left;
        }
        else {
            this.diffLeft = e.clientX + this.offsetLeft - this.margin - this.left;
        }
        this.diffTop = e.clientY + this.offsetTop - this.margin - this.top;
        this.gridster.movingItem = this.gridsterItem.$item;
        this.gridster.previewStyle(true);
        this.push = new GridsterPush(this.gridsterItem);
        this.swap = new GridsterSwap(this.gridsterItem);
        this.gridster.dragInProgress = true;
        this.gridster.updateGrid();
        this.path.push({
            x: this.gridsterItem.item.x || 0,
            y: this.gridsterItem.item.y || 0
        });
    }
    calculateItemPositionWithScale(e, scale) {
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.left =
                this.gridster.el.scrollWidth -
                    this.originalClientX +
                    (e.clientX - this.originalClientX) / scale +
                    this.diffLeft;
        }
        else {
            this.left =
                this.originalClientX +
                    (e.clientX - this.originalClientX) / scale +
                    this.offsetLeft -
                    this.diffLeft;
        }
        this.top =
            this.originalClientY +
                (e.clientY - this.originalClientY) / scale +
                this.offsetTop -
                this.diffTop;
    }
    calculateItemPositionWithoutScale(e) {
        if (this.gridster.$options.dirType === DirTypes.RTL) {
            this.left = this.gridster.el.scrollWidth - e.clientX + this.diffLeft;
        }
        else {
            this.left = e.clientX + this.offsetLeft - this.diffLeft;
        }
        this.top = e.clientY + this.offsetTop - this.diffTop;
    }
    calculateItemPosition() {
        this.gridster.movingItem = this.gridsterItem.$item;
        this.positionX = this.gridster.pixelsToPositionX(this.left, Math.round);
        this.positionY = this.gridster.pixelsToPositionY(this.top, Math.round);
        this.positionXBackup = this.gridsterItem.$item.x;
        this.positionYBackup = this.gridsterItem.$item.y;
        this.gridsterItem.$item.x = this.positionX;
        if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
            this.gridsterItem.$item.x = this.positionXBackup;
        }
        this.gridsterItem.$item.y = this.positionY;
        if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
            this.gridsterItem.$item.y = this.positionYBackup;
        }
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, this.top);
        if (this.positionXBackup !== this.gridsterItem.$item.x ||
            this.positionYBackup !== this.gridsterItem.$item.y) {
            const lastPosition = this.path[this.path.length - 1];
            let direction = '';
            if (lastPosition.x < this.gridsterItem.$item.x) {
                direction = this.push.fromWest;
            }
            else if (lastPosition.x > this.gridsterItem.$item.x) {
                direction = this.push.fromEast;
            }
            else if (lastPosition.y < this.gridsterItem.$item.y) {
                direction = this.push.fromNorth;
            }
            else if (lastPosition.y > this.gridsterItem.$item.y) {
                direction = this.push.fromSouth;
            }
            this.push.pushItems(direction, this.gridster.$options.disablePushOnDrag);
            this.swap.swapItems();
            this.collision = this.gridster.checkCollision(this.gridsterItem.$item);
            if (this.collision) {
                this.gridsterItem.$item.x = this.positionXBackup;
                this.gridsterItem.$item.y = this.positionYBackup;
                if (this.gridster.$options.draggable.dropOverItems &&
                    this.collision !== true &&
                    this.collision.$item) {
                    this.gridster.movingItem = null;
                }
            }
            else {
                this.path.push({
                    x: this.gridsterItem.$item.x,
                    y: this.gridsterItem.$item.y
                });
            }
            this.push.checkPushBack();
        }
        else {
            // reset the collision when you drag and drop on an adjacent cell that is not empty
            // and go back to the cell you were in from the beginning,
            // this is to prevent `dropOverItemsCallback'
            this.collision = false;
        }
        this.gridster.previewStyle(true);
    }
    toggle() {
        const enableDrag = this.gridsterItem.canBeDragged();
        if (!this.enabled && enableDrag) {
            this.enabled = !this.enabled;
            this.mousedown = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'mousedown', this.dragStartDelay);
            this.touchstart = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'touchstart', this.dragStartDelay);
        }
        else if (this.enabled && !enableDrag) {
            this.enabled = !this.enabled;
            this.mousedown();
            this.touchstart();
        }
    }
    /**
     * Returns the list of directions for given mouse event
     * @param e Mouse event
     * */
    getDirections(e) {
        const directions = [];
        if (this.lastMouse.clientX === 0 && this.lastMouse.clientY === 0) {
            this.lastMouse.clientY = e.clientY;
            this.lastMouse.clientX = e.clientY;
        }
        if (this.lastMouse.clientY > e.clientY) {
            directions.push(Direction.UP);
        }
        if (this.lastMouse.clientY < e.clientY) {
            directions.push(Direction.DOWN);
        }
        if (this.lastMouse.clientX < e.clientX) {
            directions.push(Direction.RIGHT);
        }
        if (this.lastMouse.clientX > e.clientX) {
            directions.push(Direction.LEFT);
        }
        return directions;
    }
}

class GridsterPushResize {
    constructor(gridsterItem) {
        this.pushedItems = [];
        this.pushedItemsPath = [];
        this.gridsterItem = gridsterItem;
        this.gridster = gridsterItem.gridster;
        this.tryPattern = {
            fromEast: this.tryWest,
            fromWest: this.tryEast,
            fromNorth: this.trySouth,
            fromSouth: this.tryNorth
        };
        this.fromSouth = 'fromSouth';
        this.fromNorth = 'fromNorth';
        this.fromEast = 'fromEast';
        this.fromWest = 'fromWest';
    }
    destroy() {
        this.gridster = this.gridsterItem = null;
    }
    pushItems(direction) {
        if (this.gridster.$options.pushResizeItems) {
            return this.push(this.gridsterItem, direction);
        }
        else {
            return false;
        }
    }
    restoreItems() {
        let i = 0;
        const l = this.pushedItems.length;
        let pushedItem;
        for (; i < l; i++) {
            pushedItem = this.pushedItems[i];
            pushedItem.$item.x = pushedItem.item.x || 0;
            pushedItem.$item.y = pushedItem.item.y || 0;
            pushedItem.$item.cols = pushedItem.item.cols || 1;
            pushedItem.$item.row = pushedItem.item.row || 1;
            pushedItem.setSize();
        }
        this.pushedItems = [];
        this.pushedItemsPath = [];
    }
    setPushedItems() {
        let i = 0;
        const l = this.pushedItems.length;
        let pushedItem;
        for (; i < l; i++) {
            pushedItem = this.pushedItems[i];
            pushedItem.checkItemChanges(pushedItem.$item, pushedItem.item);
        }
        this.pushedItems = [];
        this.pushedItemsPath = [];
    }
    checkPushBack() {
        let i = this.pushedItems.length - 1;
        let change = false;
        for (; i > -1; i--) {
            if (this.checkPushedItem(this.pushedItems[i], i)) {
                change = true;
            }
        }
        if (change) {
            this.checkPushBack();
        }
    }
    push(gridsterItem, direction) {
        const gridsterItemCollision = this.gridster.checkCollision(gridsterItem.$item);
        if (gridsterItemCollision &&
            gridsterItemCollision !== true &&
            gridsterItemCollision !== this.gridsterItem &&
            gridsterItemCollision.canBeResized()) {
            if (this.tryPattern[direction].call(this, gridsterItemCollision, gridsterItem, direction)) {
                return true;
            }
        }
        else if (gridsterItemCollision === false) {
            return true;
        }
        return false;
    }
    trySouth(gridsterItemCollide, gridsterItem, direction) {
        const backUpY = gridsterItemCollide.$item.y;
        const backUpRows = gridsterItemCollide.$item.rows;
        gridsterItemCollide.$item.y =
            gridsterItem.$item.y + gridsterItem.$item.rows;
        gridsterItemCollide.$item.rows =
            backUpRows + backUpY - gridsterItemCollide.$item.y;
        if (!this.gridster.checkCollisionTwoItems(gridsterItemCollide.$item, gridsterItem.$item) &&
            !this.gridster.checkGridCollision(gridsterItemCollide.$item)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            this.push(gridsterItem, direction);
            return true;
        }
        else {
            gridsterItemCollide.$item.y = backUpY;
            gridsterItemCollide.$item.rows = backUpRows;
        }
        return false;
    }
    tryNorth(gridsterItemCollide, gridsterItem, direction) {
        const backUpRows = gridsterItemCollide.$item.rows;
        gridsterItemCollide.$item.rows =
            gridsterItem.$item.y - gridsterItemCollide.$item.y;
        if (!this.gridster.checkCollisionTwoItems(gridsterItemCollide.$item, gridsterItem.$item) &&
            !this.gridster.checkGridCollision(gridsterItemCollide.$item)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            this.push(gridsterItem, direction);
            return true;
        }
        else {
            gridsterItemCollide.$item.rows = backUpRows;
        }
        return false;
    }
    tryEast(gridsterItemCollide, gridsterItem, direction) {
        const backUpX = gridsterItemCollide.$item.x;
        const backUpCols = gridsterItemCollide.$item.cols;
        gridsterItemCollide.$item.x =
            gridsterItem.$item.x + gridsterItem.$item.cols;
        gridsterItemCollide.$item.cols =
            backUpCols + backUpX - gridsterItemCollide.$item.x;
        if (!this.gridster.checkCollisionTwoItems(gridsterItemCollide.$item, gridsterItem.$item) &&
            !this.gridster.checkGridCollision(gridsterItemCollide.$item)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            this.push(gridsterItem, direction);
            return true;
        }
        else {
            gridsterItemCollide.$item.x = backUpX;
            gridsterItemCollide.$item.cols = backUpCols;
        }
        return false;
    }
    tryWest(gridsterItemCollide, gridsterItem, direction) {
        const backUpCols = gridsterItemCollide.$item.cols;
        gridsterItemCollide.$item.cols =
            gridsterItem.$item.x - gridsterItemCollide.$item.x;
        if (!this.gridster.checkCollisionTwoItems(gridsterItemCollide.$item, gridsterItem.$item) &&
            !this.gridster.checkGridCollision(gridsterItemCollide.$item)) {
            gridsterItemCollide.setSize();
            this.addToPushed(gridsterItemCollide);
            this.push(gridsterItem, direction);
            return true;
        }
        else {
            gridsterItemCollide.$item.cols = backUpCols;
        }
        return false;
    }
    addToPushed(gridsterItem) {
        if (this.pushedItems.indexOf(gridsterItem) < 0) {
            this.pushedItems.push(gridsterItem);
            this.pushedItemsPath.push([
                {
                    x: gridsterItem.item.x || 0,
                    y: gridsterItem.item.y || 0,
                    cols: gridsterItem.item.cols || 0,
                    rows: gridsterItem.item.rows || 0
                },
                {
                    x: gridsterItem.$item.x,
                    y: gridsterItem.$item.y,
                    cols: gridsterItem.$item.cols,
                    rows: gridsterItem.$item.rows
                }
            ]);
        }
        else {
            const i = this.pushedItems.indexOf(gridsterItem);
            this.pushedItemsPath[i].push({
                x: gridsterItem.$item.x,
                y: gridsterItem.$item.y,
                cols: gridsterItem.$item.cols,
                rows: gridsterItem.$item.rows
            });
        }
    }
    removeFromPushed(i) {
        if (i > -1) {
            this.pushedItems.splice(i, 1);
            this.pushedItemsPath.splice(i, 1);
        }
    }
    checkPushedItem(pushedItem, i) {
        const path = this.pushedItemsPath[i];
        let j = path.length - 2;
        let lastPosition;
        let x;
        let y;
        let cols;
        let rows;
        for (; j > -1; j--) {
            lastPosition = path[j];
            x = pushedItem.$item.x;
            y = pushedItem.$item.y;
            cols = pushedItem.$item.cols;
            rows = pushedItem.$item.rows;
            pushedItem.$item.x = lastPosition.x;
            pushedItem.$item.y = lastPosition.y;
            pushedItem.$item.cols = lastPosition.cols;
            pushedItem.$item.rows = lastPosition.rows;
            if (!this.gridster.findItemWithItem(pushedItem.$item)) {
                pushedItem.setSize();
                path.splice(j + 1, path.length - 1 - j);
            }
            else {
                pushedItem.$item.x = x;
                pushedItem.$item.y = y;
                pushedItem.$item.cols = cols;
                pushedItem.$item.rows = rows;
            }
        }
        if (path.length < 2) {
            this.removeFromPushed(i);
            return true;
        }
        return false;
    }
}

class GridsterResizable {
    constructor(gridsterItem, gridster, zone) {
        this.zone = zone;
        /**
         * The direction function may reference any of the `GridsterResizable` class methods, that are
         * responsible for gridster resize when the `dragmove` event is being handled. E.g. it may reference
         * the `handleNorth` method when the north handle is pressed and moved by a mouse.
         */
        this.directionFunction = null;
        this.dragMove = (e) => {
            if (this.directionFunction === null) {
                throw new Error('The `directionFunction` has not been set before calling `dragMove`.');
            }
            e.stopPropagation();
            e.preventDefault();
            GridsterUtils.checkTouchEvent(e);
            this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
            this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
            scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse, this.directionFunction, true, this.resizeEventScrollType);
            const scale = this.gridster.options.scale || 1;
            this.directionFunction({
                clientX: this.originalClientX + (e.clientX - this.originalClientX) / scale,
                clientY: this.originalClientY + (e.clientY - this.originalClientY) / scale
            });
            this.lastMouse.clientX = e.clientX;
            this.lastMouse.clientY = e.clientY;
            this.zone.run(() => {
                this.gridster.updateGrid();
            });
        };
        this.dragStop = (e) => {
            e.stopPropagation();
            e.preventDefault();
            cancelScroll();
            this.mousemove();
            this.mouseup();
            this.mouseleave();
            this.cancelOnBlur();
            this.touchmove();
            this.touchend();
            this.touchcancel();
            this.gridster.dragInProgress = false;
            this.gridster.updateGrid();
            if (this.gridster.options.resizable &&
                this.gridster.options.resizable.stop) {
                Promise.resolve(this.gridster.options.resizable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(this.makeResize, this.cancelResize);
            }
            else {
                this.makeResize();
            }
            setTimeout(() => {
                this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-resizing');
                if (this.gridster) {
                    this.gridster.movingItem = null;
                    this.gridster.previewStyle();
                }
            });
        };
        this.cancelResize = () => {
            this.gridsterItem.$item.cols = this.gridsterItem.item.cols || 1;
            this.gridsterItem.$item.rows = this.gridsterItem.item.rows || 1;
            this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
            this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
            this.gridsterItem.setSize();
            this.push.restoreItems();
            this.pushResize.restoreItems();
            this.push.destroy();
            this.push = null;
            this.pushResize.destroy();
            this.pushResize = null;
        };
        this.makeResize = () => {
            this.gridsterItem.setSize();
            this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
            this.push.setPushedItems();
            this.pushResize.setPushedItems();
            this.push.destroy();
            this.push = null;
            this.pushResize.destroy();
            this.pushResize = null;
        };
        this.handleNorth = (e) => {
            this.top = e.clientY + this.offsetTop - this.diffTop;
            this.height = this.bottom - this.top;
            if (this.minHeight > this.height) {
                this.height = this.minHeight;
                this.top = this.bottom - this.minHeight;
            }
            this.newPosition = this.gridster.pixelsToPositionY(this.top + this.margin, Math.floor);
            if (this.gridsterItem.$item.y !== this.newPosition) {
                this.itemBackup[1] = this.gridsterItem.$item.y;
                this.itemBackup[3] = this.gridsterItem.$item.rows;
                this.gridsterItem.$item.rows +=
                    this.gridsterItem.$item.y - this.newPosition;
                this.gridsterItem.$item.y = this.newPosition;
                this.pushResize.pushItems(this.pushResize.fromSouth);
                this.push.pushItems(this.push.fromSouth, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.y = this.itemBackup[1];
                    this.gridsterItem.$item.rows = this.itemBackup[3];
                    this.setItemTop(this.gridster.positionYToPixels(this.gridsterItem.$item.y));
                    this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemTop(this.top);
            this.setItemHeight(this.height);
        };
        this.handleWest = (e) => {
            const clientX = this.gridster.$options.dirType === DirTypes.RTL
                ? this.originalClientX + (this.originalClientX - e.clientX)
                : e.clientX;
            this.left = clientX + this.offsetLeft - this.diffLeft;
            this.width = this.right - this.left;
            if (this.minWidth > this.width) {
                this.width = this.minWidth;
                this.left = this.right - this.minWidth;
            }
            this.newPosition = this.gridster.pixelsToPositionX(this.left + this.margin, Math.floor);
            if (this.gridsterItem.$item.x !== this.newPosition) {
                this.itemBackup[0] = this.gridsterItem.$item.x;
                this.itemBackup[2] = this.gridsterItem.$item.cols;
                this.gridsterItem.$item.cols +=
                    this.gridsterItem.$item.x - this.newPosition;
                this.gridsterItem.$item.x = this.newPosition;
                this.pushResize.pushItems(this.pushResize.fromEast);
                this.push.pushItems(this.push.fromEast, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.x = this.itemBackup[0];
                    this.gridsterItem.$item.cols = this.itemBackup[2];
                    this.setItemLeft(this.gridster.positionXToPixels(this.gridsterItem.$item.x));
                    this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemLeft(this.left);
            this.setItemWidth(this.width);
        };
        this.handleSouth = (e) => {
            this.height = e.clientY + this.offsetTop - this.diffBottom - this.top;
            if (this.minHeight > this.height) {
                this.height = this.minHeight;
            }
            this.bottom = this.top + this.height;
            this.newPosition = this.gridster.pixelsToPositionY(this.bottom, Math.ceil);
            if (this.gridsterItem.$item.y + this.gridsterItem.$item.rows !==
                this.newPosition) {
                this.itemBackup[3] = this.gridsterItem.$item.rows;
                this.gridsterItem.$item.rows =
                    this.newPosition - this.gridsterItem.$item.y;
                this.pushResize.pushItems(this.pushResize.fromNorth);
                this.push.pushItems(this.push.fromNorth, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.rows = this.itemBackup[3];
                    this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemHeight(this.height);
        };
        this.handleEast = (e) => {
            const clientX = this.gridster.$options.dirType === DirTypes.RTL
                ? this.originalClientX + (this.originalClientX - e.clientX)
                : e.clientX;
            this.width = clientX + this.offsetLeft - this.diffRight - this.left;
            if (this.minWidth > this.width) {
                this.width = this.minWidth;
            }
            this.right = this.left + this.width;
            this.newPosition = this.gridster.pixelsToPositionX(this.right, Math.ceil);
            if (this.gridsterItem.$item.x + this.gridsterItem.$item.cols !==
                this.newPosition) {
                this.itemBackup[2] = this.gridsterItem.$item.cols;
                this.gridsterItem.$item.cols =
                    this.newPosition - this.gridsterItem.$item.x;
                this.pushResize.pushItems(this.pushResize.fromWest);
                this.push.pushItems(this.push.fromWest, this.gridster.$options.disablePushOnResize);
                if (this.gridster.checkCollision(this.gridsterItem.$item)) {
                    this.gridsterItem.$item.cols = this.itemBackup[2];
                    this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) -
                        this.margin);
                    return;
                }
                else {
                    this.gridster.previewStyle();
                }
                this.pushResize.checkPushBack();
                this.push.checkPushBack();
            }
            this.setItemWidth(this.width);
        };
        this.handleNorthWest = (e) => {
            this.handleNorth(e);
            this.handleWest(e);
        };
        this.handleNorthEast = (e) => {
            this.handleNorth(e);
            this.handleEast(e);
        };
        this.handleSouthWest = (e) => {
            this.handleSouth(e);
            this.handleWest(e);
        };
        this.handleSouthEast = (e) => {
            this.handleSouth(e);
            this.handleEast(e);
        };
        this.gridsterItem = gridsterItem;
        this.gridster = gridster;
        this.lastMouse = {
            clientX: 0,
            clientY: 0
        };
        this.itemBackup = [0, 0, 0, 0];
        this.resizeEventScrollType = {
            west: false,
            east: false,
            north: false,
            south: false
        };
    }
    destroy() {
        var _a;
        (_a = this.gridster) === null || _a === void 0 ? void 0 : _a.previewStyle();
        this.gridster = this.gridsterItem = null;
    }
    dragStart(e) {
        if (e.which && e.which !== 1) {
            return;
        }
        if (this.gridster.options.resizable &&
            this.gridster.options.resizable.start) {
            this.gridster.options.resizable.start(this.gridsterItem.item, this.gridsterItem, e);
        }
        e.stopPropagation();
        e.preventDefault();
        this.zone.runOutsideAngular(() => {
            this.mousemove = this.gridsterItem.renderer.listen('document', 'mousemove', this.dragMove);
            this.touchmove = this.gridster.renderer.listen(this.gridster.el, 'touchmove', this.dragMove);
        });
        this.mouseup = this.gridsterItem.renderer.listen('document', 'mouseup', this.dragStop);
        this.mouseleave = this.gridsterItem.renderer.listen('document', 'mouseleave', this.dragStop);
        this.cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', this.dragStop);
        this.touchend = this.gridsterItem.renderer.listen('document', 'touchend', this.dragStop);
        this.touchcancel = this.gridsterItem.renderer.listen('document', 'touchcancel', this.dragStop);
        this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-resizing');
        this.lastMouse.clientX = e.clientX;
        this.lastMouse.clientY = e.clientY;
        this.left = this.gridsterItem.left;
        this.top = this.gridsterItem.top;
        this.originalClientX = e.clientX;
        this.originalClientY = e.clientY;
        this.width = this.gridsterItem.width;
        this.height = this.gridsterItem.height;
        this.bottom = this.gridsterItem.top + this.gridsterItem.height;
        this.right = this.gridsterItem.left + this.gridsterItem.width;
        this.margin = this.gridster.$options.margin;
        this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
        this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
        this.diffLeft = e.clientX + this.offsetLeft - this.left;
        this.diffRight = e.clientX + this.offsetLeft - this.right;
        this.diffTop = e.clientY + this.offsetTop - this.top;
        this.diffBottom = e.clientY + this.offsetTop - this.bottom;
        this.minHeight =
            this.gridster.positionYToPixels(this.gridsterItem.$item.minItemRows ||
                this.gridster.$options.minItemRows) - this.margin;
        this.minWidth =
            this.gridster.positionXToPixels(this.gridsterItem.$item.minItemCols ||
                this.gridster.$options.minItemCols) - this.margin;
        this.gridster.movingItem = this.gridsterItem.$item;
        this.gridster.previewStyle();
        this.push = new GridsterPush(this.gridsterItem);
        this.pushResize = new GridsterPushResize(this.gridsterItem);
        this.gridster.dragInProgress = true;
        this.gridster.updateGrid();
        const { classList } = e.target;
        if (classList.contains('handle-n')) {
            this.resizeEventScrollType.north = true;
            this.directionFunction = this.handleNorth;
        }
        else if (classList.contains('handle-w')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleEast;
            }
            else {
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleWest;
            }
        }
        else if (classList.contains('handle-s')) {
            this.resizeEventScrollType.south = true;
            this.directionFunction = this.handleSouth;
        }
        else if (classList.contains('handle-e')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleWest;
            }
            else {
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleEast;
            }
        }
        else if (classList.contains('handle-nw')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleNorthEast;
            }
            else {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleNorthWest;
            }
        }
        else if (classList.contains('handle-ne')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleNorthWest;
            }
            else {
                this.resizeEventScrollType.north = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleNorthEast;
            }
        }
        else if (classList.contains('handle-sw')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleSouthEast;
            }
            else {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleSouthWest;
            }
        }
        else if (classList.contains('handle-se')) {
            if (this.gridster.$options.dirType === DirTypes.RTL) {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.west = true;
                this.directionFunction = this.handleSouthWest;
            }
            else {
                this.resizeEventScrollType.south = true;
                this.resizeEventScrollType.east = true;
                this.directionFunction = this.handleSouthEast;
            }
        }
    }
    toggle() {
        this.resizeEnabled = this.gridsterItem.canBeResized();
        this.resizableHandles = this.gridsterItem.getResizableHandles();
    }
    dragStartDelay(e) {
        GridsterUtils.checkTouchEvent(e);
        if (!this.gridster.$options.resizable.delayStart) {
            this.dragStart(e);
            return;
        }
        const timeout = setTimeout(() => {
            this.dragStart(e);
            cancelDrag();
        }, this.gridster.$options.resizable.delayStart);
        const { cancelMouse, cancelMouseLeave, cancelOnBlur, cancelTouchMove, cancelTouchEnd, cancelTouchCancel } = this.zone.runOutsideAngular(() => {
            // Note: all of these events are being added within the `<root>` zone since they all
            // don't do any view updates and don't require Angular running change detection.
            // All event listeners call `cancelDrag` once the event is dispatched, the `cancelDrag`
            // is responsible only for removing event listeners.
            const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
            const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
            const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
            const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
            const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
            const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);
            return {
                cancelMouse,
                cancelMouseLeave,
                cancelOnBlur,
                cancelTouchMove,
                cancelTouchEnd,
                cancelTouchCancel
            };
        });
        function cancelMove(eventMove) {
            GridsterUtils.checkTouchEvent(eventMove);
            if (Math.abs(eventMove.clientX - e.clientX) > 9 ||
                Math.abs(eventMove.clientY - e.clientY) > 9) {
                cancelDrag();
            }
        }
        function cancelDrag() {
            clearTimeout(timeout);
            cancelOnBlur();
            cancelMouse();
            cancelMouseLeave();
            cancelTouchMove();
            cancelTouchEnd();
            cancelTouchCancel();
        }
    }
    setItemTop(top) {
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, top);
    }
    setItemLeft(left) {
        this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, left, this.top);
    }
    setItemHeight(height) {
        this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'height', height + 'px');
    }
    setItemWidth(width) {
        this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'width', width + 'px');
    }
}

class GridsterItemComponent {
    constructor(el, gridster, renderer, zone) {
        this.renderer = renderer;
        this.zone = zone;
        this.itemInit = new EventEmitter();
        this.itemChange = new EventEmitter();
        this.itemResize = new EventEmitter();
        this.el = el.nativeElement;
        this.$item = {
            cols: -1,
            rows: -1,
            x: -1,
            y: -1
        };
        this.gridster = gridster;
        this.drag = new GridsterDraggable(this, gridster, this.zone);
        this.resize = new GridsterResizable(this, gridster, this.zone);
    }
    get zIndex() {
        return this.getLayerIndex() + this.gridster.$options.baseLayerIndex;
    }
    ngOnInit() {
        this.gridster.addItem(this);
    }
    ngOnChanges(changes) {
        if (changes.item) {
            this.updateOptions();
            if (!this.init) {
                this.gridster.calculateLayout$.next();
            }
        }
        if (changes.item && changes.item.previousValue) {
            this.setSize();
        }
    }
    updateOptions() {
        this.$item = GridsterUtils.merge(this.$item, this.item, {
            cols: undefined,
            rows: undefined,
            x: undefined,
            y: undefined,
            layerIndex: undefined,
            dragEnabled: undefined,
            resizeEnabled: undefined,
            compactEnabled: undefined,
            maxItemRows: undefined,
            minItemRows: undefined,
            maxItemCols: undefined,
            minItemCols: undefined,
            maxItemArea: undefined,
            minItemArea: undefined,
            resizableHandles: {
                s: undefined,
                e: undefined,
                n: undefined,
                w: undefined,
                se: undefined,
                ne: undefined,
                sw: undefined,
                nw: undefined
            }
        });
    }
    ngOnDestroy() {
        this.gridster.removeItem(this);
        this.drag.destroy();
        this.resize.destroy();
        this.gridster = this.drag = this.resize = null;
    }
    setSize() {
        this.renderer.setStyle(this.el, 'display', this.notPlaced ? '' : 'block');
        this.gridster.gridRenderer.updateItem(this.el, this.$item, this.renderer);
        this.updateItemSize();
    }
    updateItemSize() {
        const top = this.$item.y * this.gridster.curRowHeight;
        const left = this.$item.x * this.gridster.curColWidth;
        const width = this.$item.cols * this.gridster.curColWidth -
            this.gridster.$options.margin;
        const height = this.$item.rows * this.gridster.curRowHeight -
            this.gridster.$options.margin;
        this.top = top;
        this.left = left;
        if (!this.init && width > 0 && height > 0) {
            this.init = true;
            if (this.item.initCallback) {
                this.item.initCallback(this.item, this);
            }
            if (this.gridster.options.itemInitCallback) {
                this.gridster.options.itemInitCallback(this.item, this);
            }
            this.itemInit.next({ item: this.item, itemComponent: this });
            if (this.gridster.$options.scrollToNewItems) {
                this.el.scrollIntoView(false);
            }
        }
        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
            if (this.gridster.options.itemResizeCallback) {
                this.gridster.options.itemResizeCallback(this.item, this);
            }
            this.itemResize.next({ item: this.item, itemComponent: this });
        }
    }
    itemChanged() {
        if (this.gridster.options.itemChangeCallback) {
            this.gridster.options.itemChangeCallback(this.item, this);
        }
        this.itemChange.next({ item: this.item, itemComponent: this });
    }
    checkItemChanges(newValue, oldValue) {
        if (newValue.rows === oldValue.rows &&
            newValue.cols === oldValue.cols &&
            newValue.x === oldValue.x &&
            newValue.y === oldValue.y) {
            return;
        }
        if (this.gridster.checkCollision(this.$item)) {
            this.$item.x = oldValue.x || 0;
            this.$item.y = oldValue.y || 0;
            this.$item.cols = oldValue.cols || 1;
            this.$item.rows = oldValue.rows || 1;
            this.setSize();
        }
        else {
            this.item.cols = this.$item.cols;
            this.item.rows = this.$item.rows;
            this.item.x = this.$item.x;
            this.item.y = this.$item.y;
            this.gridster.calculateLayout$.next();
            this.itemChanged();
        }
    }
    canBeDragged() {
        const gridDragEnabled = this.gridster.$options.draggable.enabled;
        const itemDragEnabled = this.$item.dragEnabled === undefined
            ? gridDragEnabled
            : this.$item.dragEnabled;
        return !this.gridster.mobile && gridDragEnabled && itemDragEnabled;
    }
    canBeResized() {
        const gridResizable = this.gridster.$options.resizable.enabled;
        const itemResizable = this.$item.resizeEnabled === undefined
            ? gridResizable
            : this.$item.resizeEnabled;
        return !this.gridster.mobile && gridResizable && itemResizable;
    }
    getResizableHandles() {
        const gridResizableHandles = this.gridster.$options.resizable.handles;
        const itemResizableHandles = this.$item.resizableHandles;
        // use grid settings if no settings are provided for the item.
        if (itemResizableHandles === undefined) {
            return gridResizableHandles;
        }
        // else merge the settings
        return Object.assign(Object.assign({}, gridResizableHandles), itemResizableHandles);
    }
    bringToFront(offset) {
        if (offset && offset <= 0) {
            return;
        }
        const layerIndex = this.getLayerIndex();
        const topIndex = this.gridster.$options.maxLayerIndex;
        if (layerIndex < topIndex) {
            const targetIndex = offset ? layerIndex + offset : topIndex;
            this.item.layerIndex = this.$item.layerIndex =
                targetIndex > topIndex ? topIndex : targetIndex;
        }
    }
    sendToBack(offset) {
        if (offset && offset <= 0) {
            return;
        }
        const layerIndex = this.getLayerIndex();
        if (layerIndex > 0) {
            const targetIndex = offset ? layerIndex - offset : 0;
            this.item.layerIndex = this.$item.layerIndex =
                targetIndex < 0 ? 0 : targetIndex;
        }
    }
    getLayerIndex() {
        if (this.item.layerIndex !== undefined) {
            return this.item.layerIndex;
        }
        if (this.gridster.$options.defaultLayerIndex !== undefined) {
            return this.gridster.$options.defaultLayerIndex;
        }
        return 0;
    }
}
GridsterItemComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterItemComponent, deps: [{ token: ElementRef }, { token: GridsterComponent }, { token: Renderer2 }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterItemComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterItemComponent, isStandalone: true, selector: "gridster-item", inputs: { item: "item" }, outputs: { itemInit: "itemInit", itemChange: "itemChange", itemResize: "itemResize" }, host: { properties: { "style.z-index": "this.zIndex" } }, usesOnChanges: true, ngImport: i0, template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"], dependencies: [{ kind: "directive", type: NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterItemComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-item', encapsulation: ViewEncapsulation.None, standalone: true, imports: [NgIf], template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"] }]
        }], ctorParameters: function () {
        return [{ type: i0.ElementRef, decorators: [{
                        type: Inject,
                        args: [ElementRef]
                    }] }, { type: GridsterComponent }, { type: i0.Renderer2, decorators: [{
                        type: Inject,
                        args: [Renderer2]
                    }] }, { type: i0.NgZone, decorators: [{
                        type: Inject,
                        args: [NgZone]
                    }] }];
    }, propDecorators: { item: [{
                type: Input
            }], itemInit: [{
                type: Output
            }], itemChange: [{
                type: Output
            }], itemResize: [{
                type: Output
            }], zIndex: [{
                type: HostBinding,
                args: ['style.z-index']
            }] } });

class GridsterItemComponentInterface {
}

class GridsterComponentInterface {
}

class GridsterModule {
}
GridsterModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
GridsterModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.0.1", ngImport: i0, type: GridsterModule, imports: [GridsterComponent, GridsterItemComponent], exports: [GridsterComponent, GridsterItemComponent] });
GridsterModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterModule, imports: [GridsterComponent, GridsterItemComponent] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [GridsterComponent, GridsterItemComponent],
                    exports: [GridsterComponent, GridsterItemComponent]
                }]
        }] });

/*
 * Public API Surface of gridster
 */

/**
 * Generated bundle index. Do not edit.
 */

export { CompactType, DirTypes, DisplayGrid, GridType, GridsterComponent, GridsterComponentInterface, GridsterConfigService, GridsterItemComponent, GridsterItemComponentInterface, GridsterModule, GridsterPush, GridsterPushResize, GridsterSwap };
//# sourceMappingURL=angular-gridster2.mjs.map
