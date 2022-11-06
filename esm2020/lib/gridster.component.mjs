import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, NgZone, Renderer2, ViewEncapsulation } from '@angular/core';
import { debounceTime, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { GridsterCompact } from './gridsterCompact.service';
import { GridsterConfigService } from './gridsterConfig.constant';
import { GridType } from './gridsterConfig.interface';
import { GridsterEmptyCell } from './gridsterEmptyCell.service';
import { GridsterRenderer } from './gridsterRenderer.service';
import { GridsterUtils } from './gridsterUtils.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "./gridsterPreview.component";
export class GridsterComponent {
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
GridsterComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterComponent, deps: [{ token: ElementRef }, { token: Renderer2 }, { token: ChangeDetectorRef }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.6", type: GridsterComponent, selector: "gridster", inputs: { options: "options" }, usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"], dependencies: [{ kind: "directive", type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i2.GridsterPreviewComponent, selector: "gridster-preview", inputs: ["previewStyle$", "gridRenderer"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster', encapsulation: ViewEncapsulation.None, template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef, decorators: [{
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
                }] }]; }, propDecorators: { options: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1ncmlkc3RlcjIvc3JjL2xpYi9ncmlkc3Rlci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWdyaWRzdGVyMi9zcmMvbGliL2dyaWRzdGVyLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFJTixTQUFTLEVBRVQsaUJBQWlCLEVBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBRTFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUU1RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUNsRSxPQUFPLEVBQWtCLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRXRFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBS2hFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQzlELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQzs7OztBQVN4RCxNQUFNLE9BQU8saUJBQWlCO0lBOEI1QixZQUNzQixFQUFjLEVBQ1IsUUFBbUIsRUFDWCxLQUF3QixFQUNuQyxJQUFZO1FBRlQsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNYLFVBQUssR0FBTCxLQUFLLENBQW1CO1FBQ25DLFNBQUksR0FBSixJQUFJLENBQVE7UUF2QnJDLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFDWixTQUFJLEdBQUcsQ0FB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QUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDL0I7SUFDSCxDQUFDO0lBRUQsdURBQXVEO0lBRXZELDhEQUE4RDtJQUN0RCxNQUFNLENBQUMsaUJBQWlCLENBQzlCLE1BQWMsRUFDZCxXQUFtQixFQUNuQixJQUFZO1FBRVosTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVuRSxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDakIsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUVELElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUM5QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDOUI7UUFFRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7OzhHQTN2QlUsaUJBQWlCLGtCQStCbEIsVUFBVSxhQUNWLFNBQVMsYUFDVCxpQkFBaUIsYUFDakIsTUFBTTtrR0FsQ0wsaUJBQWlCLHFHQ3JDOUIsZ2RBZ0JBOzJGRHFCYSxpQkFBaUI7a0JBUDdCLFNBQVM7K0JBRUUsVUFBVSxpQkFHTCxpQkFBaUIsQ0FBQyxJQUFJOzswQkFpQ2xDLE1BQU07MkJBQUMsVUFBVTs7MEJBQ2pCLE1BQU07MkJBQUMsU0FBUzs7MEJBQ2hCLE1BQU07MkJBQUMsaUJBQWlCOzswQkFDeEIsTUFBTTsyQkFBQyxNQUFNOzRDQS9CUCxPQUFPO3NCQUFmLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBWaWV3RW5jYXBzdWxhdGlvblxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGRlYm91bmNlVGltZSwgU3ViamVjdCwgc3dpdGNoTWFwLCB0YWtlVW50aWwsIHRpbWVyIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBHcmlkc3RlckNvbXBvbmVudEludGVyZmFjZSB9IGZyb20gJy4vZ3JpZHN0ZXIuaW50ZXJmYWNlJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcGFjdCB9IGZyb20gJy4vZ3JpZHN0ZXJDb21wYWN0LnNlcnZpY2UnO1xuXG5pbXBvcnQgeyBHcmlkc3RlckNvbmZpZ1NlcnZpY2UgfSBmcm9tICcuL2dyaWRzdGVyQ29uZmlnLmNvbnN0YW50JztcbmltcG9ydCB7IEdyaWRzdGVyQ29uZmlnLCBHcmlkVHlwZSB9IGZyb20gJy4vZ3JpZHN0ZXJDb25maWcuaW50ZXJmYWNlJztcbmltcG9ydCB7IEdyaWRzdGVyQ29uZmlnUyB9IGZyb20gJy4vZ3JpZHN0ZXJDb25maWdTLmludGVyZmFjZSc7XG5pbXBvcnQgeyBHcmlkc3RlckVtcHR5Q2VsbCB9IGZyb20gJy4vZ3JpZHN0ZXJFbXB0eUNlbGwuc2VydmljZSc7XG5pbXBvcnQge1xuICBHcmlkc3Rlckl0ZW0sXG4gIEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVxufSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJSZW5kZXJlciB9IGZyb20gJy4vZ3JpZHN0ZXJSZW5kZXJlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyVXRpbHMgfSBmcm9tICcuL2dyaWRzdGVyVXRpbHMuc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2NvbXBvbmVudC1zZWxlY3RvclxuICBzZWxlY3RvcjogJ2dyaWRzdGVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2dyaWRzdGVyLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9ncmlkc3Rlci5jc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBHcmlkc3RlckNvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlXG57XG4gIEBJbnB1dCgpIG9wdGlvbnM6IEdyaWRzdGVyQ29uZmlnO1xuICBtb3ZpbmdJdGVtOiBHcmlkc3Rlckl0ZW0gfCBudWxsO1xuICBlbDogSFRNTEVsZW1lbnQ7XG4gICRvcHRpb25zOiBHcmlkc3RlckNvbmZpZ1M7XG4gIG1vYmlsZTogYm9vbGVhbjtcbiAgY3VyV2lkdGg6IG51bWJlcjtcbiAgY3VySGVpZ2h0OiBudW1iZXI7XG4gIGdyaWQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVtdO1xuICBjb2x1bW5zID0gMDtcbiAgcm93cyA9IDA7XG4gIGN1ckNvbFdpZHRoOiBudW1iZXI7XG4gIGN1clJvd0hlaWdodDogbnVtYmVyO1xuICBncmlkQ29sdW1ucyA9IFtdO1xuICBncmlkUm93cyA9IFtdO1xuICB3aW5kb3dSZXNpemU6ICgoKSA9PiB2b2lkKSB8IG51bGw7XG4gIGRyYWdJblByb2dyZXNzOiBib29sZWFuO1xuICBlbXB0eUNlbGw6IEdyaWRzdGVyRW1wdHlDZWxsO1xuICBjb21wYWN0OiBHcmlkc3RlckNvbXBhY3Q7XG4gIGdyaWRSZW5kZXJlcjogR3JpZHN0ZXJSZW5kZXJlcjtcbiAgcHJldmlld1N0eWxlJDogRXZlbnRFbWl0dGVyPEdyaWRzdGVySXRlbSB8IG51bGw+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPEdyaWRzdGVySXRlbSB8IG51bGw+KCk7XG5cbiAgY2FsY3VsYXRlTGF5b3V0JCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJpdmF0ZSByZXNpemUkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBkZXN0cm95JCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChFbGVtZW50UmVmKSBlbDogRWxlbWVudFJlZixcbiAgICBASW5qZWN0KFJlbmRlcmVyMikgcHVibGljIHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgQEluamVjdChDaGFuZ2VEZXRlY3RvclJlZikgcHVibGljIGNkUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBASW5qZWN0KE5nWm9uZSkgcHVibGljIHpvbmU6IE5nWm9uZVxuICApIHtcbiAgICB0aGlzLmVsID0gZWwubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLiRvcHRpb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShHcmlkc3RlckNvbmZpZ1NlcnZpY2UpKTtcbiAgICB0aGlzLm1vYmlsZSA9IGZhbHNlO1xuICAgIHRoaXMuY3VyV2lkdGggPSAwO1xuICAgIHRoaXMuY3VySGVpZ2h0ID0gMDtcbiAgICB0aGlzLmdyaWQgPSBbXTtcbiAgICB0aGlzLmN1ckNvbFdpZHRoID0gMDtcbiAgICB0aGlzLmN1clJvd0hlaWdodCA9IDA7XG4gICAgdGhpcy5kcmFnSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIHRoaXMuZW1wdHlDZWxsID0gbmV3IEdyaWRzdGVyRW1wdHlDZWxsKHRoaXMpO1xuICAgIHRoaXMuY29tcGFjdCA9IG5ldyBHcmlkc3RlckNvbXBhY3QodGhpcyk7XG4gICAgdGhpcy5ncmlkUmVuZGVyZXIgPSBuZXcgR3JpZHN0ZXJSZW5kZXJlcih0aGlzKTtcbiAgfVxuXG4gIC8vIC0tLS0tLSBGdW5jdGlvbiBmb3Igc3dhcFdoaWxlRHJhZ2dpbmcgb3B0aW9uXG5cbiAgLy8gaWRlbnRpY2FsIHRvIGNoZWNrQ29sbGlzaW9uKCkgZXhjZXB0IHRoYXQgaGVyZSB3ZSBhZGQgYm91bmRhcmllcy5cbiAgc3RhdGljIGNoZWNrQ29sbGlzaW9uVHdvSXRlbXNGb3JTd2FwaW5nKFxuICAgIGl0ZW06IEdyaWRzdGVySXRlbSxcbiAgICBpdGVtMjogR3JpZHN0ZXJJdGVtXG4gICk6IGJvb2xlYW4ge1xuICAgIC8vIGlmIHRoZSBjb2xzIG9yIHJvd3Mgb2YgdGhlIGl0ZW1zIGFyZSAxICwgZG9lc250IG1ha2UgYW55IHNlbnNlIHRvIHNldCBhIGJvdW5kYXJ5LiBPbmx5IGlmIHRoZSBpdGVtIGlzIGJpZ2dlciB3ZSBzZXQgYSBib3VuZGFyeVxuICAgIGNvbnN0IGhvcml6b250YWxCb3VuZGFyeUl0ZW0xID0gaXRlbS5jb2xzID09PSAxID8gMCA6IDE7XG4gICAgY29uc3QgaG9yaXpvbnRhbEJvdW5kYXJ5SXRlbTIgPSBpdGVtMi5jb2xzID09PSAxID8gMCA6IDE7XG4gICAgY29uc3QgdmVydGljYWxCb3VuZGFyeUl0ZW0xID0gaXRlbS5yb3dzID09PSAxID8gMCA6IDE7XG4gICAgY29uc3QgdmVydGljYWxCb3VuZGFyeUl0ZW0yID0gaXRlbTIucm93cyA9PT0gMSA/IDAgOiAxO1xuICAgIHJldHVybiAoXG4gICAgICBpdGVtLnggKyBob3Jpem9udGFsQm91bmRhcnlJdGVtMSA8IGl0ZW0yLnggKyBpdGVtMi5jb2xzICYmXG4gICAgICBpdGVtLnggKyBpdGVtLmNvbHMgPiBpdGVtMi54ICsgaG9yaXpvbnRhbEJvdW5kYXJ5SXRlbTIgJiZcbiAgICAgIGl0ZW0ueSArIHZlcnRpY2FsQm91bmRhcnlJdGVtMSA8IGl0ZW0yLnkgKyBpdGVtMi5yb3dzICYmXG4gICAgICBpdGVtLnkgKyBpdGVtLnJvd3MgPiBpdGVtMi55ICsgdmVydGljYWxCb3VuZGFyeUl0ZW0yXG4gICAgKTtcbiAgfVxuXG4gIGNoZWNrQ29sbGlzaW9uVHdvSXRlbXMoaXRlbTogR3JpZHN0ZXJJdGVtLCBpdGVtMjogR3JpZHN0ZXJJdGVtKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY29sbGlzaW9uID1cbiAgICAgIGl0ZW0ueCA8IGl0ZW0yLnggKyBpdGVtMi5jb2xzICYmXG4gICAgICBpdGVtLnggKyBpdGVtLmNvbHMgPiBpdGVtMi54ICYmXG4gICAgICBpdGVtLnkgPCBpdGVtMi55ICsgaXRlbTIucm93cyAmJlxuICAgICAgaXRlbS55ICsgaXRlbS5yb3dzID4gaXRlbTIueTtcbiAgICBpZiAoIWNvbGxpc2lvbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuJG9wdGlvbnMuYWxsb3dNdWx0aUxheWVyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgZGVmYXVsdExheWVySW5kZXggPSB0aGlzLiRvcHRpb25zLmRlZmF1bHRMYXllckluZGV4O1xuICAgIGNvbnN0IGxheWVySW5kZXggPVxuICAgICAgaXRlbS5sYXllckluZGV4ID09PSB1bmRlZmluZWQgPyBkZWZhdWx0TGF5ZXJJbmRleCA6IGl0ZW0ubGF5ZXJJbmRleDtcbiAgICBjb25zdCBsYXllckluZGV4MiA9XG4gICAgICBpdGVtMi5sYXllckluZGV4ID09PSB1bmRlZmluZWQgPyBkZWZhdWx0TGF5ZXJJbmRleCA6IGl0ZW0yLmxheWVySW5kZXg7XG4gICAgcmV0dXJuIGxheWVySW5kZXggPT09IGxheWVySW5kZXgyO1xuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pbml0Q2FsbGJhY2spIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pbml0Q2FsbGJhY2sodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5jYWxjdWxhdGVMYXlvdXQkXG4gICAgICAucGlwZShkZWJvdW5jZVRpbWUoMCksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5jYWxjdWxhdGVMYXlvdXQoKSk7XG5cbiAgICB0aGlzLnJlc2l6ZSRcbiAgICAgIC5waXBlKFxuICAgICAgICAvLyBDYW5jZWwgcHJldmlvdXNseSBzY2hlZHVsZWQgRE9NIHRpbWVyIGlmIGBjYWxjdWxhdGVMYXlvdXQoKWAgaGFzIGJlZW4gY2FsbGVkXG4gICAgICAgIC8vIHdpdGhpbiB0aGlzIHRpbWUgcmFuZ2UuXG4gICAgICAgIHN3aXRjaE1hcCgoKSA9PiB0aW1lcigxMDApKSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveSQpXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVzaXplKCkpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLm9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc2V0T3B0aW9ucygpO1xuICAgICAgdGhpcy5vcHRpb25zLmFwaSA9IHtcbiAgICAgICAgb3B0aW9uc0NoYW5nZWQ6IHRoaXMub3B0aW9uc0NoYW5nZWQsXG4gICAgICAgIHJlc2l6ZTogdGhpcy5vblJlc2l6ZSxcbiAgICAgICAgZ2V0TmV4dFBvc3NpYmxlUG9zaXRpb246IHRoaXMuZ2V0TmV4dFBvc3NpYmxlUG9zaXRpb24sXG4gICAgICAgIGdldEZpcnN0UG9zc2libGVQb3NpdGlvbjogdGhpcy5nZXRGaXJzdFBvc3NpYmxlUG9zaXRpb24sXG4gICAgICAgIGdldExhc3RQb3NzaWJsZVBvc2l0aW9uOiB0aGlzLmdldExhc3RQb3NzaWJsZVBvc2l0aW9uLFxuICAgICAgICBnZXRJdGVtQ29tcG9uZW50OiAoaXRlbTogR3JpZHN0ZXJJdGVtKSA9PiB0aGlzLmdldEl0ZW1Db21wb25lbnQoaXRlbSlcbiAgICAgIH07XG4gICAgICB0aGlzLmNvbHVtbnMgPSB0aGlzLiRvcHRpb25zLm1pbkNvbHM7XG4gICAgICB0aGlzLnJvd3MgPSB0aGlzLiRvcHRpb25zLm1pblJvd3MgKyB0aGlzLiRvcHRpb25zLmFkZEVtcHR5Um93c0NvdW50O1xuICAgICAgdGhpcy5zZXRHcmlkU2l6ZSgpO1xuICAgICAgdGhpcy5jYWxjdWxhdGVMYXlvdXQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlc2l6ZSgpOiB2b2lkIHtcbiAgICBsZXQgaGVpZ2h0O1xuICAgIGxldCB3aWR0aDtcbiAgICBpZiAodGhpcy4kb3B0aW9ucy5ncmlkVHlwZSA9PT0gJ2ZpdCcgJiYgIXRoaXMubW9iaWxlKSB7XG4gICAgICB3aWR0aCA9IHRoaXMuZWwub2Zmc2V0V2lkdGg7XG4gICAgICBoZWlnaHQgPSB0aGlzLmVsLm9mZnNldEhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB0aGlzLmVsLmNsaWVudFdpZHRoO1xuICAgICAgaGVpZ2h0ID0gdGhpcy5lbC5jbGllbnRIZWlnaHQ7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICh3aWR0aCAhPT0gdGhpcy5jdXJXaWR0aCB8fCBoZWlnaHQgIT09IHRoaXMuY3VySGVpZ2h0KSAmJlxuICAgICAgdGhpcy5jaGVja0lmVG9SZXNpemUoKVxuICAgICkge1xuICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHNldE9wdGlvbnMoKTogdm9pZCB7XG4gICAgdGhpcy4kb3B0aW9ucyA9IEdyaWRzdGVyVXRpbHMubWVyZ2UoXG4gICAgICB0aGlzLiRvcHRpb25zLFxuICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgdGhpcy4kb3B0aW9uc1xuICAgICk7XG4gICAgaWYgKCF0aGlzLiRvcHRpb25zLmRpc2FibGVXaW5kb3dSZXNpemUgJiYgIXRoaXMud2luZG93UmVzaXplKSB7XG4gICAgICB0aGlzLndpbmRvd1Jlc2l6ZSA9IHRoaXMucmVuZGVyZXIubGlzdGVuKFxuICAgICAgICAnd2luZG93JyxcbiAgICAgICAgJ3Jlc2l6ZScsXG4gICAgICAgIHRoaXMub25SZXNpemVcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRvcHRpb25zLmRpc2FibGVXaW5kb3dSZXNpemUgJiYgdGhpcy53aW5kb3dSZXNpemUpIHtcbiAgICAgIHRoaXMud2luZG93UmVzaXplKCk7XG4gICAgICB0aGlzLndpbmRvd1Jlc2l6ZSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZW1wdHlDZWxsLnVwZGF0ZU9wdGlvbnMoKTtcbiAgfVxuXG4gIG9wdGlvbnNDaGFuZ2VkID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuc2V0T3B0aW9ucygpO1xuICAgIGxldCB3aWRnZXRzSW5kZXg6IG51bWJlciA9IHRoaXMuZ3JpZC5sZW5ndGggLSAxO1xuICAgIGxldCB3aWRnZXQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgICBmb3IgKDsgd2lkZ2V0c0luZGV4ID49IDA7IHdpZGdldHNJbmRleC0tKSB7XG4gICAgICB3aWRnZXQgPSB0aGlzLmdyaWRbd2lkZ2V0c0luZGV4XTtcbiAgICAgIHdpZGdldC51cGRhdGVPcHRpb25zKCk7XG4gICAgfVxuICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0KCk7XG4gIH07XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5kZXN0cm95JC5uZXh0KCk7XG4gICAgdGhpcy5wcmV2aWV3U3R5bGUkLmNvbXBsZXRlKCk7XG4gICAgaWYgKHRoaXMud2luZG93UmVzaXplKSB7XG4gICAgICB0aGlzLndpbmRvd1Jlc2l6ZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5kZXN0cm95Q2FsbGJhY2spIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kZXN0cm95Q2FsbGJhY2sodGhpcyk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLmFwaSkge1xuICAgICAgdGhpcy5vcHRpb25zLmFwaS5yZXNpemUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLm9wdGlvbnMuYXBpLm9wdGlvbnNDaGFuZ2VkID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5vcHRpb25zLmFwaS5nZXROZXh0UG9zc2libGVQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMub3B0aW9ucy5hcGkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuZW1wdHlDZWxsLmRlc3Ryb3koKTtcbiAgICB0aGlzLmVtcHR5Q2VsbCA9IG51bGwhO1xuICAgIHRoaXMuY29tcGFjdC5kZXN0cm95KCk7XG4gICAgdGhpcy5jb21wYWN0ID0gbnVsbCE7XG4gIH1cblxuICBvblJlc2l6ZSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5lbC5jbGllbnRXaWR0aCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXRHcmlkU2l6ZSkge1xuICAgICAgICAvLyByZXNldCB3aWR0aC9oZWlnaHQgc28gdGhlIHNpemUgaXMgcmVjYWxjdWxhdGVkIGFmdGVyd2FyZHNcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAnd2lkdGgnLCAnJyk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ2hlaWdodCcsICcnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0R3JpZFNpemUoKTtcbiAgICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0KCk7XG4gICAgfVxuICB9O1xuXG4gIGNoZWNrSWZUb1Jlc2l6ZSgpOiBib29sZWFuIHtcbiAgICBjb25zdCBjbGllbnRXaWR0aCA9IHRoaXMuZWwuY2xpZW50V2lkdGg7XG4gICAgY29uc3Qgb2Zmc2V0V2lkdGggPSB0aGlzLmVsLm9mZnNldFdpZHRoO1xuICAgIGNvbnN0IHNjcm9sbFdpZHRoID0gdGhpcy5lbC5zY3JvbGxXaWR0aDtcbiAgICBjb25zdCBjbGllbnRIZWlnaHQgPSB0aGlzLmVsLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCBvZmZzZXRIZWlnaHQgPSB0aGlzLmVsLm9mZnNldEhlaWdodDtcbiAgICBjb25zdCBzY3JvbGxIZWlnaHQgPSB0aGlzLmVsLnNjcm9sbEhlaWdodDtcbiAgICBjb25zdCB2ZXJ0aWNhbFNjcm9sbFByZXNlbnQgPVxuICAgICAgY2xpZW50V2lkdGggPCBvZmZzZXRXaWR0aCAmJlxuICAgICAgc2Nyb2xsSGVpZ2h0ID4gb2Zmc2V0SGVpZ2h0ICYmXG4gICAgICBzY3JvbGxIZWlnaHQgLSBvZmZzZXRIZWlnaHQgPCBvZmZzZXRXaWR0aCAtIGNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhvcml6b250YWxTY3JvbGxQcmVzZW50ID1cbiAgICAgIGNsaWVudEhlaWdodCA8IG9mZnNldEhlaWdodCAmJlxuICAgICAgc2Nyb2xsV2lkdGggPiBvZmZzZXRXaWR0aCAmJlxuICAgICAgc2Nyb2xsV2lkdGggLSBvZmZzZXRXaWR0aCA8IG9mZnNldEhlaWdodCAtIGNsaWVudEhlaWdodDtcbiAgICBpZiAodmVydGljYWxTY3JvbGxQcmVzZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAhaG9yaXpvbnRhbFNjcm9sbFByZXNlbnQ7XG4gIH1cblxuICBjaGVja0lmTW9iaWxlKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLiRvcHRpb25zLnVzZUJvZHlGb3JCcmVha3BvaW50KSB7XG4gICAgICByZXR1cm4gdGhpcy4kb3B0aW9ucy5tb2JpbGVCcmVha3BvaW50ID4gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuJG9wdGlvbnMubW9iaWxlQnJlYWtwb2ludCA+IHRoaXMuY3VyV2lkdGg7XG4gICAgfVxuICB9XG5cbiAgc2V0R3JpZFNpemUoKTogdm9pZCB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmVsO1xuICAgIGxldCB3aWR0aDtcbiAgICBsZXQgaGVpZ2h0O1xuICAgIGlmIChcbiAgICAgIHRoaXMuJG9wdGlvbnMuc2V0R3JpZFNpemUgfHxcbiAgICAgICh0aGlzLiRvcHRpb25zLmdyaWRUeXBlID09PSBHcmlkVHlwZS5GaXQgJiYgIXRoaXMubW9iaWxlKVxuICAgICkge1xuICAgICAgd2lkdGggPSBlbC5vZmZzZXRXaWR0aDtcbiAgICAgIGhlaWdodCA9IGVsLm9mZnNldEhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSBlbC5jbGllbnRXaWR0aDtcbiAgICAgIGhlaWdodCA9IGVsLmNsaWVudEhlaWdodDtcbiAgICB9XG4gICAgdGhpcy5jdXJXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuY3VySGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG5cbiAgc2V0R3JpZERpbWVuc2lvbnMoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRHcmlkU2l6ZSgpO1xuICAgIGlmICghdGhpcy5tb2JpbGUgJiYgdGhpcy5jaGVja0lmTW9iaWxlKCkpIHtcbiAgICAgIHRoaXMubW9iaWxlID0gIXRoaXMubW9iaWxlO1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLCAnbW9iaWxlJyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1vYmlsZSAmJiAhdGhpcy5jaGVja0lmTW9iaWxlKCkpIHtcbiAgICAgIHRoaXMubW9iaWxlID0gIXRoaXMubW9iaWxlO1xuICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyh0aGlzLmVsLCAnbW9iaWxlJyk7XG4gICAgfVxuICAgIGxldCByb3dzID0gdGhpcy4kb3B0aW9ucy5taW5Sb3dzO1xuICAgIGxldCBjb2x1bW5zID0gdGhpcy4kb3B0aW9ucy5taW5Db2xzO1xuXG4gICAgbGV0IHdpZGdldHNJbmRleCA9IHRoaXMuZ3JpZC5sZW5ndGggLSAxO1xuICAgIGxldCB3aWRnZXQ7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA+PSAwOyB3aWRnZXRzSW5kZXgtLSkge1xuICAgICAgd2lkZ2V0ID0gdGhpcy5ncmlkW3dpZGdldHNJbmRleF07XG4gICAgICBpZiAoIXdpZGdldC5ub3RQbGFjZWQpIHtcbiAgICAgICAgcm93cyA9IE1hdGgubWF4KHJvd3MsIHdpZGdldC4kaXRlbS55ICsgd2lkZ2V0LiRpdGVtLnJvd3MpO1xuICAgICAgICBjb2x1bW5zID0gTWF0aC5tYXgoY29sdW1ucywgd2lkZ2V0LiRpdGVtLnggKyB3aWRnZXQuJGl0ZW0uY29scyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJvd3MgKz0gdGhpcy4kb3B0aW9ucy5hZGRFbXB0eVJvd3NDb3VudDtcbiAgICBpZiAodGhpcy5jb2x1bW5zICE9PSBjb2x1bW5zIHx8IHRoaXMucm93cyAhPT0gcm93cykge1xuICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcbiAgICAgIHRoaXMucm93cyA9IHJvd3M7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRTaXplQ2hhbmdlZENhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5ncmlkU2l6ZUNoYW5nZWRDYWxsYmFjayh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUxheW91dCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb21wYWN0KSB7XG4gICAgICB0aGlzLmNvbXBhY3QuY2hlY2tDb21wYWN0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRHcmlkRGltZW5zaW9ucygpO1xuICAgIGlmICh0aGlzLiRvcHRpb25zLm91dGVyTWFyZ2luKSB7XG4gICAgICBsZXQgbWFyZ2luV2lkdGggPSAtdGhpcy4kb3B0aW9ucy5tYXJnaW47XG4gICAgICBpZiAodGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgbWFyZ2luV2lkdGggKz0gdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkxlZnQ7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy1sZWZ0JyxcbiAgICAgICAgICB0aGlzLiRvcHRpb25zLm91dGVyTWFyZ2luTGVmdCArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hcmdpbldpZHRoICs9IHRoaXMuJG9wdGlvbnMubWFyZ2luO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgICAgIHRoaXMuZWwsXG4gICAgICAgICAgJ3BhZGRpbmctbGVmdCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5tYXJnaW4gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpblJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgIG1hcmdpbldpZHRoICs9IHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5SaWdodDtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLXJpZ2h0JyxcbiAgICAgICAgICB0aGlzLiRvcHRpb25zLm91dGVyTWFyZ2luUmlnaHQgKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXJnaW5XaWR0aCArPSB0aGlzLiRvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLXJpZ2h0JyxcbiAgICAgICAgICB0aGlzLiRvcHRpb25zLm1hcmdpbiArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY3VyQ29sV2lkdGggPSAodGhpcy5jdXJXaWR0aCAtIG1hcmdpbldpZHRoKSAvIHRoaXMuY29sdW1ucztcbiAgICAgIGxldCBtYXJnaW5IZWlnaHQgPSAtdGhpcy4kb3B0aW9ucy5tYXJnaW47XG4gICAgICBpZiAodGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpblRvcCAhPT0gbnVsbCkge1xuICAgICAgICBtYXJnaW5IZWlnaHQgKz0gdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpblRvcDtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLXRvcCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpblRvcCArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hcmdpbkhlaWdodCArPSB0aGlzLiRvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLXRvcCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5tYXJnaW4gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkJvdHRvbSAhPT0gbnVsbCkge1xuICAgICAgICBtYXJnaW5IZWlnaHQgKz0gdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkJvdHRvbTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLWJvdHRvbScsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkJvdHRvbSArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hcmdpbkhlaWdodCArPSB0aGlzLiRvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLWJvdHRvbScsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5tYXJnaW4gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLmN1clJvd0hlaWdodCA9XG4gICAgICAgICgodGhpcy5jdXJIZWlnaHQgLSBtYXJnaW5IZWlnaHQpIC8gdGhpcy5yb3dzKSAqXG4gICAgICAgIHRoaXMuJG9wdGlvbnMucm93SGVpZ2h0UmF0aW87XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY3VyQ29sV2lkdGggPSAodGhpcy5jdXJXaWR0aCArIHRoaXMuJG9wdGlvbnMubWFyZ2luKSAvIHRoaXMuY29sdW1ucztcbiAgICAgIHRoaXMuY3VyUm93SGVpZ2h0ID1cbiAgICAgICAgKCh0aGlzLmN1ckhlaWdodCArIHRoaXMuJG9wdGlvbnMubWFyZ2luKSAvIHRoaXMucm93cykgKlxuICAgICAgICB0aGlzLiRvcHRpb25zLnJvd0hlaWdodFJhdGlvO1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAncGFkZGluZy1sZWZ0JywgMCArICdweCcpO1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAncGFkZGluZy1yaWdodCcsIDAgKyAncHgnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3BhZGRpbmctdG9wJywgMCArICdweCcpO1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAncGFkZGluZy1ib3R0b20nLCAwICsgJ3B4Jyk7XG4gICAgfVxuICAgIHRoaXMuZ3JpZFJlbmRlcmVyLnVwZGF0ZUdyaWRzdGVyKCk7XG5cbiAgICBpZiAodGhpcy4kb3B0aW9ucy5zZXRHcmlkU2l6ZSkge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLCAnZ3JpZFNpemUnKTtcbiAgICAgIGlmICghdGhpcy5tb2JpbGUpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICd3aWR0aCcsXG4gICAgICAgICAgdGhpcy5jb2x1bW5zICogdGhpcy5jdXJDb2xXaWR0aCArIHRoaXMuJG9wdGlvbnMubWFyZ2luICsgJ3B4J1xuICAgICAgICApO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgICAgIHRoaXMuZWwsXG4gICAgICAgICAgJ2hlaWdodCcsXG4gICAgICAgICAgdGhpcy5yb3dzICogdGhpcy5jdXJSb3dIZWlnaHQgKyB0aGlzLiRvcHRpb25zLm1hcmdpbiArICdweCdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyh0aGlzLmVsLCAnZ3JpZFNpemUnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3dpZHRoJywgJycpO1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAnaGVpZ2h0JywgJycpO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcblxuICAgIGxldCB3aWRnZXRzSW5kZXg6IG51bWJlciA9IHRoaXMuZ3JpZC5sZW5ndGggLSAxO1xuICAgIGxldCB3aWRnZXQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgICBmb3IgKDsgd2lkZ2V0c0luZGV4ID49IDA7IHdpZGdldHNJbmRleC0tKSB7XG4gICAgICB3aWRnZXQgPSB0aGlzLmdyaWRbd2lkZ2V0c0luZGV4XTtcbiAgICAgIHdpZGdldC5zZXRTaXplKCk7XG4gICAgICB3aWRnZXQuZHJhZy50b2dnbGUoKTtcbiAgICAgIHdpZGdldC5yZXNpemUudG9nZ2xlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZXNpemUkLm5leHQoKTtcbiAgfVxuXG4gIHVwZGF0ZUdyaWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuJG9wdGlvbnMuZGlzcGxheUdyaWQgPT09ICdhbHdheXMnICYmICF0aGlzLm1vYmlsZSkge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLCAnZGlzcGxheS1ncmlkJyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuJG9wdGlvbnMuZGlzcGxheUdyaWQgPT09ICdvbkRyYWcmUmVzaXplJyAmJlxuICAgICAgdGhpcy5kcmFnSW5Qcm9ncmVzc1xuICAgICkge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVsLCAnZGlzcGxheS1ncmlkJyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuJG9wdGlvbnMuZGlzcGxheUdyaWQgPT09ICdub25lJyB8fFxuICAgICAgIXRoaXMuZHJhZ0luUHJvZ3Jlc3MgfHxcbiAgICAgIHRoaXMubW9iaWxlXG4gICAgKSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKHRoaXMuZWwsICdkaXNwbGF5LWdyaWQnKTtcbiAgICB9XG4gICAgdGhpcy5zZXRHcmlkRGltZW5zaW9ucygpO1xuICAgIHRoaXMuZ3JpZENvbHVtbnMubGVuZ3RoID0gR3JpZHN0ZXJDb21wb25lbnQuZ2V0TmV3QXJyYXlMZW5ndGgoXG4gICAgICB0aGlzLmNvbHVtbnMsXG4gICAgICB0aGlzLmN1cldpZHRoLFxuICAgICAgdGhpcy5jdXJDb2xXaWR0aFxuICAgICk7XG4gICAgdGhpcy5ncmlkUm93cy5sZW5ndGggPSBHcmlkc3RlckNvbXBvbmVudC5nZXROZXdBcnJheUxlbmd0aChcbiAgICAgIHRoaXMucm93cyxcbiAgICAgIHRoaXMuY3VySGVpZ2h0LFxuICAgICAgdGhpcy5jdXJSb3dIZWlnaHRcbiAgICApO1xuICAgIHRoaXMuY2RSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICBhZGRJdGVtKGl0ZW1Db21wb25lbnQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSk6IHZvaWQge1xuICAgIGlmIChpdGVtQ29tcG9uZW50LiRpdGVtLmNvbHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaXRlbUNvbXBvbmVudC4kaXRlbS5jb2xzID0gdGhpcy4kb3B0aW9ucy5kZWZhdWx0SXRlbUNvbHM7XG4gICAgICBpdGVtQ29tcG9uZW50Lml0ZW0uY29scyA9IGl0ZW1Db21wb25lbnQuJGl0ZW0uY29scztcbiAgICAgIGl0ZW1Db21wb25lbnQuaXRlbUNoYW5nZWQoKTtcbiAgICB9XG4gICAgaWYgKGl0ZW1Db21wb25lbnQuJGl0ZW0ucm93cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpdGVtQ29tcG9uZW50LiRpdGVtLnJvd3MgPSB0aGlzLiRvcHRpb25zLmRlZmF1bHRJdGVtUm93cztcbiAgICAgIGl0ZW1Db21wb25lbnQuaXRlbS5yb3dzID0gaXRlbUNvbXBvbmVudC4kaXRlbS5yb3dzO1xuICAgICAgaXRlbUNvbXBvbmVudC5pdGVtQ2hhbmdlZCgpO1xuICAgIH1cbiAgICBpZiAoaXRlbUNvbXBvbmVudC4kaXRlbS54ID09PSAtMSB8fCBpdGVtQ29tcG9uZW50LiRpdGVtLnkgPT09IC0xKSB7XG4gICAgICB0aGlzLmF1dG9Qb3NpdGlvbkl0ZW0oaXRlbUNvbXBvbmVudCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNoZWNrQ29sbGlzaW9uKGl0ZW1Db21wb25lbnQuJGl0ZW0pKSB7XG4gICAgICBpZiAoIXRoaXMuJG9wdGlvbnMuZGlzYWJsZVdhcm5pbmdzKSB7XG4gICAgICAgIGl0ZW1Db21wb25lbnQubm90UGxhY2VkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIFwiQ2FuJ3QgYmUgcGxhY2VkIGluIHRoZSBib3VuZHMgb2YgdGhlIGRhc2hib2FyZCwgdHJ5aW5nIHRvIGF1dG8gcG9zaXRpb24hL25cIiArXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShpdGVtQ29tcG9uZW50Lml0ZW0sIFsnY29scycsICdyb3dzJywgJ3gnLCAneSddKVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLiRvcHRpb25zLmRpc2FibGVBdXRvUG9zaXRpb25PbkNvbmZsaWN0KSB7XG4gICAgICAgIHRoaXMuYXV0b1Bvc2l0aW9uSXRlbShpdGVtQ29tcG9uZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1Db21wb25lbnQubm90UGxhY2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ncmlkLnB1c2goaXRlbUNvbXBvbmVudCk7XG4gICAgdGhpcy5jYWxjdWxhdGVMYXlvdXQkLm5leHQoKTtcbiAgfVxuXG4gIHJlbW92ZUl0ZW0oaXRlbUNvbXBvbmVudDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkLnNwbGljZSh0aGlzLmdyaWQuaW5kZXhPZihpdGVtQ29tcG9uZW50KSwgMSk7XG4gICAgdGhpcy5jYWxjdWxhdGVMYXlvdXQkLm5leHQoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLml0ZW1SZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pdGVtUmVtb3ZlZENhbGxiYWNrKGl0ZW1Db21wb25lbnQuaXRlbSwgaXRlbUNvbXBvbmVudCk7XG4gICAgfVxuICB9XG5cbiAgY2hlY2tDb2xsaXNpb24oaXRlbTogR3JpZHN0ZXJJdGVtKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiB7XG4gICAgbGV0IGNvbGxpc2lvbjogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiA9IGZhbHNlO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaXRlbVZhbGlkYXRlQ2FsbGJhY2spIHtcbiAgICAgIGNvbGxpc2lvbiA9ICF0aGlzLm9wdGlvbnMuaXRlbVZhbGlkYXRlQ2FsbGJhY2soaXRlbSk7XG4gICAgfVxuICAgIGlmICghY29sbGlzaW9uICYmIHRoaXMuY2hlY2tHcmlkQ29sbGlzaW9uKGl0ZW0pKSB7XG4gICAgICBjb2xsaXNpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoIWNvbGxpc2lvbikge1xuICAgICAgY29uc3QgYyA9IHRoaXMuZmluZEl0ZW1XaXRoSXRlbShpdGVtKTtcbiAgICAgIGlmIChjKSB7XG4gICAgICAgIGNvbGxpc2lvbiA9IGM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb2xsaXNpb247XG4gIH1cblxuICBjaGVja0dyaWRDb2xsaXNpb24oaXRlbTogR3JpZHN0ZXJJdGVtKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgbm9OZWdhdGl2ZVBvc2l0aW9uID0gaXRlbS55ID4gLTEgJiYgaXRlbS54ID4gLTE7XG4gICAgY29uc3QgbWF4R3JpZENvbHMgPSBpdGVtLmNvbHMgKyBpdGVtLnggPD0gdGhpcy4kb3B0aW9ucy5tYXhDb2xzO1xuICAgIGNvbnN0IG1heEdyaWRSb3dzID0gaXRlbS5yb3dzICsgaXRlbS55IDw9IHRoaXMuJG9wdGlvbnMubWF4Um93cztcbiAgICBjb25zdCBtYXhJdGVtQ29scyA9XG4gICAgICBpdGVtLm1heEl0ZW1Db2xzID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1heEl0ZW1Db2xzXG4gICAgICAgIDogaXRlbS5tYXhJdGVtQ29scztcbiAgICBjb25zdCBtaW5JdGVtQ29scyA9XG4gICAgICBpdGVtLm1pbkl0ZW1Db2xzID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1pbkl0ZW1Db2xzXG4gICAgICAgIDogaXRlbS5taW5JdGVtQ29scztcbiAgICBjb25zdCBtYXhJdGVtUm93cyA9XG4gICAgICBpdGVtLm1heEl0ZW1Sb3dzID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1heEl0ZW1Sb3dzXG4gICAgICAgIDogaXRlbS5tYXhJdGVtUm93cztcbiAgICBjb25zdCBtaW5JdGVtUm93cyA9XG4gICAgICBpdGVtLm1pbkl0ZW1Sb3dzID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1pbkl0ZW1Sb3dzXG4gICAgICAgIDogaXRlbS5taW5JdGVtUm93cztcbiAgICBjb25zdCBpbkNvbHNMaW1pdHMgPSBpdGVtLmNvbHMgPD0gbWF4SXRlbUNvbHMgJiYgaXRlbS5jb2xzID49IG1pbkl0ZW1Db2xzO1xuICAgIGNvbnN0IGluUm93c0xpbWl0cyA9IGl0ZW0ucm93cyA8PSBtYXhJdGVtUm93cyAmJiBpdGVtLnJvd3MgPj0gbWluSXRlbVJvd3M7XG4gICAgY29uc3QgbWluQXJlYUxpbWl0ID1cbiAgICAgIGl0ZW0ubWluSXRlbUFyZWEgPT09IHVuZGVmaW5lZFxuICAgICAgICA/IHRoaXMuJG9wdGlvbnMubWluSXRlbUFyZWFcbiAgICAgICAgOiBpdGVtLm1pbkl0ZW1BcmVhO1xuICAgIGNvbnN0IG1heEFyZWFMaW1pdCA9XG4gICAgICBpdGVtLm1heEl0ZW1BcmVhID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1heEl0ZW1BcmVhXG4gICAgICAgIDogaXRlbS5tYXhJdGVtQXJlYTtcbiAgICBjb25zdCBhcmVhID0gaXRlbS5jb2xzICogaXRlbS5yb3dzO1xuICAgIGNvbnN0IGluTWluQXJlYSA9IG1pbkFyZWFMaW1pdCA8PSBhcmVhO1xuICAgIGNvbnN0IGluTWF4QXJlYSA9IG1heEFyZWFMaW1pdCA+PSBhcmVhO1xuICAgIHJldHVybiAhKFxuICAgICAgbm9OZWdhdGl2ZVBvc2l0aW9uICYmXG4gICAgICBtYXhHcmlkQ29scyAmJlxuICAgICAgbWF4R3JpZFJvd3MgJiZcbiAgICAgIGluQ29sc0xpbWl0cyAmJlxuICAgICAgaW5Sb3dzTGltaXRzICYmXG4gICAgICBpbk1pbkFyZWEgJiZcbiAgICAgIGluTWF4QXJlYVxuICAgICk7XG4gIH1cblxuICBmaW5kSXRlbVdpdGhJdGVtKFxuICAgIGl0ZW06IEdyaWRzdGVySXRlbVxuICApOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfCBib29sZWFuIHtcbiAgICBsZXQgd2lkZ2V0c0luZGV4ID0gMDtcbiAgICBsZXQgd2lkZ2V0OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA8IHRoaXMuZ3JpZC5sZW5ndGg7IHdpZGdldHNJbmRleCsrKSB7XG4gICAgICB3aWRnZXQgPSB0aGlzLmdyaWRbd2lkZ2V0c0luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgd2lkZ2V0LiRpdGVtICE9PSBpdGVtICYmXG4gICAgICAgIHRoaXMuY2hlY2tDb2xsaXNpb25Ud29JdGVtcyh3aWRnZXQuJGl0ZW0sIGl0ZW0pXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHdpZGdldDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZmluZEl0ZW1zV2l0aEl0ZW0oaXRlbTogR3JpZHN0ZXJJdGVtKTogQXJyYXk8R3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlPiB7XG4gICAgY29uc3QgYTogQXJyYXk8R3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlPiA9IFtdO1xuICAgIGxldCB3aWRnZXRzSW5kZXggPSAwO1xuICAgIGxldCB3aWRnZXQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgICBmb3IgKDsgd2lkZ2V0c0luZGV4IDwgdGhpcy5ncmlkLmxlbmd0aDsgd2lkZ2V0c0luZGV4KyspIHtcbiAgICAgIHdpZGdldCA9IHRoaXMuZ3JpZFt3aWRnZXRzSW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICB3aWRnZXQuJGl0ZW0gIT09IGl0ZW0gJiZcbiAgICAgICAgdGhpcy5jaGVja0NvbGxpc2lvblR3b0l0ZW1zKHdpZGdldC4kaXRlbSwgaXRlbSlcbiAgICAgICkge1xuICAgICAgICBhLnB1c2god2lkZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICBhdXRvUG9zaXRpb25JdGVtKGl0ZW1Db21wb25lbnQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmdldE5leHRQb3NzaWJsZVBvc2l0aW9uKGl0ZW1Db21wb25lbnQuJGl0ZW0pKSB7XG4gICAgICBpdGVtQ29tcG9uZW50Lm5vdFBsYWNlZCA9IGZhbHNlO1xuICAgICAgaXRlbUNvbXBvbmVudC5pdGVtLnggPSBpdGVtQ29tcG9uZW50LiRpdGVtLng7XG4gICAgICBpdGVtQ29tcG9uZW50Lml0ZW0ueSA9IGl0ZW1Db21wb25lbnQuJGl0ZW0ueTtcbiAgICAgIGl0ZW1Db21wb25lbnQuaXRlbUNoYW5nZWQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXRlbUNvbXBvbmVudC5ub3RQbGFjZWQgPSB0cnVlO1xuICAgICAgaWYgKCF0aGlzLiRvcHRpb25zLmRpc2FibGVXYXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgXCJDYW4ndCBiZSBwbGFjZWQgaW4gdGhlIGJvdW5kcyBvZiB0aGUgZGFzaGJvYXJkIS9uXCIgK1xuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoaXRlbUNvbXBvbmVudC5pdGVtLCBbJ2NvbHMnLCAncm93cycsICd4JywgJ3knXSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXROZXh0UG9zc2libGVQb3NpdGlvbiA9IChcbiAgICBuZXdJdGVtOiBHcmlkc3Rlckl0ZW0sXG4gICAgc3RhcnRpbmdGcm9tOiB7IHk/OiBudW1iZXI7IHg/OiBudW1iZXIgfSA9IHt9XG4gICk6IGJvb2xlYW4gPT4ge1xuICAgIGlmIChuZXdJdGVtLmNvbHMgPT09IC0xKSB7XG4gICAgICBuZXdJdGVtLmNvbHMgPSB0aGlzLiRvcHRpb25zLmRlZmF1bHRJdGVtQ29scztcbiAgICB9XG4gICAgaWYgKG5ld0l0ZW0ucm93cyA9PT0gLTEpIHtcbiAgICAgIG5ld0l0ZW0ucm93cyA9IHRoaXMuJG9wdGlvbnMuZGVmYXVsdEl0ZW1Sb3dzO1xuICAgIH1cbiAgICB0aGlzLnNldEdyaWREaW1lbnNpb25zKCk7XG4gICAgbGV0IHJvd3NJbmRleCA9IHN0YXJ0aW5nRnJvbS55IHx8IDA7XG4gICAgbGV0IGNvbHNJbmRleDtcbiAgICBmb3IgKDsgcm93c0luZGV4IDwgdGhpcy5yb3dzOyByb3dzSW5kZXgrKykge1xuICAgICAgbmV3SXRlbS55ID0gcm93c0luZGV4O1xuICAgICAgY29sc0luZGV4ID0gc3RhcnRpbmdGcm9tLnggfHwgMDtcbiAgICAgIGZvciAoOyBjb2xzSW5kZXggPCB0aGlzLmNvbHVtbnM7IGNvbHNJbmRleCsrKSB7XG4gICAgICAgIG5ld0l0ZW0ueCA9IGNvbHNJbmRleDtcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrQ29sbGlzaW9uKG5ld0l0ZW0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY2FuQWRkVG9Sb3dzID0gdGhpcy4kb3B0aW9ucy5tYXhSb3dzID49IHRoaXMucm93cyArIG5ld0l0ZW0ucm93cztcbiAgICBjb25zdCBjYW5BZGRUb0NvbHVtbnMgPVxuICAgICAgdGhpcy4kb3B0aW9ucy5tYXhDb2xzID49IHRoaXMuY29sdW1ucyArIG5ld0l0ZW0uY29scztcbiAgICBjb25zdCBhZGRUb1Jvd3MgPSB0aGlzLnJvd3MgPD0gdGhpcy5jb2x1bW5zICYmIGNhbkFkZFRvUm93cztcbiAgICBpZiAoIWFkZFRvUm93cyAmJiBjYW5BZGRUb0NvbHVtbnMpIHtcbiAgICAgIG5ld0l0ZW0ueCA9IHRoaXMuY29sdW1ucztcbiAgICAgIG5ld0l0ZW0ueSA9IDA7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGNhbkFkZFRvUm93cykge1xuICAgICAgbmV3SXRlbS55ID0gdGhpcy5yb3dzO1xuICAgICAgbmV3SXRlbS54ID0gMDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgZ2V0Rmlyc3RQb3NzaWJsZVBvc2l0aW9uID0gKGl0ZW06IEdyaWRzdGVySXRlbSk6IEdyaWRzdGVySXRlbSA9PiB7XG4gICAgY29uc3QgdG1wSXRlbSA9IE9iamVjdC5hc3NpZ24oe30sIGl0ZW0pO1xuICAgIHRoaXMuZ2V0TmV4dFBvc3NpYmxlUG9zaXRpb24odG1wSXRlbSk7XG4gICAgcmV0dXJuIHRtcEl0ZW07XG4gIH07XG5cbiAgZ2V0TGFzdFBvc3NpYmxlUG9zaXRpb24gPSAoaXRlbTogR3JpZHN0ZXJJdGVtKTogR3JpZHN0ZXJJdGVtID0+IHtcbiAgICBsZXQgZmFydGhlc3RJdGVtOiB7IHk6IG51bWJlcjsgeDogbnVtYmVyIH0gPSB7IHk6IDAsIHg6IDAgfTtcbiAgICBmYXJ0aGVzdEl0ZW0gPSB0aGlzLmdyaWQucmVkdWNlKFxuICAgICAgKFxuICAgICAgICBwcmV2OiB7IHk6IG51bWJlcjsgeDogbnVtYmVyIH0sXG4gICAgICAgIGN1cnI6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVxuICAgICAgKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJDb29yZHMgPSB7XG4gICAgICAgICAgeTogY3Vyci4kaXRlbS55ICsgY3Vyci4kaXRlbS5yb3dzIC0gMSxcbiAgICAgICAgICB4OiBjdXJyLiRpdGVtLnggKyBjdXJyLiRpdGVtLmNvbHMgLSAxXG4gICAgICAgIH07XG4gICAgICAgIGlmIChHcmlkc3RlclV0aWxzLmNvbXBhcmVJdGVtcyhwcmV2LCBjdXJyQ29vcmRzKSA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiBjdXJyQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFydGhlc3RJdGVtXG4gICAgKTtcblxuICAgIGNvbnN0IHRtcEl0ZW0gPSBPYmplY3QuYXNzaWduKHt9LCBpdGVtKTtcbiAgICB0aGlzLmdldE5leHRQb3NzaWJsZVBvc2l0aW9uKHRtcEl0ZW0sIGZhcnRoZXN0SXRlbSk7XG4gICAgcmV0dXJuIHRtcEl0ZW07XG4gIH07XG5cbiAgcGl4ZWxzVG9Qb3NpdGlvblgoXG4gICAgeDogbnVtYmVyLFxuICAgIHJvdW5kaW5nTWV0aG9kOiAoeDogbnVtYmVyKSA9PiBudW1iZXIsXG4gICAgbm9MaW1pdD86IGJvb2xlYW5cbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHJvdW5kaW5nTWV0aG9kKHggLyB0aGlzLmN1ckNvbFdpZHRoKTtcbiAgICBpZiAobm9MaW1pdCkge1xuICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXgocG9zaXRpb24sIDApO1xuICAgIH1cbiAgfVxuXG4gIHBpeGVsc1RvUG9zaXRpb25ZKFxuICAgIHk6IG51bWJlcixcbiAgICByb3VuZGluZ01ldGhvZDogKHg6IG51bWJlcikgPT4gbnVtYmVyLFxuICAgIG5vTGltaXQ/OiBib29sZWFuXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgcG9zaXRpb24gPSByb3VuZGluZ01ldGhvZCh5IC8gdGhpcy5jdXJSb3dIZWlnaHQpO1xuICAgIGlmIChub0xpbWl0KSB7XG4gICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBNYXRoLm1heChwb3NpdGlvbiwgMCk7XG4gICAgfVxuICB9XG5cbiAgcG9zaXRpb25YVG9QaXhlbHMoeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4geCAqIHRoaXMuY3VyQ29sV2lkdGg7XG4gIH1cblxuICBwb3NpdGlvbllUb1BpeGVscyh5OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiB5ICogdGhpcy5jdXJSb3dIZWlnaHQ7XG4gIH1cblxuICBnZXRJdGVtQ29tcG9uZW50KFxuICAgIGl0ZW06IEdyaWRzdGVySXRlbVxuICApOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdyaWQuZmluZChjID0+IGMuaXRlbSA9PT0gaXRlbSk7XG4gIH1cblxuICAvLyAtLS0tLS0gRnVuY3Rpb25zIGZvciBzd2FwV2hpbGVEcmFnZ2luZyBvcHRpb25cblxuICAvLyBpZGVudGljYWwgdG8gY2hlY2tDb2xsaXNpb24oKSBleGNlcHQgdGhhdCB0aGlzIGZ1bmN0aW9uIGNhbGxzIGZpbmRJdGVtV2l0aEl0ZW1Gb3JTd2FwaW5nKCkgaW5zdGVhZCBvZiBmaW5kSXRlbVdpdGhJdGVtKClcbiAgY2hlY2tDb2xsaXNpb25Gb3JTd2FwaW5nKFxuICAgIGl0ZW06IEdyaWRzdGVySXRlbVxuICApOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfCBib29sZWFuIHtcbiAgICBsZXQgY29sbGlzaW9uOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfCBib29sZWFuID0gZmFsc2U7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pdGVtVmFsaWRhdGVDYWxsYmFjaykge1xuICAgICAgY29sbGlzaW9uID0gIXRoaXMub3B0aW9ucy5pdGVtVmFsaWRhdGVDYWxsYmFjayhpdGVtKTtcbiAgICB9XG4gICAgaWYgKCFjb2xsaXNpb24gJiYgdGhpcy5jaGVja0dyaWRDb2xsaXNpb24oaXRlbSkpIHtcbiAgICAgIGNvbGxpc2lvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmICghY29sbGlzaW9uKSB7XG4gICAgICBjb25zdCBjID0gdGhpcy5maW5kSXRlbVdpdGhJdGVtRm9yU3dhcHBpbmcoaXRlbSk7XG4gICAgICBpZiAoYykge1xuICAgICAgICBjb2xsaXNpb24gPSBjO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sbGlzaW9uO1xuICB9XG5cbiAgLy8gaWRlbnRpY2FsIHRvIGZpbmRJdGVtV2l0aEl0ZW0oKSBleGNlcHQgdGhhdCB0aGlzIGZ1bmN0aW9uIGNhbGxzIGNoZWNrQ29sbGlzaW9uVHdvSXRlbXNGb3JTd2FwaW5nKCkgaW5zdGVhZCBvZiBjaGVja0NvbGxpc2lvblR3b0l0ZW1zKClcbiAgZmluZEl0ZW1XaXRoSXRlbUZvclN3YXBwaW5nKFxuICAgIGl0ZW06IEdyaWRzdGVySXRlbVxuICApOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UgfCBib29sZWFuIHtcbiAgICBsZXQgd2lkZ2V0c0luZGV4OiBudW1iZXIgPSB0aGlzLmdyaWQubGVuZ3RoIC0gMTtcbiAgICBsZXQgd2lkZ2V0OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA+IC0xOyB3aWRnZXRzSW5kZXgtLSkge1xuICAgICAgd2lkZ2V0ID0gdGhpcy5ncmlkW3dpZGdldHNJbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIHdpZGdldC4kaXRlbSAhPT0gaXRlbSAmJlxuICAgICAgICBHcmlkc3RlckNvbXBvbmVudC5jaGVja0NvbGxpc2lvblR3b0l0ZW1zRm9yU3dhcGluZyh3aWRnZXQuJGl0ZW0sIGl0ZW0pXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHdpZGdldDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJldmlld1N0eWxlKGRyYWcgPSBmYWxzZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLm1vdmluZ0l0ZW0pIHtcbiAgICAgIGlmICh0aGlzLmNvbXBhY3QgJiYgZHJhZykge1xuICAgICAgICB0aGlzLmNvbXBhY3QuY2hlY2tDb21wYWN0SXRlbSh0aGlzLm1vdmluZ0l0ZW0pO1xuICAgICAgfVxuICAgICAgdGhpcy5wcmV2aWV3U3R5bGUkLm5leHQodGhpcy5tb3ZpbmdJdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcmV2aWV3U3R5bGUkLm5leHQobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gLS0tLS0tIEVuZCBvZiBmdW5jdGlvbnMgZm9yIHN3YXBXaGlsZURyYWdnaW5nIG9wdGlvblxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbWVtYmVyLW9yZGVyaW5nXG4gIHByaXZhdGUgc3RhdGljIGdldE5ld0FycmF5TGVuZ3RoKFxuICAgIGxlbmd0aDogbnVtYmVyLFxuICAgIG92ZXJhbGxTaXplOiBudW1iZXIsXG4gICAgc2l6ZTogbnVtYmVyXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgbmV3TGVuZ3RoID0gTWF0aC5tYXgobGVuZ3RoLCBNYXRoLmZsb29yKG92ZXJhbGxTaXplIC8gc2l6ZSkpO1xuXG4gICAgaWYgKG5ld0xlbmd0aCA8IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobmV3TGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIE1hdGguZmxvb3IobmV3TGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxufVxuIiwiPGRpdlxuICBjbGFzcz1cImdyaWRzdGVyLWNvbHVtblwiXG4gICpuZ0Zvcj1cImxldCBjb2x1bW4gb2YgZ3JpZENvbHVtbnM7IGxldCBpID0gaW5kZXg7XCJcbiAgW25nU3R5bGVdPVwiZ3JpZFJlbmRlcmVyLmdldEdyaWRDb2x1bW5TdHlsZShpKVwiXG4+PC9kaXY+XG48ZGl2XG4gIGNsYXNzPVwiZ3JpZHN0ZXItcm93XCJcbiAgKm5nRm9yPVwibGV0IHJvdyBvZiBncmlkUm93czsgbGV0IGkgPSBpbmRleDtcIlxuICBbbmdTdHlsZV09XCJncmlkUmVuZGVyZXIuZ2V0R3JpZFJvd1N0eWxlKGkpXCJcbj48L2Rpdj5cbjxuZy1jb250ZW50PjwvbmctY29udGVudD5cbjxncmlkc3Rlci1wcmV2aWV3XG4gIFtncmlkUmVuZGVyZXJdPVwiZ3JpZFJlbmRlcmVyXCJcbiAgW3ByZXZpZXdTdHlsZSRdPVwicHJldmlld1N0eWxlJFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItcHJldmlld1wiXG4+PC9ncmlkc3Rlci1wcmV2aWV3PlxuIl19