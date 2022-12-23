import { NgForOf, NgStyle } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, NgZone, Renderer2, ViewEncapsulation } from '@angular/core';
import { debounceTime, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { GridsterCompact } from './gridsterCompact.service';
import { GridsterConfigService } from './gridsterConfig.constant';
import { GridType } from './gridsterConfig.interface';
import { GridsterEmptyCell } from './gridsterEmptyCell.service';
import { GridsterPreviewComponent } from './gridsterPreview.component';
import { GridsterRenderer } from './gridsterRenderer.service';
import { GridsterUtils } from './gridsterUtils.service';
import * as i0 from "@angular/core";
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
GridsterComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterComponent, deps: [{ token: ElementRef }, { token: Renderer2 }, { token: ChangeDetectorRef }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterComponent, isStandalone: true, selector: "gridster", inputs: { options: "options" }, usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"], dependencies: [{ kind: "directive", type: NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: GridsterPreviewComponent, selector: "gridster-preview", inputs: ["previewStyle$", "gridRenderer"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster', encapsulation: ViewEncapsulation.None, standalone: true, imports: [NgForOf, NgStyle, GridsterPreviewComponent], template: "<div\n  class=\"gridster-column\"\n  *ngFor=\"let column of gridColumns; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridColumnStyle(i)\"\n></div>\n<div\n  class=\"gridster-row\"\n  *ngFor=\"let row of gridRows; let i = index;\"\n  [ngStyle]=\"gridRenderer.getGridRowStyle(i)\"\n></div>\n<ng-content></ng-content>\n<gridster-preview\n  [gridRenderer]=\"gridRenderer\"\n  [previewStyle$]=\"previewStyle$\"\n  class=\"gridster-preview\"\n></gridster-preview>\n", styles: ["gridster{position:relative;box-sizing:border-box;background:grey;width:100%;height:100%;-webkit-user-select:none;user-select:none;display:block}gridster.fit{overflow-x:hidden;overflow-y:hidden}gridster.scrollVertical{overflow-x:hidden;overflow-y:auto}gridster.scrollHorizontal{overflow-x:auto;overflow-y:hidden}gridster.fixed{overflow:auto}gridster.mobile{overflow-x:hidden;overflow-y:auto}gridster.mobile gridster-item{position:relative}gridster.gridSize{height:initial;width:initial}gridster.gridSize.fit{height:100%;width:100%}gridster .gridster-column,gridster .gridster-row{position:absolute;display:none;transition:.3s;box-sizing:border-box}gridster.display-grid .gridster-column,gridster.display-grid .gridster-row{display:block}gridster .gridster-column{border-left:1px solid white;border-right:1px solid white}gridster .gridster-row{border-top:1px solid white;border-bottom:1px solid white}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1ncmlkc3RlcjIvc3JjL2xpYi9ncmlkc3Rlci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWdyaWRzdGVyMi9zcmMvbGliL2dyaWRzdGVyLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUlOLFNBQVMsRUFFVCxpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFFMUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRTVELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ2xFLE9BQU8sRUFBa0IsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFdEUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFLaEUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDdkUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDOUQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHlCQUF5QixDQUFDOztBQVd4RCxNQUFNLE9BQU8saUJBQWlCO0lBOEI1QixZQUNzQixFQUFjLEVBQ1IsUUFBbUIsRUFDWCxLQUF3QixFQUNuQyxJQUFZO1FBRlQsYUFBUSxHQUFSLFFBQVEsQ0FBVztR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LCBOZ1N0eWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBSZW5kZXJlcjIsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZGVib3VuY2VUaW1lLCBTdWJqZWN0LCBzd2l0Y2hNYXAsIHRha2VVbnRpbCwgdGltZXIgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcG9uZW50SW50ZXJmYWNlIH0gZnJvbSAnLi9ncmlkc3Rlci5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJDb21wYWN0IH0gZnJvbSAnLi9ncmlkc3RlckNvbXBhY3Quc2VydmljZSc7XG5cbmltcG9ydCB7IEdyaWRzdGVyQ29uZmlnU2VydmljZSB9IGZyb20gJy4vZ3JpZHN0ZXJDb25maWcuY29uc3RhbnQnO1xuaW1wb3J0IHsgR3JpZHN0ZXJDb25maWcsIEdyaWRUeXBlIH0gZnJvbSAnLi9ncmlkc3RlckNvbmZpZy5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJDb25maWdTIH0gZnJvbSAnLi9ncmlkc3RlckNvbmZpZ1MuaW50ZXJmYWNlJztcbmltcG9ydCB7IEdyaWRzdGVyRW1wdHlDZWxsIH0gZnJvbSAnLi9ncmlkc3RlckVtcHR5Q2VsbC5zZXJ2aWNlJztcbmltcG9ydCB7XG4gIEdyaWRzdGVySXRlbSxcbiAgR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlXG59IGZyb20gJy4vZ3JpZHN0ZXJJdGVtLmludGVyZmFjZSc7XG5pbXBvcnQgeyBHcmlkc3RlclByZXZpZXdDb21wb25lbnQgfSBmcm9tICcuL2dyaWRzdGVyUHJldmlldy5jb21wb25lbnQnO1xuaW1wb3J0IHsgR3JpZHN0ZXJSZW5kZXJlciB9IGZyb20gJy4vZ3JpZHN0ZXJSZW5kZXJlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyVXRpbHMgfSBmcm9tICcuL2dyaWRzdGVyVXRpbHMuc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2NvbXBvbmVudC1zZWxlY3RvclxuICBzZWxlY3RvcjogJ2dyaWRzdGVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2dyaWRzdGVyLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9ncmlkc3Rlci5jc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaW1wb3J0czogW05nRm9yT2YsIE5nU3R5bGUsIEdyaWRzdGVyUHJldmlld0NvbXBvbmVudF1cbn0pXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJDb21wb25lbnRcbiAgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBHcmlkc3RlckNvbXBvbmVudEludGVyZmFjZVxue1xuICBASW5wdXQoKSBvcHRpb25zOiBHcmlkc3RlckNvbmZpZztcbiAgbW92aW5nSXRlbTogR3JpZHN0ZXJJdGVtIHwgbnVsbDtcbiAgZWw6IEhUTUxFbGVtZW50O1xuICAkb3B0aW9uczogR3JpZHN0ZXJDb25maWdTO1xuICBtb2JpbGU6IGJvb2xlYW47XG4gIGN1cldpZHRoOiBudW1iZXI7XG4gIGN1ckhlaWdodDogbnVtYmVyO1xuICBncmlkOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2VbXTtcbiAgY29sdW1ucyA9IDA7XG4gIHJvd3MgPSAwO1xuICBjdXJDb2xXaWR0aDogbnVtYmVyO1xuICBjdXJSb3dIZWlnaHQ6IG51bWJlcjtcbiAgZ3JpZENvbHVtbnMgPSBbXTtcbiAgZ3JpZFJvd3MgPSBbXTtcbiAgd2luZG93UmVzaXplOiAoKCkgPT4gdm9pZCkgfCBudWxsO1xuICBkcmFnSW5Qcm9ncmVzczogYm9vbGVhbjtcbiAgZW1wdHlDZWxsOiBHcmlkc3RlckVtcHR5Q2VsbDtcbiAgY29tcGFjdDogR3JpZHN0ZXJDb21wYWN0O1xuICBncmlkUmVuZGVyZXI6IEdyaWRzdGVyUmVuZGVyZXI7XG4gIHByZXZpZXdTdHlsZSQ6IEV2ZW50RW1pdHRlcjxHcmlkc3Rlckl0ZW0gfCBudWxsPiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxHcmlkc3Rlckl0ZW0gfCBudWxsPigpO1xuXG4gIGNhbGN1bGF0ZUxheW91dCQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgcmVzaXplJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgZGVzdHJveSQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRWxlbWVudFJlZikgZWw6IEVsZW1lbnRSZWYsXG4gICAgQEluamVjdChSZW5kZXJlcjIpIHB1YmxpYyByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIEBJbmplY3QoQ2hhbmdlRGV0ZWN0b3JSZWYpIHB1YmxpYyBjZFJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgQEluamVjdChOZ1pvbmUpIHB1YmxpYyB6b25lOiBOZ1pvbmVcbiAgKSB7XG4gICAgdGhpcy5lbCA9IGVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy4kb3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoR3JpZHN0ZXJDb25maWdTZXJ2aWNlKSk7XG4gICAgdGhpcy5tb2JpbGUgPSBmYWxzZTtcbiAgICB0aGlzLmN1cldpZHRoID0gMDtcbiAgICB0aGlzLmN1ckhlaWdodCA9IDA7XG4gICAgdGhpcy5ncmlkID0gW107XG4gICAgdGhpcy5jdXJDb2xXaWR0aCA9IDA7XG4gICAgdGhpcy5jdXJSb3dIZWlnaHQgPSAwO1xuICAgIHRoaXMuZHJhZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICB0aGlzLmVtcHR5Q2VsbCA9IG5ldyBHcmlkc3RlckVtcHR5Q2VsbCh0aGlzKTtcbiAgICB0aGlzLmNvbXBhY3QgPSBuZXcgR3JpZHN0ZXJDb21wYWN0KHRoaXMpO1xuICAgIHRoaXMuZ3JpZFJlbmRlcmVyID0gbmV3IEdyaWRzdGVyUmVuZGVyZXIodGhpcyk7XG4gIH1cblxuICAvLyAtLS0tLS0gRnVuY3Rpb24gZm9yIHN3YXBXaGlsZURyYWdnaW5nIG9wdGlvblxuXG4gIC8vIGlkZW50aWNhbCB0byBjaGVja0NvbGxpc2lvbigpIGV4Y2VwdCB0aGF0IGhlcmUgd2UgYWRkIGJvdW5kYXJpZXMuXG4gIHN0YXRpYyBjaGVja0NvbGxpc2lvblR3b0l0ZW1zRm9yU3dhcGluZyhcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW0sXG4gICAgaXRlbTI6IEdyaWRzdGVySXRlbVxuICApOiBib29sZWFuIHtcbiAgICAvLyBpZiB0aGUgY29scyBvciByb3dzIG9mIHRoZSBpdGVtcyBhcmUgMSAsIGRvZXNudCBtYWtlIGFueSBzZW5zZSB0byBzZXQgYSBib3VuZGFyeS4gT25seSBpZiB0aGUgaXRlbSBpcyBiaWdnZXIgd2Ugc2V0IGEgYm91bmRhcnlcbiAgICBjb25zdCBob3Jpem9udGFsQm91bmRhcnlJdGVtMSA9IGl0ZW0uY29scyA9PT0gMSA/IDAgOiAxO1xuICAgIGNvbnN0IGhvcml6b250YWxCb3VuZGFyeUl0ZW0yID0gaXRlbTIuY29scyA9PT0gMSA/IDAgOiAxO1xuICAgIGNvbnN0IHZlcnRpY2FsQm91bmRhcnlJdGVtMSA9IGl0ZW0ucm93cyA9PT0gMSA/IDAgOiAxO1xuICAgIGNvbnN0IHZlcnRpY2FsQm91bmRhcnlJdGVtMiA9IGl0ZW0yLnJvd3MgPT09IDEgPyAwIDogMTtcbiAgICByZXR1cm4gKFxuICAgICAgaXRlbS54ICsgaG9yaXpvbnRhbEJvdW5kYXJ5SXRlbTEgPCBpdGVtMi54ICsgaXRlbTIuY29scyAmJlxuICAgICAgaXRlbS54ICsgaXRlbS5jb2xzID4gaXRlbTIueCArIGhvcml6b250YWxCb3VuZGFyeUl0ZW0yICYmXG4gICAgICBpdGVtLnkgKyB2ZXJ0aWNhbEJvdW5kYXJ5SXRlbTEgPCBpdGVtMi55ICsgaXRlbTIucm93cyAmJlxuICAgICAgaXRlbS55ICsgaXRlbS5yb3dzID4gaXRlbTIueSArIHZlcnRpY2FsQm91bmRhcnlJdGVtMlxuICAgICk7XG4gIH1cblxuICBjaGVja0NvbGxpc2lvblR3b0l0ZW1zKGl0ZW06IEdyaWRzdGVySXRlbSwgaXRlbTI6IEdyaWRzdGVySXRlbSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNvbGxpc2lvbiA9XG4gICAgICBpdGVtLnggPCBpdGVtMi54ICsgaXRlbTIuY29scyAmJlxuICAgICAgaXRlbS54ICsgaXRlbS5jb2xzID4gaXRlbTIueCAmJlxuICAgICAgaXRlbS55IDwgaXRlbTIueSArIGl0ZW0yLnJvd3MgJiZcbiAgICAgIGl0ZW0ueSArIGl0ZW0ucm93cyA+IGl0ZW0yLnk7XG4gICAgaWYgKCFjb2xsaXNpb24pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRvcHRpb25zLmFsbG93TXVsdGlMYXllcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGRlZmF1bHRMYXllckluZGV4ID0gdGhpcy4kb3B0aW9ucy5kZWZhdWx0TGF5ZXJJbmRleDtcbiAgICBjb25zdCBsYXllckluZGV4ID1cbiAgICAgIGl0ZW0ubGF5ZXJJbmRleCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdExheWVySW5kZXggOiBpdGVtLmxheWVySW5kZXg7XG4gICAgY29uc3QgbGF5ZXJJbmRleDIgPVxuICAgICAgaXRlbTIubGF5ZXJJbmRleCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdExheWVySW5kZXggOiBpdGVtMi5sYXllckluZGV4O1xuICAgIHJldHVybiBsYXllckluZGV4ID09PSBsYXllckluZGV4MjtcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaW5pdENhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaW5pdENhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0JFxuICAgICAgLnBpcGUoZGVib3VuY2VUaW1lKDApLCB0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuY2FsY3VsYXRlTGF5b3V0KCkpO1xuXG4gICAgdGhpcy5yZXNpemUkXG4gICAgICAucGlwZShcbiAgICAgICAgLy8gQ2FuY2VsIHByZXZpb3VzbHkgc2NoZWR1bGVkIERPTSB0aW1lciBpZiBgY2FsY3VsYXRlTGF5b3V0KClgIGhhcyBiZWVuIGNhbGxlZFxuICAgICAgICAvLyB3aXRoaW4gdGhpcyB0aW1lIHJhbmdlLlxuICAgICAgICBzd2l0Y2hNYXAoKCkgPT4gdGltZXIoMTAwKSksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlc2l6ZSgpKTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlcy5vcHRpb25zKSB7XG4gICAgICB0aGlzLnNldE9wdGlvbnMoKTtcbiAgICAgIHRoaXMub3B0aW9ucy5hcGkgPSB7XG4gICAgICAgIG9wdGlvbnNDaGFuZ2VkOiB0aGlzLm9wdGlvbnNDaGFuZ2VkLFxuICAgICAgICByZXNpemU6IHRoaXMub25SZXNpemUsXG4gICAgICAgIGdldE5leHRQb3NzaWJsZVBvc2l0aW9uOiB0aGlzLmdldE5leHRQb3NzaWJsZVBvc2l0aW9uLFxuICAgICAgICBnZXRGaXJzdFBvc3NpYmxlUG9zaXRpb246IHRoaXMuZ2V0Rmlyc3RQb3NzaWJsZVBvc2l0aW9uLFxuICAgICAgICBnZXRMYXN0UG9zc2libGVQb3NpdGlvbjogdGhpcy5nZXRMYXN0UG9zc2libGVQb3NpdGlvbixcbiAgICAgICAgZ2V0SXRlbUNvbXBvbmVudDogKGl0ZW06IEdyaWRzdGVySXRlbSkgPT4gdGhpcy5nZXRJdGVtQ29tcG9uZW50KGl0ZW0pXG4gICAgICB9O1xuICAgICAgdGhpcy5jb2x1bW5zID0gdGhpcy4kb3B0aW9ucy5taW5Db2xzO1xuICAgICAgdGhpcy5yb3dzID0gdGhpcy4kb3B0aW9ucy5taW5Sb3dzICsgdGhpcy4kb3B0aW9ucy5hZGRFbXB0eVJvd3NDb3VudDtcbiAgICAgIHRoaXMuc2V0R3JpZFNpemUoKTtcbiAgICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZXNpemUoKTogdm9pZCB7XG4gICAgbGV0IGhlaWdodDtcbiAgICBsZXQgd2lkdGg7XG4gICAgaWYgKHRoaXMuJG9wdGlvbnMuZ3JpZFR5cGUgPT09ICdmaXQnICYmICF0aGlzLm1vYmlsZSkge1xuICAgICAgd2lkdGggPSB0aGlzLmVsLm9mZnNldFdpZHRoO1xuICAgICAgaGVpZ2h0ID0gdGhpcy5lbC5vZmZzZXRIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gdGhpcy5lbC5jbGllbnRXaWR0aDtcbiAgICAgIGhlaWdodCA9IHRoaXMuZWwuY2xpZW50SGVpZ2h0O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAod2lkdGggIT09IHRoaXMuY3VyV2lkdGggfHwgaGVpZ2h0ICE9PSB0aGlzLmN1ckhlaWdodCkgJiZcbiAgICAgIHRoaXMuY2hlY2tJZlRvUmVzaXplKClcbiAgICApIHtcbiAgICAgIHRoaXMub25SZXNpemUoKTtcbiAgICB9XG4gIH1cblxuICBzZXRPcHRpb25zKCk6IHZvaWQge1xuICAgIHRoaXMuJG9wdGlvbnMgPSBHcmlkc3RlclV0aWxzLm1lcmdlKFxuICAgICAgdGhpcy4kb3B0aW9ucyxcbiAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgIHRoaXMuJG9wdGlvbnNcbiAgICApO1xuICAgIGlmICghdGhpcy4kb3B0aW9ucy5kaXNhYmxlV2luZG93UmVzaXplICYmICF0aGlzLndpbmRvd1Jlc2l6ZSkge1xuICAgICAgdGhpcy53aW5kb3dSZXNpemUgPSB0aGlzLnJlbmRlcmVyLmxpc3RlbihcbiAgICAgICAgJ3dpbmRvdycsXG4gICAgICAgICdyZXNpemUnLFxuICAgICAgICB0aGlzLm9uUmVzaXplXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kb3B0aW9ucy5kaXNhYmxlV2luZG93UmVzaXplICYmIHRoaXMud2luZG93UmVzaXplKSB7XG4gICAgICB0aGlzLndpbmRvd1Jlc2l6ZSgpO1xuICAgICAgdGhpcy53aW5kb3dSZXNpemUgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmVtcHR5Q2VsbC51cGRhdGVPcHRpb25zKCk7XG4gIH1cblxuICBvcHRpb25zQ2hhbmdlZCA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLnNldE9wdGlvbnMoKTtcbiAgICBsZXQgd2lkZ2V0c0luZGV4OiBudW1iZXIgPSB0aGlzLmdyaWQubGVuZ3RoIC0gMTtcbiAgICBsZXQgd2lkZ2V0OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA+PSAwOyB3aWRnZXRzSW5kZXgtLSkge1xuICAgICAgd2lkZ2V0ID0gdGhpcy5ncmlkW3dpZGdldHNJbmRleF07XG4gICAgICB3aWRnZXQudXBkYXRlT3B0aW9ucygpO1xuICAgIH1cbiAgICB0aGlzLmNhbGN1bGF0ZUxheW91dCgpO1xuICB9O1xuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZGVzdHJveSQubmV4dCgpO1xuICAgIHRoaXMucHJldmlld1N0eWxlJC5jb21wbGV0ZSgpO1xuICAgIGlmICh0aGlzLndpbmRvd1Jlc2l6ZSkge1xuICAgICAgdGhpcy53aW5kb3dSZXNpemUoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuZGVzdHJveUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVzdHJveUNhbGxiYWNrKHRoaXMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5hcGkpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hcGkucmVzaXplID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5vcHRpb25zLmFwaS5vcHRpb25zQ2hhbmdlZCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMub3B0aW9ucy5hcGkuZ2V0TmV4dFBvc3NpYmxlUG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLm9wdGlvbnMuYXBpID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLmVtcHR5Q2VsbC5kZXN0cm95KCk7XG4gICAgdGhpcy5lbXB0eUNlbGwgPSBudWxsITtcbiAgICB0aGlzLmNvbXBhY3QuZGVzdHJveSgpO1xuICAgIHRoaXMuY29tcGFjdCA9IG51bGwhO1xuICB9XG5cbiAgb25SZXNpemUgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKHRoaXMuZWwuY2xpZW50V2lkdGgpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2V0R3JpZFNpemUpIHtcbiAgICAgICAgLy8gcmVzZXQgd2lkdGgvaGVpZ2h0IHNvIHRoZSBzaXplIGlzIHJlY2FsY3VsYXRlZCBhZnRlcndhcmRzXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3dpZHRoJywgJycpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICdoZWlnaHQnLCAnJyk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldEdyaWRTaXplKCk7XG4gICAgICB0aGlzLmNhbGN1bGF0ZUxheW91dCgpO1xuICAgIH1cbiAgfTtcblxuICBjaGVja0lmVG9SZXNpemUoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY2xpZW50V2lkdGggPSB0aGlzLmVsLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IG9mZnNldFdpZHRoID0gdGhpcy5lbC5vZmZzZXRXaWR0aDtcbiAgICBjb25zdCBzY3JvbGxXaWR0aCA9IHRoaXMuZWwuc2Nyb2xsV2lkdGg7XG4gICAgY29uc3QgY2xpZW50SGVpZ2h0ID0gdGhpcy5lbC5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3Qgb2Zmc2V0SGVpZ2h0ID0gdGhpcy5lbC5vZmZzZXRIZWlnaHQ7XG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5lbC5zY3JvbGxIZWlnaHQ7XG4gICAgY29uc3QgdmVydGljYWxTY3JvbGxQcmVzZW50ID1cbiAgICAgIGNsaWVudFdpZHRoIDwgb2Zmc2V0V2lkdGggJiZcbiAgICAgIHNjcm9sbEhlaWdodCA+IG9mZnNldEhlaWdodCAmJlxuICAgICAgc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0SGVpZ2h0IDwgb2Zmc2V0V2lkdGggLSBjbGllbnRXaWR0aDtcbiAgICBjb25zdCBob3Jpem9udGFsU2Nyb2xsUHJlc2VudCA9XG4gICAgICBjbGllbnRIZWlnaHQgPCBvZmZzZXRIZWlnaHQgJiZcbiAgICAgIHNjcm9sbFdpZHRoID4gb2Zmc2V0V2lkdGggJiZcbiAgICAgIHNjcm9sbFdpZHRoIC0gb2Zmc2V0V2lkdGggPCBvZmZzZXRIZWlnaHQgLSBjbGllbnRIZWlnaHQ7XG4gICAgaWYgKHZlcnRpY2FsU2Nyb2xsUHJlc2VudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gIWhvcml6b250YWxTY3JvbGxQcmVzZW50O1xuICB9XG5cbiAgY2hlY2tJZk1vYmlsZSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy4kb3B0aW9ucy51c2VCb2R5Rm9yQnJlYWtwb2ludCkge1xuICAgICAgcmV0dXJuIHRoaXMuJG9wdGlvbnMubW9iaWxlQnJlYWtwb2ludCA+IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLiRvcHRpb25zLm1vYmlsZUJyZWFrcG9pbnQgPiB0aGlzLmN1cldpZHRoO1xuICAgIH1cbiAgfVxuXG4gIHNldEdyaWRTaXplKCk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbDtcbiAgICBsZXQgd2lkdGg7XG4gICAgbGV0IGhlaWdodDtcbiAgICBpZiAoXG4gICAgICB0aGlzLiRvcHRpb25zLnNldEdyaWRTaXplIHx8XG4gICAgICAodGhpcy4kb3B0aW9ucy5ncmlkVHlwZSA9PT0gR3JpZFR5cGUuRml0ICYmICF0aGlzLm1vYmlsZSlcbiAgICApIHtcbiAgICAgIHdpZHRoID0gZWwub2Zmc2V0V2lkdGg7XG4gICAgICBoZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gZWwuY2xpZW50V2lkdGg7XG4gICAgICBoZWlnaHQgPSBlbC5jbGllbnRIZWlnaHQ7XG4gICAgfVxuICAgIHRoaXMuY3VyV2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmN1ckhlaWdodCA9IGhlaWdodDtcbiAgfVxuXG4gIHNldEdyaWREaW1lbnNpb25zKCk6IHZvaWQge1xuICAgIHRoaXMuc2V0R3JpZFNpemUoKTtcbiAgICBpZiAoIXRoaXMubW9iaWxlICYmIHRoaXMuY2hlY2tJZk1vYmlsZSgpKSB7XG4gICAgICB0aGlzLm1vYmlsZSA9ICF0aGlzLm1vYmlsZTtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbCwgJ21vYmlsZScpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5tb2JpbGUgJiYgIXRoaXMuY2hlY2tJZk1vYmlsZSgpKSB7XG4gICAgICB0aGlzLm1vYmlsZSA9ICF0aGlzLm1vYmlsZTtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3ModGhpcy5lbCwgJ21vYmlsZScpO1xuICAgIH1cbiAgICBsZXQgcm93cyA9IHRoaXMuJG9wdGlvbnMubWluUm93cztcbiAgICBsZXQgY29sdW1ucyA9IHRoaXMuJG9wdGlvbnMubWluQ29scztcblxuICAgIGxldCB3aWRnZXRzSW5kZXggPSB0aGlzLmdyaWQubGVuZ3RoIC0gMTtcbiAgICBsZXQgd2lkZ2V0O1xuICAgIGZvciAoOyB3aWRnZXRzSW5kZXggPj0gMDsgd2lkZ2V0c0luZGV4LS0pIHtcbiAgICAgIHdpZGdldCA9IHRoaXMuZ3JpZFt3aWRnZXRzSW5kZXhdO1xuICAgICAgaWYgKCF3aWRnZXQubm90UGxhY2VkKSB7XG4gICAgICAgIHJvd3MgPSBNYXRoLm1heChyb3dzLCB3aWRnZXQuJGl0ZW0ueSArIHdpZGdldC4kaXRlbS5yb3dzKTtcbiAgICAgICAgY29sdW1ucyA9IE1hdGgubWF4KGNvbHVtbnMsIHdpZGdldC4kaXRlbS54ICsgd2lkZ2V0LiRpdGVtLmNvbHMpO1xuICAgICAgfVxuICAgIH1cbiAgICByb3dzICs9IHRoaXMuJG9wdGlvbnMuYWRkRW1wdHlSb3dzQ291bnQ7XG4gICAgaWYgKHRoaXMuY29sdW1ucyAhPT0gY29sdW1ucyB8fCB0aGlzLnJvd3MgIT09IHJvd3MpIHtcbiAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XG4gICAgICB0aGlzLnJvd3MgPSByb3dzO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkU2l6ZUNoYW5nZWRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFNpemVDaGFuZ2VkQ2FsbGJhY2sodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVMYXlvdXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29tcGFjdCkge1xuICAgICAgdGhpcy5jb21wYWN0LmNoZWNrQ29tcGFjdCgpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3JpZERpbWVuc2lvbnMoKTtcbiAgICBpZiAodGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbikge1xuICAgICAgbGV0IG1hcmdpbldpZHRoID0gLXRoaXMuJG9wdGlvbnMubWFyZ2luO1xuICAgICAgaWYgKHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5MZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgIG1hcmdpbldpZHRoICs9IHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5MZWZ0O1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKFxuICAgICAgICAgIHRoaXMuZWwsXG4gICAgICAgICAgJ3BhZGRpbmctbGVmdCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpbkxlZnQgKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXJnaW5XaWR0aCArPSB0aGlzLiRvcHRpb25zLm1hcmdpbjtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdwYWRkaW5nLWxlZnQnLFxuICAgICAgICAgIHRoaXMuJG9wdGlvbnMubWFyZ2luICsgJ3B4J1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5SaWdodCAhPT0gbnVsbCkge1xuICAgICAgICBtYXJnaW5XaWR0aCArPSB0aGlzLiRvcHRpb25zLm91dGVyTWFyZ2luUmlnaHQ7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy1yaWdodCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5vdXRlck1hcmdpblJpZ2h0ICsgJ3B4J1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFyZ2luV2lkdGggKz0gdGhpcy4kb3B0aW9ucy5tYXJnaW47XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy1yaWdodCcsXG4gICAgICAgICAgdGhpcy4kb3B0aW9ucy5tYXJnaW4gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB0aGlzLmN1ckNvbFdpZHRoID0gKHRoaXMuY3VyV2lkdGggLSBtYXJnaW5XaWR0aCkgLyB0aGlzLmNvbHVtbnM7XG4gICAgICBsZXQgbWFyZ2luSGVpZ2h0ID0gLXRoaXMuJG9wdGlvbnMubWFyZ2luO1xuICAgICAgaWYgKHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Ub3AgIT09IG51bGwpIHtcbiAgICAgICAgbWFyZ2luSGVpZ2h0ICs9IHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Ub3A7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy10b3AnLFxuICAgICAgICAgIHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Ub3AgKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXJnaW5IZWlnaHQgKz0gdGhpcy4kb3B0aW9ucy5tYXJnaW47XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy10b3AnLFxuICAgICAgICAgIHRoaXMuJG9wdGlvbnMubWFyZ2luICsgJ3B4J1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Cb3R0b20gIT09IG51bGwpIHtcbiAgICAgICAgbWFyZ2luSGVpZ2h0ICs9IHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Cb3R0b207XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy1ib3R0b20nLFxuICAgICAgICAgIHRoaXMuJG9wdGlvbnMub3V0ZXJNYXJnaW5Cb3R0b20gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXJnaW5IZWlnaHQgKz0gdGhpcy4kb3B0aW9ucy5tYXJnaW47XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAncGFkZGluZy1ib3R0b20nLFxuICAgICAgICAgIHRoaXMuJG9wdGlvbnMubWFyZ2luICsgJ3B4J1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5jdXJSb3dIZWlnaHQgPVxuICAgICAgICAoKHRoaXMuY3VySGVpZ2h0IC0gbWFyZ2luSGVpZ2h0KSAvIHRoaXMucm93cykgKlxuICAgICAgICB0aGlzLiRvcHRpb25zLnJvd0hlaWdodFJhdGlvO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmN1ckNvbFdpZHRoID0gKHRoaXMuY3VyV2lkdGggKyB0aGlzLiRvcHRpb25zLm1hcmdpbikgLyB0aGlzLmNvbHVtbnM7XG4gICAgICB0aGlzLmN1clJvd0hlaWdodCA9XG4gICAgICAgICgodGhpcy5jdXJIZWlnaHQgKyB0aGlzLiRvcHRpb25zLm1hcmdpbikgLyB0aGlzLnJvd3MpICpcbiAgICAgICAgdGhpcy4kb3B0aW9ucy5yb3dIZWlnaHRSYXRpbztcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3BhZGRpbmctbGVmdCcsIDAgKyAncHgnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3BhZGRpbmctcmlnaHQnLCAwICsgJ3B4Jyk7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICdwYWRkaW5nLXRvcCcsIDAgKyAncHgnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ3BhZGRpbmctYm90dG9tJywgMCArICdweCcpO1xuICAgIH1cbiAgICB0aGlzLmdyaWRSZW5kZXJlci51cGRhdGVHcmlkc3RlcigpO1xuXG4gICAgaWYgKHRoaXMuJG9wdGlvbnMuc2V0R3JpZFNpemUpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbCwgJ2dyaWRTaXplJyk7XG4gICAgICBpZiAoIXRoaXMubW9iaWxlKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUoXG4gICAgICAgICAgdGhpcy5lbCxcbiAgICAgICAgICAnd2lkdGgnLFxuICAgICAgICAgIHRoaXMuY29sdW1ucyAqIHRoaXMuY3VyQ29sV2lkdGggKyB0aGlzLiRvcHRpb25zLm1hcmdpbiArICdweCdcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZShcbiAgICAgICAgICB0aGlzLmVsLFxuICAgICAgICAgICdoZWlnaHQnLFxuICAgICAgICAgIHRoaXMucm93cyAqIHRoaXMuY3VyUm93SGVpZ2h0ICsgdGhpcy4kb3B0aW9ucy5tYXJnaW4gKyAncHgnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3ModGhpcy5lbCwgJ2dyaWRTaXplJyk7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICd3aWR0aCcsICcnKTtcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lbCwgJ2hlaWdodCcsICcnKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVHcmlkKCk7XG5cbiAgICBsZXQgd2lkZ2V0c0luZGV4OiBudW1iZXIgPSB0aGlzLmdyaWQubGVuZ3RoIC0gMTtcbiAgICBsZXQgd2lkZ2V0OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA+PSAwOyB3aWRnZXRzSW5kZXgtLSkge1xuICAgICAgd2lkZ2V0ID0gdGhpcy5ncmlkW3dpZGdldHNJbmRleF07XG4gICAgICB3aWRnZXQuc2V0U2l6ZSgpO1xuICAgICAgd2lkZ2V0LmRyYWcudG9nZ2xlKCk7XG4gICAgICB3aWRnZXQucmVzaXplLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIHRoaXMucmVzaXplJC5uZXh0KCk7XG4gIH1cblxuICB1cGRhdGVHcmlkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLiRvcHRpb25zLmRpc3BsYXlHcmlkID09PSAnYWx3YXlzJyAmJiAhdGhpcy5tb2JpbGUpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbCwgJ2Rpc3BsYXktZ3JpZCcpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLiRvcHRpb25zLmRpc3BsYXlHcmlkID09PSAnb25EcmFnJlJlc2l6ZScgJiZcbiAgICAgIHRoaXMuZHJhZ0luUHJvZ3Jlc3NcbiAgICApIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbCwgJ2Rpc3BsYXktZ3JpZCcpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLiRvcHRpb25zLmRpc3BsYXlHcmlkID09PSAnbm9uZScgfHxcbiAgICAgICF0aGlzLmRyYWdJblByb2dyZXNzIHx8XG4gICAgICB0aGlzLm1vYmlsZVxuICAgICkge1xuICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyh0aGlzLmVsLCAnZGlzcGxheS1ncmlkJyk7XG4gICAgfVxuICAgIHRoaXMuc2V0R3JpZERpbWVuc2lvbnMoKTtcbiAgICB0aGlzLmdyaWRDb2x1bW5zLmxlbmd0aCA9IEdyaWRzdGVyQ29tcG9uZW50LmdldE5ld0FycmF5TGVuZ3RoKFxuICAgICAgdGhpcy5jb2x1bW5zLFxuICAgICAgdGhpcy5jdXJXaWR0aCxcbiAgICAgIHRoaXMuY3VyQ29sV2lkdGhcbiAgICApO1xuICAgIHRoaXMuZ3JpZFJvd3MubGVuZ3RoID0gR3JpZHN0ZXJDb21wb25lbnQuZ2V0TmV3QXJyYXlMZW5ndGgoXG4gICAgICB0aGlzLnJvd3MsXG4gICAgICB0aGlzLmN1ckhlaWdodCxcbiAgICAgIHRoaXMuY3VyUm93SGVpZ2h0XG4gICAgKTtcbiAgICB0aGlzLmNkUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgYWRkSXRlbShpdGVtQ29tcG9uZW50OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UpOiB2b2lkIHtcbiAgICBpZiAoaXRlbUNvbXBvbmVudC4kaXRlbS5jb2xzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGl0ZW1Db21wb25lbnQuJGl0ZW0uY29scyA9IHRoaXMuJG9wdGlvbnMuZGVmYXVsdEl0ZW1Db2xzO1xuICAgICAgaXRlbUNvbXBvbmVudC5pdGVtLmNvbHMgPSBpdGVtQ29tcG9uZW50LiRpdGVtLmNvbHM7XG4gICAgICBpdGVtQ29tcG9uZW50Lml0ZW1DaGFuZ2VkKCk7XG4gICAgfVxuICAgIGlmIChpdGVtQ29tcG9uZW50LiRpdGVtLnJvd3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaXRlbUNvbXBvbmVudC4kaXRlbS5yb3dzID0gdGhpcy4kb3B0aW9ucy5kZWZhdWx0SXRlbVJvd3M7XG4gICAgICBpdGVtQ29tcG9uZW50Lml0ZW0ucm93cyA9IGl0ZW1Db21wb25lbnQuJGl0ZW0ucm93cztcbiAgICAgIGl0ZW1Db21wb25lbnQuaXRlbUNoYW5nZWQoKTtcbiAgICB9XG4gICAgaWYgKGl0ZW1Db21wb25lbnQuJGl0ZW0ueCA9PT0gLTEgfHwgaXRlbUNvbXBvbmVudC4kaXRlbS55ID09PSAtMSkge1xuICAgICAgdGhpcy5hdXRvUG9zaXRpb25JdGVtKGl0ZW1Db21wb25lbnQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jaGVja0NvbGxpc2lvbihpdGVtQ29tcG9uZW50LiRpdGVtKSkge1xuICAgICAgaWYgKCF0aGlzLiRvcHRpb25zLmRpc2FibGVXYXJuaW5ncykge1xuICAgICAgICBpdGVtQ29tcG9uZW50Lm5vdFBsYWNlZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBcIkNhbid0IGJlIHBsYWNlZCBpbiB0aGUgYm91bmRzIG9mIHRoZSBkYXNoYm9hcmQsIHRyeWluZyB0byBhdXRvIHBvc2l0aW9uIS9uXCIgK1xuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoaXRlbUNvbXBvbmVudC5pdGVtLCBbJ2NvbHMnLCAncm93cycsICd4JywgJ3knXSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy4kb3B0aW9ucy5kaXNhYmxlQXV0b1Bvc2l0aW9uT25Db25mbGljdCkge1xuICAgICAgICB0aGlzLmF1dG9Qb3NpdGlvbkl0ZW0oaXRlbUNvbXBvbmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtQ29tcG9uZW50Lm5vdFBsYWNlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZ3JpZC5wdXNoKGl0ZW1Db21wb25lbnQpO1xuICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0JC5uZXh0KCk7XG4gIH1cblxuICByZW1vdmVJdGVtKGl0ZW1Db21wb25lbnQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSk6IHZvaWQge1xuICAgIHRoaXMuZ3JpZC5zcGxpY2UodGhpcy5ncmlkLmluZGV4T2YoaXRlbUNvbXBvbmVudCksIDEpO1xuICAgIHRoaXMuY2FsY3VsYXRlTGF5b3V0JC5uZXh0KCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pdGVtUmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaXRlbVJlbW92ZWRDYWxsYmFjayhpdGVtQ29tcG9uZW50Lml0ZW0sIGl0ZW1Db21wb25lbnQpO1xuICAgIH1cbiAgfVxuXG4gIGNoZWNrQ29sbGlzaW9uKGl0ZW06IEdyaWRzdGVySXRlbSk6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSB8IGJvb2xlYW4ge1xuICAgIGxldCBjb2xsaXNpb246IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZSB8IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBpZiAodGhpcy5vcHRpb25zLml0ZW1WYWxpZGF0ZUNhbGxiYWNrKSB7XG4gICAgICBjb2xsaXNpb24gPSAhdGhpcy5vcHRpb25zLml0ZW1WYWxpZGF0ZUNhbGxiYWNrKGl0ZW0pO1xuICAgIH1cbiAgICBpZiAoIWNvbGxpc2lvbiAmJiB0aGlzLmNoZWNrR3JpZENvbGxpc2lvbihpdGVtKSkge1xuICAgICAgY29sbGlzaW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCFjb2xsaXNpb24pIHtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLmZpbmRJdGVtV2l0aEl0ZW0oaXRlbSk7XG4gICAgICBpZiAoYykge1xuICAgICAgICBjb2xsaXNpb24gPSBjO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sbGlzaW9uO1xuICB9XG5cbiAgY2hlY2tHcmlkQ29sbGlzaW9uKGl0ZW06IEdyaWRzdGVySXRlbSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vTmVnYXRpdmVQb3NpdGlvbiA9IGl0ZW0ueSA+IC0xICYmIGl0ZW0ueCA+IC0xO1xuICAgIGNvbnN0IG1heEdyaWRDb2xzID0gaXRlbS5jb2xzICsgaXRlbS54IDw9IHRoaXMuJG9wdGlvbnMubWF4Q29scztcbiAgICBjb25zdCBtYXhHcmlkUm93cyA9IGl0ZW0ucm93cyArIGl0ZW0ueSA8PSB0aGlzLiRvcHRpb25zLm1heFJvd3M7XG4gICAgY29uc3QgbWF4SXRlbUNvbHMgPVxuICAgICAgaXRlbS5tYXhJdGVtQ29scyA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdGhpcy4kb3B0aW9ucy5tYXhJdGVtQ29sc1xuICAgICAgICA6IGl0ZW0ubWF4SXRlbUNvbHM7XG4gICAgY29uc3QgbWluSXRlbUNvbHMgPVxuICAgICAgaXRlbS5taW5JdGVtQ29scyA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdGhpcy4kb3B0aW9ucy5taW5JdGVtQ29sc1xuICAgICAgICA6IGl0ZW0ubWluSXRlbUNvbHM7XG4gICAgY29uc3QgbWF4SXRlbVJvd3MgPVxuICAgICAgaXRlbS5tYXhJdGVtUm93cyA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdGhpcy4kb3B0aW9ucy5tYXhJdGVtUm93c1xuICAgICAgICA6IGl0ZW0ubWF4SXRlbVJvd3M7XG4gICAgY29uc3QgbWluSXRlbVJvd3MgPVxuICAgICAgaXRlbS5taW5JdGVtUm93cyA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdGhpcy4kb3B0aW9ucy5taW5JdGVtUm93c1xuICAgICAgICA6IGl0ZW0ubWluSXRlbVJvd3M7XG4gICAgY29uc3QgaW5Db2xzTGltaXRzID0gaXRlbS5jb2xzIDw9IG1heEl0ZW1Db2xzICYmIGl0ZW0uY29scyA+PSBtaW5JdGVtQ29scztcbiAgICBjb25zdCBpblJvd3NMaW1pdHMgPSBpdGVtLnJvd3MgPD0gbWF4SXRlbVJvd3MgJiYgaXRlbS5yb3dzID49IG1pbkl0ZW1Sb3dzO1xuICAgIGNvbnN0IG1pbkFyZWFMaW1pdCA9XG4gICAgICBpdGVtLm1pbkl0ZW1BcmVhID09PSB1bmRlZmluZWRcbiAgICAgICAgPyB0aGlzLiRvcHRpb25zLm1pbkl0ZW1BcmVhXG4gICAgICAgIDogaXRlbS5taW5JdGVtQXJlYTtcbiAgICBjb25zdCBtYXhBcmVhTGltaXQgPVxuICAgICAgaXRlbS5tYXhJdGVtQXJlYSA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gdGhpcy4kb3B0aW9ucy5tYXhJdGVtQXJlYVxuICAgICAgICA6IGl0ZW0ubWF4SXRlbUFyZWE7XG4gICAgY29uc3QgYXJlYSA9IGl0ZW0uY29scyAqIGl0ZW0ucm93cztcbiAgICBjb25zdCBpbk1pbkFyZWEgPSBtaW5BcmVhTGltaXQgPD0gYXJlYTtcbiAgICBjb25zdCBpbk1heEFyZWEgPSBtYXhBcmVhTGltaXQgPj0gYXJlYTtcbiAgICByZXR1cm4gIShcbiAgICAgIG5vTmVnYXRpdmVQb3NpdGlvbiAmJlxuICAgICAgbWF4R3JpZENvbHMgJiZcbiAgICAgIG1heEdyaWRSb3dzICYmXG4gICAgICBpbkNvbHNMaW1pdHMgJiZcbiAgICAgIGluUm93c0xpbWl0cyAmJlxuICAgICAgaW5NaW5BcmVhICYmXG4gICAgICBpbk1heEFyZWFcbiAgICApO1xuICB9XG5cbiAgZmluZEl0ZW1XaXRoSXRlbShcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW1cbiAgKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiB7XG4gICAgbGV0IHdpZGdldHNJbmRleCA9IDA7XG4gICAgbGV0IHdpZGdldDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlO1xuICAgIGZvciAoOyB3aWRnZXRzSW5kZXggPCB0aGlzLmdyaWQubGVuZ3RoOyB3aWRnZXRzSW5kZXgrKykge1xuICAgICAgd2lkZ2V0ID0gdGhpcy5ncmlkW3dpZGdldHNJbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIHdpZGdldC4kaXRlbSAhPT0gaXRlbSAmJlxuICAgICAgICB0aGlzLmNoZWNrQ29sbGlzaW9uVHdvSXRlbXMod2lkZ2V0LiRpdGVtLCBpdGVtKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB3aWRnZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZpbmRJdGVtc1dpdGhJdGVtKGl0ZW06IEdyaWRzdGVySXRlbSk6IEFycmF5PEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZT4ge1xuICAgIGNvbnN0IGE6IEFycmF5PEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZT4gPSBbXTtcbiAgICBsZXQgd2lkZ2V0c0luZGV4ID0gMDtcbiAgICBsZXQgd2lkZ2V0OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gICAgZm9yICg7IHdpZGdldHNJbmRleCA8IHRoaXMuZ3JpZC5sZW5ndGg7IHdpZGdldHNJbmRleCsrKSB7XG4gICAgICB3aWRnZXQgPSB0aGlzLmdyaWRbd2lkZ2V0c0luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgd2lkZ2V0LiRpdGVtICE9PSBpdGVtICYmXG4gICAgICAgIHRoaXMuY2hlY2tDb2xsaXNpb25Ud29JdGVtcyh3aWRnZXQuJGl0ZW0sIGl0ZW0pXG4gICAgICApIHtcbiAgICAgICAgYS5wdXNoKHdpZGdldCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgYXV0b1Bvc2l0aW9uSXRlbShpdGVtQ29tcG9uZW50OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5nZXROZXh0UG9zc2libGVQb3NpdGlvbihpdGVtQ29tcG9uZW50LiRpdGVtKSkge1xuICAgICAgaXRlbUNvbXBvbmVudC5ub3RQbGFjZWQgPSBmYWxzZTtcbiAgICAgIGl0ZW1Db21wb25lbnQuaXRlbS54ID0gaXRlbUNvbXBvbmVudC4kaXRlbS54O1xuICAgICAgaXRlbUNvbXBvbmVudC5pdGVtLnkgPSBpdGVtQ29tcG9uZW50LiRpdGVtLnk7XG4gICAgICBpdGVtQ29tcG9uZW50Lml0ZW1DaGFuZ2VkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZW1Db21wb25lbnQubm90UGxhY2VkID0gdHJ1ZTtcbiAgICAgIGlmICghdGhpcy4kb3B0aW9ucy5kaXNhYmxlV2FybmluZ3MpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIFwiQ2FuJ3QgYmUgcGxhY2VkIGluIHRoZSBib3VuZHMgb2YgdGhlIGRhc2hib2FyZCEvblwiICtcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGl0ZW1Db21wb25lbnQuaXRlbSwgWydjb2xzJywgJ3Jvd3MnLCAneCcsICd5J10pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0TmV4dFBvc3NpYmxlUG9zaXRpb24gPSAoXG4gICAgbmV3SXRlbTogR3JpZHN0ZXJJdGVtLFxuICAgIHN0YXJ0aW5nRnJvbTogeyB5PzogbnVtYmVyOyB4PzogbnVtYmVyIH0gPSB7fVxuICApOiBib29sZWFuID0+IHtcbiAgICBpZiAobmV3SXRlbS5jb2xzID09PSAtMSkge1xuICAgICAgbmV3SXRlbS5jb2xzID0gdGhpcy4kb3B0aW9ucy5kZWZhdWx0SXRlbUNvbHM7XG4gICAgfVxuICAgIGlmIChuZXdJdGVtLnJvd3MgPT09IC0xKSB7XG4gICAgICBuZXdJdGVtLnJvd3MgPSB0aGlzLiRvcHRpb25zLmRlZmF1bHRJdGVtUm93cztcbiAgICB9XG4gICAgdGhpcy5zZXRHcmlkRGltZW5zaW9ucygpO1xuICAgIGxldCByb3dzSW5kZXggPSBzdGFydGluZ0Zyb20ueSB8fCAwO1xuICAgIGxldCBjb2xzSW5kZXg7XG4gICAgZm9yICg7IHJvd3NJbmRleCA8IHRoaXMucm93czsgcm93c0luZGV4KyspIHtcbiAgICAgIG5ld0l0ZW0ueSA9IHJvd3NJbmRleDtcbiAgICAgIGNvbHNJbmRleCA9IHN0YXJ0aW5nRnJvbS54IHx8IDA7XG4gICAgICBmb3IgKDsgY29sc0luZGV4IDwgdGhpcy5jb2x1bW5zOyBjb2xzSW5kZXgrKykge1xuICAgICAgICBuZXdJdGVtLnggPSBjb2xzSW5kZXg7XG4gICAgICAgIGlmICghdGhpcy5jaGVja0NvbGxpc2lvbihuZXdJdGVtKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGNhbkFkZFRvUm93cyA9IHRoaXMuJG9wdGlvbnMubWF4Um93cyA+PSB0aGlzLnJvd3MgKyBuZXdJdGVtLnJvd3M7XG4gICAgY29uc3QgY2FuQWRkVG9Db2x1bW5zID1cbiAgICAgIHRoaXMuJG9wdGlvbnMubWF4Q29scyA+PSB0aGlzLmNvbHVtbnMgKyBuZXdJdGVtLmNvbHM7XG4gICAgY29uc3QgYWRkVG9Sb3dzID0gdGhpcy5yb3dzIDw9IHRoaXMuY29sdW1ucyAmJiBjYW5BZGRUb1Jvd3M7XG4gICAgaWYgKCFhZGRUb1Jvd3MgJiYgY2FuQWRkVG9Db2x1bW5zKSB7XG4gICAgICBuZXdJdGVtLnggPSB0aGlzLmNvbHVtbnM7XG4gICAgICBuZXdJdGVtLnkgPSAwO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChjYW5BZGRUb1Jvd3MpIHtcbiAgICAgIG5ld0l0ZW0ueSA9IHRoaXMucm93cztcbiAgICAgIG5ld0l0ZW0ueCA9IDA7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGdldEZpcnN0UG9zc2libGVQb3NpdGlvbiA9IChpdGVtOiBHcmlkc3Rlckl0ZW0pOiBHcmlkc3Rlckl0ZW0gPT4ge1xuICAgIGNvbnN0IHRtcEl0ZW0gPSBPYmplY3QuYXNzaWduKHt9LCBpdGVtKTtcbiAgICB0aGlzLmdldE5leHRQb3NzaWJsZVBvc2l0aW9uKHRtcEl0ZW0pO1xuICAgIHJldHVybiB0bXBJdGVtO1xuICB9O1xuXG4gIGdldExhc3RQb3NzaWJsZVBvc2l0aW9uID0gKGl0ZW06IEdyaWRzdGVySXRlbSk6IEdyaWRzdGVySXRlbSA9PiB7XG4gICAgbGV0IGZhcnRoZXN0SXRlbTogeyB5OiBudW1iZXI7IHg6IG51bWJlciB9ID0geyB5OiAwLCB4OiAwIH07XG4gICAgZmFydGhlc3RJdGVtID0gdGhpcy5ncmlkLnJlZHVjZShcbiAgICAgIChcbiAgICAgICAgcHJldjogeyB5OiBudW1iZXI7IHg6IG51bWJlciB9LFxuICAgICAgICBjdXJyOiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2VcbiAgICAgICkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyQ29vcmRzID0ge1xuICAgICAgICAgIHk6IGN1cnIuJGl0ZW0ueSArIGN1cnIuJGl0ZW0ucm93cyAtIDEsXG4gICAgICAgICAgeDogY3Vyci4kaXRlbS54ICsgY3Vyci4kaXRlbS5jb2xzIC0gMVxuICAgICAgICB9O1xuICAgICAgICBpZiAoR3JpZHN0ZXJVdGlscy5jb21wYXJlSXRlbXMocHJldiwgY3VyckNvb3JkcykgPT09IDEpIHtcbiAgICAgICAgICByZXR1cm4gY3VyckNvb3JkcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhcnRoZXN0SXRlbVxuICAgICk7XG5cbiAgICBjb25zdCB0bXBJdGVtID0gT2JqZWN0LmFzc2lnbih7fSwgaXRlbSk7XG4gICAgdGhpcy5nZXROZXh0UG9zc2libGVQb3NpdGlvbih0bXBJdGVtLCBmYXJ0aGVzdEl0ZW0pO1xuICAgIHJldHVybiB0bXBJdGVtO1xuICB9O1xuXG4gIHBpeGVsc1RvUG9zaXRpb25YKFxuICAgIHg6IG51bWJlcixcbiAgICByb3VuZGluZ01ldGhvZDogKHg6IG51bWJlcikgPT4gbnVtYmVyLFxuICAgIG5vTGltaXQ/OiBib29sZWFuXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgcG9zaXRpb24gPSByb3VuZGluZ01ldGhvZCh4IC8gdGhpcy5jdXJDb2xXaWR0aCk7XG4gICAgaWYgKG5vTGltaXQpIHtcbiAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KHBvc2l0aW9uLCAwKTtcbiAgICB9XG4gIH1cblxuICBwaXhlbHNUb1Bvc2l0aW9uWShcbiAgICB5OiBudW1iZXIsXG4gICAgcm91bmRpbmdNZXRob2Q6ICh4OiBudW1iZXIpID0+IG51bWJlcixcbiAgICBub0xpbWl0PzogYm9vbGVhblxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gcm91bmRpbmdNZXRob2QoeSAvIHRoaXMuY3VyUm93SGVpZ2h0KTtcbiAgICBpZiAobm9MaW1pdCkge1xuICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXgocG9zaXRpb24sIDApO1xuICAgIH1cbiAgfVxuXG4gIHBvc2l0aW9uWFRvUGl4ZWxzKHg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHggKiB0aGlzLmN1ckNvbFdpZHRoO1xuICB9XG5cbiAgcG9zaXRpb25ZVG9QaXhlbHMoeTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4geSAqIHRoaXMuY3VyUm93SGVpZ2h0O1xuICB9XG5cbiAgZ2V0SXRlbUNvbXBvbmVudChcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW1cbiAgKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkLmZpbmQoYyA9PiBjLml0ZW0gPT09IGl0ZW0pO1xuICB9XG5cbiAgLy8gLS0tLS0tIEZ1bmN0aW9ucyBmb3Igc3dhcFdoaWxlRHJhZ2dpbmcgb3B0aW9uXG5cbiAgLy8gaWRlbnRpY2FsIHRvIGNoZWNrQ29sbGlzaW9uKCkgZXhjZXB0IHRoYXQgdGhpcyBmdW5jdGlvbiBjYWxscyBmaW5kSXRlbVdpdGhJdGVtRm9yU3dhcGluZygpIGluc3RlYWQgb2YgZmluZEl0ZW1XaXRoSXRlbSgpXG4gIGNoZWNrQ29sbGlzaW9uRm9yU3dhcGluZyhcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW1cbiAgKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiB7XG4gICAgbGV0IGNvbGxpc2lvbjogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiA9IGZhbHNlO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaXRlbVZhbGlkYXRlQ2FsbGJhY2spIHtcbiAgICAgIGNvbGxpc2lvbiA9ICF0aGlzLm9wdGlvbnMuaXRlbVZhbGlkYXRlQ2FsbGJhY2soaXRlbSk7XG4gICAgfVxuICAgIGlmICghY29sbGlzaW9uICYmIHRoaXMuY2hlY2tHcmlkQ29sbGlzaW9uKGl0ZW0pKSB7XG4gICAgICBjb2xsaXNpb24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoIWNvbGxpc2lvbikge1xuICAgICAgY29uc3QgYyA9IHRoaXMuZmluZEl0ZW1XaXRoSXRlbUZvclN3YXBwaW5nKGl0ZW0pO1xuICAgICAgaWYgKGMpIHtcbiAgICAgICAgY29sbGlzaW9uID0gYztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbGxpc2lvbjtcbiAgfVxuXG4gIC8vIGlkZW50aWNhbCB0byBmaW5kSXRlbVdpdGhJdGVtKCkgZXhjZXB0IHRoYXQgdGhpcyBmdW5jdGlvbiBjYWxscyBjaGVja0NvbGxpc2lvblR3b0l0ZW1zRm9yU3dhcGluZygpIGluc3RlYWQgb2YgY2hlY2tDb2xsaXNpb25Ud29JdGVtcygpXG4gIGZpbmRJdGVtV2l0aEl0ZW1Gb3JTd2FwcGluZyhcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW1cbiAgKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlIHwgYm9vbGVhbiB7XG4gICAgbGV0IHdpZGdldHNJbmRleDogbnVtYmVyID0gdGhpcy5ncmlkLmxlbmd0aCAtIDE7XG4gICAgbGV0IHdpZGdldDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlO1xuICAgIGZvciAoOyB3aWRnZXRzSW5kZXggPiAtMTsgd2lkZ2V0c0luZGV4LS0pIHtcbiAgICAgIHdpZGdldCA9IHRoaXMuZ3JpZFt3aWRnZXRzSW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICB3aWRnZXQuJGl0ZW0gIT09IGl0ZW0gJiZcbiAgICAgICAgR3JpZHN0ZXJDb21wb25lbnQuY2hlY2tDb2xsaXNpb25Ud29JdGVtc0ZvclN3YXBpbmcod2lkZ2V0LiRpdGVtLCBpdGVtKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB3aWRnZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByZXZpZXdTdHlsZShkcmFnID0gZmFsc2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb3ZpbmdJdGVtKSB7XG4gICAgICBpZiAodGhpcy5jb21wYWN0ICYmIGRyYWcpIHtcbiAgICAgICAgdGhpcy5jb21wYWN0LmNoZWNrQ29tcGFjdEl0ZW0odGhpcy5tb3ZpbmdJdGVtKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucHJldmlld1N0eWxlJC5uZXh0KHRoaXMubW92aW5nSXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJldmlld1N0eWxlJC5uZXh0KG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLS0tLSBFbmQgb2YgZnVuY3Rpb25zIGZvciBzd2FwV2hpbGVEcmFnZ2luZyBvcHRpb25cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L21lbWJlci1vcmRlcmluZ1xuICBwcml2YXRlIHN0YXRpYyBnZXROZXdBcnJheUxlbmd0aChcbiAgICBsZW5ndGg6IG51bWJlcixcbiAgICBvdmVyYWxsU2l6ZTogbnVtYmVyLFxuICAgIHNpemU6IG51bWJlclxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IG5ld0xlbmd0aCA9IE1hdGgubWF4KGxlbmd0aCwgTWF0aC5mbG9vcihvdmVyYWxsU2l6ZSAvIHNpemUpKTtcblxuICAgIGlmIChuZXdMZW5ndGggPCAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKG5ld0xlbmd0aCkpIHtcbiAgICAgIHJldHVybiBNYXRoLmZsb29yKG5ld0xlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsIjxkaXZcbiAgY2xhc3M9XCJncmlkc3Rlci1jb2x1bW5cIlxuICAqbmdGb3I9XCJsZXQgY29sdW1uIG9mIGdyaWRDb2x1bW5zOyBsZXQgaSA9IGluZGV4O1wiXG4gIFtuZ1N0eWxlXT1cImdyaWRSZW5kZXJlci5nZXRHcmlkQ29sdW1uU3R5bGUoaSlcIlxuPjwvZGl2PlxuPGRpdlxuICBjbGFzcz1cImdyaWRzdGVyLXJvd1wiXG4gICpuZ0Zvcj1cImxldCByb3cgb2YgZ3JpZFJvd3M7IGxldCBpID0gaW5kZXg7XCJcbiAgW25nU3R5bGVdPVwiZ3JpZFJlbmRlcmVyLmdldEdyaWRSb3dTdHlsZShpKVwiXG4+PC9kaXY+XG48bmctY29udGVudD48L25nLWNvbnRlbnQ+XG48Z3JpZHN0ZXItcHJldmlld1xuICBbZ3JpZFJlbmRlcmVyXT1cImdyaWRSZW5kZXJlclwiXG4gIFtwcmV2aWV3U3R5bGUkXT1cInByZXZpZXdTdHlsZSRcIlxuICBjbGFzcz1cImdyaWRzdGVyLXByZXZpZXdcIlxuPjwvZ3JpZHN0ZXItcHJldmlldz5cbiJdfQ==