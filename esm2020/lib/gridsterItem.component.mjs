import { NgIf } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, Inject, Input, NgZone, Output, Renderer2, ViewEncapsulation } from '@angular/core';
import { GridsterComponent } from './gridster.component';
import { GridsterDraggable } from './gridsterDraggable.service';
import { GridsterResizable } from './gridsterResizable.service';
import { GridsterUtils } from './gridsterUtils.service';
import * as i0 from "@angular/core";
import * as i1 from "./gridster.component";
export class GridsterItemComponent {
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
        return {
            ...gridResizableHandles,
            ...itemResizableHandles
        };
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
GridsterItemComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterItemComponent, deps: [{ token: ElementRef }, { token: i1.GridsterComponent }, { token: Renderer2 }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterItemComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.1", type: GridsterItemComponent, isStandalone: true, selector: "gridster-item", inputs: { item: "item" }, outputs: { itemInit: "itemInit", itemChange: "itemChange", itemResize: "itemResize" }, host: { properties: { "style.z-index": "this.zIndex" } }, usesOnChanges: true, ngImport: i0, template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"], dependencies: [{ kind: "directive", type: NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.1", ngImport: i0, type: GridsterItemComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-item', encapsulation: ViewEncapsulation.None, standalone: true, imports: [NgIf], template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef, decorators: [{
                    type: Inject,
                    args: [ElementRef]
                }] }, { type: i1.GridsterComponent }, { type: i0.Renderer2, decorators: [{
                    type: Inject,
                    args: [Renderer2]
                }] }, { type: i0.NgZone, decorators: [{
                    type: Inject,
                    args: [NgZone]
                }] }]; }, propDecorators: { item: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJJdGVtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJJdGVtLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJJdGVtLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3ZDLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixXQUFXLEVBQ1gsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBSU4sTUFBTSxFQUNOLFNBQVMsRUFFVCxpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFFekQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFLaEUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDaEUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHlCQUF5QixDQUFDOzs7QUFVeEQsTUFBTSxPQUFPLHFCQUFxQjtJQWlDaEMsWUFDc0IsRUFBYyxFQUNsQyxRQUEyQixFQUNELFFBQW1CLEVBQ3JCLElBQVk7UUFEVixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JCLFNBQUksR0FBSixJQUFJLENBQVE7UUFqQzVCLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFHakMsQ0FBQztRQUNLLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFHbkMsQ0FBQztRQUNLLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFHbkMsQ0FBQztRQXdCSCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLElBQUksRUFBRSxDQUFDLENBQUM7WUFDUixJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ1IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNMLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDTixDQUFDO1FBQ0YsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGlCQUFpQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBckJELElBQ0ksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztJQUN0RSxDQUFDO0lBb0JELFFBQVE7UUFDTixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtZQUNoQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUN2QztTQUNGO1FBQ0QsSUFBSSxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzlDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjtJQUNILENBQUM7SUFFRCxhQUFhO1FBQ1gsSUFBSSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRTtZQUN0RCxJQUFJLEVBQUUsU0FBUztZQUNmLElBQUksRUFBRSxTQUFTO1lBQ2YsQ0FBQyxFQUFFLFNBQVM7WUFDWixDQUFDLEVBQUUsU0FBUztZQUNaLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLGFBQWEsRUFBRSxTQUFTO1lBQ3hCLGNBQWMsRUFBRSxTQUFTO1lBQ3pCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLGdCQUFnQixFQUFFO2dCQUNoQixDQUFDLEVBQUUsU0FBUztnQkFDWixDQUFDLEVBQUUsU0FBUztnQkFDWixDQUFDLEVBQUUsU0FBUztnQkFDWixDQUFDLEVBQUUsU0FBUztnQkFDWixFQUFFLEVBQUUsU0FBUztnQkFDYixFQUFFLEVBQUUsU0FBUztnQkFDYixFQUFFLEVBQUUsU0FBUztnQkFDYixFQUFFLEVBQUUsU0FBUzthQUNkO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSyxDQUFDO0lBQ2xELENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELGNBQWM7UUFDWixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztRQUN0RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUN0RCxNQUFNLEtBQUssR0FDVCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVc7WUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ2hDLE1BQU0sTUFBTSxHQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWTtZQUM1QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFFaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDekMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN6QztZQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDekQ7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzdELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9CO1NBQ0Y7UUFDRCxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2xELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDM0Q7WUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2hFO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFO1lBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0Q7UUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxRQUFzQixFQUFFLFFBQXNCO1FBQzdELElBQ0UsUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSTtZQUMvQixRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJO1lBQy9CLFFBQVEsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDekIsUUFBUSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxFQUN6QjtZQUNBLE9BQU87U0FDUjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDcEI7SUFDSCxDQUFDO0lBRUQsWUFBWTtRQUNWLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7UUFDakUsTUFBTSxlQUFlLEdBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxDQUFDLGVBQWU7WUFDakIsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxlQUFlLElBQUksZUFBZSxDQUFDO0lBQ3JFLENBQUM7SUFFRCxZQUFZO1FBQ1YsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMvRCxNQUFNLGFBQWEsR0FDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEtBQUssU0FBUztZQUNwQyxDQUFDLENBQUMsYUFBYTtZQUNmLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBQztJQUNqRSxDQUFDO0lBRUQsbUJBQW1CO1FBQ2pCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUN0RSxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFDekQsOERBQThEO1FBQzlELElBQUksb0JBQW9CLEtBQUssU0FBUyxFQUFFO1lBQ3RDLE9BQU8sb0JBQW9CLENBQUM7U0FDN0I7UUFDRCwwQkFBMEI7UUFDMUIsT0FBTztZQUNMLEdBQUcsb0JBQW9CO1lBQ3ZCLEdBQUcsb0JBQW9CO1NBQ3hCLENBQUM7SUFDSixDQUFDO0lBRUQsWUFBWSxDQUFDLE1BQWM7UUFDekIsSUFBSSxNQUFNLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRTtZQUN6QixPQUFPO1NBQ1I7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1FBQ3RELElBQUksVUFBVSxHQUFHLFFBQVEsRUFBRTtZQUN6QixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVU7Z0JBQzFDLFdBQVcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1NBQ25EO0lBQ0gsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFjO1FBQ3ZCLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDekIsT0FBTztTQUNSO1FBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3hDLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtZQUNsQixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVU7Z0JBQzFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQztJQUVPLGFBQWE7UUFDbkIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDdEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztTQUM3QjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO1lBQzFELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7U0FDakQ7UUFDRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7O2tIQW5QVSxxQkFBcUIsa0JBa0N0QixVQUFVLDhDQUVWLFNBQVMsYUFDVCxNQUFNO3NHQXJDTCxxQkFBcUIseVFDbkNsQyxxMkRBaURBLDQ1Q0RoQlksSUFBSTsyRkFFSCxxQkFBcUI7a0JBUmpDLFNBQVM7K0JBQ0UsZUFBZSxpQkFHVixpQkFBaUIsQ0FBQyxJQUFJLGNBQ3pCLElBQUksV0FDUCxDQUFDLElBQUksQ0FBQzs7MEJBb0NaLE1BQU07MkJBQUMsVUFBVTs7MEJBRWpCLE1BQU07MkJBQUMsU0FBUzs7MEJBQ2hCLE1BQU07MkJBQUMsTUFBTTs0Q0FsQ1AsSUFBSTtzQkFBWixLQUFLO2dCQUNJLFFBQVE7c0JBQWpCLE1BQU07Z0JBSUcsVUFBVTtzQkFBbkIsTUFBTTtnQkFJRyxVQUFVO3NCQUFuQixNQUFNO2dCQWlCSCxNQUFNO3NCQURULFdBQVc7dUJBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nSWYgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEhvc3RCaW5kaW5nLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBWaWV3RW5jYXBzdWxhdGlvblxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcG9uZW50IH0gZnJvbSAnLi9ncmlkc3Rlci5jb21wb25lbnQnO1xuXG5pbXBvcnQgeyBHcmlkc3RlckRyYWdnYWJsZSB9IGZyb20gJy4vZ3JpZHN0ZXJEcmFnZ2FibGUuc2VydmljZSc7XG5pbXBvcnQge1xuICBHcmlkc3Rlckl0ZW0sXG4gIEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVxufSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJSZXNpemFibGUgfSBmcm9tICcuL2dyaWRzdGVyUmVzaXphYmxlLnNlcnZpY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJVdGlscyB9IGZyb20gJy4vZ3JpZHN0ZXJVdGlscy5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZ3JpZHN0ZXItaXRlbScsXG4gIHRlbXBsYXRlVXJsOiAnLi9ncmlkc3Rlckl0ZW0uaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2dyaWRzdGVySXRlbS5jc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaW1wb3J0czogW05nSWZdXG59KVxuZXhwb3J0IGNsYXNzIEdyaWRzdGVySXRlbUNvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBPbkNoYW5nZXMsIEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVxue1xuICBASW5wdXQoKSBpdGVtOiBHcmlkc3Rlckl0ZW07XG4gIEBPdXRwdXQoKSBpdGVtSW5pdCA9IG5ldyBFdmVudEVtaXR0ZXI8e1xuICAgIGl0ZW06IEdyaWRzdGVySXRlbTtcbiAgICBpdGVtQ29tcG9uZW50OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gIH0+KCk7XG4gIEBPdXRwdXQoKSBpdGVtQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjx7XG4gICAgaXRlbTogR3JpZHN0ZXJJdGVtO1xuICAgIGl0ZW1Db21wb25lbnQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgfT4oKTtcbiAgQE91dHB1dCgpIGl0ZW1SZXNpemUgPSBuZXcgRXZlbnRFbWl0dGVyPHtcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW07XG4gICAgaXRlbUNvbXBvbmVudDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlO1xuICB9PigpO1xuICAkaXRlbTogR3JpZHN0ZXJJdGVtO1xuICBlbDogSFRNTEVsZW1lbnQ7XG4gIGdyaWRzdGVyOiBHcmlkc3RlckNvbXBvbmVudDtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIGRyYWc6IEdyaWRzdGVyRHJhZ2dhYmxlO1xuICByZXNpemU6IEdyaWRzdGVyUmVzaXphYmxlO1xuICBub3RQbGFjZWQ6IGJvb2xlYW47XG4gIGluaXQ6IGJvb2xlYW47XG5cbiAgQEhvc3RCaW5kaW5nKCdzdHlsZS56LWluZGV4JylcbiAgZ2V0IHpJbmRleCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmdldExheWVySW5kZXgoKSArIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuYmFzZUxheWVySW5kZXg7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KEVsZW1lbnRSZWYpIGVsOiBFbGVtZW50UmVmLFxuICAgIGdyaWRzdGVyOiBHcmlkc3RlckNvbXBvbmVudCxcbiAgICBASW5qZWN0KFJlbmRlcmVyMikgcHVibGljIHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgQEluamVjdChOZ1pvbmUpIHByaXZhdGUgem9uZTogTmdab25lXG4gICkge1xuICAgIHRoaXMuZWwgPSBlbC5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuJGl0ZW0gPSB7XG4gICAgICBjb2xzOiAtMSxcbiAgICAgIHJvd3M6IC0xLFxuICAgICAgeDogLTEsXG4gICAgICB5OiAtMVxuICAgIH07XG4gICAgdGhpcy5ncmlkc3RlciA9IGdyaWRzdGVyO1xuICAgIHRoaXMuZHJhZyA9IG5ldyBHcmlkc3RlckRyYWdnYWJsZSh0aGlzLCBncmlkc3RlciwgdGhpcy56b25lKTtcbiAgICB0aGlzLnJlc2l6ZSA9IG5ldyBHcmlkc3RlclJlc2l6YWJsZSh0aGlzLCBncmlkc3RlciwgdGhpcy56b25lKTtcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZ3JpZHN0ZXIuYWRkSXRlbSh0aGlzKTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlcy5pdGVtKSB7XG4gICAgICB0aGlzLnVwZGF0ZU9wdGlvbnMoKTtcblxuICAgICAgaWYgKCF0aGlzLmluaXQpIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5jYWxjdWxhdGVMYXlvdXQkLm5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuaXRlbSAmJiBjaGFuZ2VzLml0ZW0ucHJldmlvdXNWYWx1ZSkge1xuICAgICAgdGhpcy5zZXRTaXplKCk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3B0aW9ucygpOiB2b2lkIHtcbiAgICB0aGlzLiRpdGVtID0gR3JpZHN0ZXJVdGlscy5tZXJnZSh0aGlzLiRpdGVtLCB0aGlzLml0ZW0sIHtcbiAgICAgIGNvbHM6IHVuZGVmaW5lZCxcbiAgICAgIHJvd3M6IHVuZGVmaW5lZCxcbiAgICAgIHg6IHVuZGVmaW5lZCxcbiAgICAgIHk6IHVuZGVmaW5lZCxcbiAgICAgIGxheWVySW5kZXg6IHVuZGVmaW5lZCxcbiAgICAgIGRyYWdFbmFibGVkOiB1bmRlZmluZWQsXG4gICAgICByZXNpemVFbmFibGVkOiB1bmRlZmluZWQsXG4gICAgICBjb21wYWN0RW5hYmxlZDogdW5kZWZpbmVkLFxuICAgICAgbWF4SXRlbVJvd3M6IHVuZGVmaW5lZCxcbiAgICAgIG1pbkl0ZW1Sb3dzOiB1bmRlZmluZWQsXG4gICAgICBtYXhJdGVtQ29sczogdW5kZWZpbmVkLFxuICAgICAgbWluSXRlbUNvbHM6IHVuZGVmaW5lZCxcbiAgICAgIG1heEl0ZW1BcmVhOiB1bmRlZmluZWQsXG4gICAgICBtaW5JdGVtQXJlYTogdW5kZWZpbmVkLFxuICAgICAgcmVzaXphYmxlSGFuZGxlczoge1xuICAgICAgICBzOiB1bmRlZmluZWQsXG4gICAgICAgIGU6IHVuZGVmaW5lZCxcbiAgICAgICAgbjogdW5kZWZpbmVkLFxuICAgICAgICB3OiB1bmRlZmluZWQsXG4gICAgICAgIHNlOiB1bmRlZmluZWQsXG4gICAgICAgIG5lOiB1bmRlZmluZWQsXG4gICAgICAgIHN3OiB1bmRlZmluZWQsXG4gICAgICAgIG53OiB1bmRlZmluZWRcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZ3JpZHN0ZXIucmVtb3ZlSXRlbSh0aGlzKTtcbiAgICB0aGlzLmRyYWcuZGVzdHJveSgpO1xuICAgIHRoaXMucmVzaXplLmRlc3Ryb3koKTtcbiAgICB0aGlzLmdyaWRzdGVyID0gdGhpcy5kcmFnID0gdGhpcy5yZXNpemUgPSBudWxsITtcbiAgfVxuXG4gIHNldFNpemUoKTogdm9pZCB7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVsLCAnZGlzcGxheScsIHRoaXMubm90UGxhY2VkID8gJycgOiAnYmxvY2snKTtcbiAgICB0aGlzLmdyaWRzdGVyLmdyaWRSZW5kZXJlci51cGRhdGVJdGVtKHRoaXMuZWwsIHRoaXMuJGl0ZW0sIHRoaXMucmVuZGVyZXIpO1xuICAgIHRoaXMudXBkYXRlSXRlbVNpemUoKTtcbiAgfVxuXG4gIHVwZGF0ZUl0ZW1TaXplKCk6IHZvaWQge1xuICAgIGNvbnN0IHRvcCA9IHRoaXMuJGl0ZW0ueSAqIHRoaXMuZ3JpZHN0ZXIuY3VyUm93SGVpZ2h0O1xuICAgIGNvbnN0IGxlZnQgPSB0aGlzLiRpdGVtLnggKiB0aGlzLmdyaWRzdGVyLmN1ckNvbFdpZHRoO1xuICAgIGNvbnN0IHdpZHRoID1cbiAgICAgIHRoaXMuJGl0ZW0uY29scyAqIHRoaXMuZ3JpZHN0ZXIuY3VyQ29sV2lkdGggLVxuICAgICAgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5tYXJnaW47XG4gICAgY29uc3QgaGVpZ2h0ID1cbiAgICAgIHRoaXMuJGl0ZW0ucm93cyAqIHRoaXMuZ3JpZHN0ZXIuY3VyUm93SGVpZ2h0IC1cbiAgICAgIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMubWFyZ2luO1xuXG4gICAgdGhpcy50b3AgPSB0b3A7XG4gICAgdGhpcy5sZWZ0ID0gbGVmdDtcblxuICAgIGlmICghdGhpcy5pbml0ICYmIHdpZHRoID4gMCAmJiBoZWlnaHQgPiAwKSB7XG4gICAgICB0aGlzLmluaXQgPSB0cnVlO1xuICAgICAgaWYgKHRoaXMuaXRlbS5pbml0Q2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5pdGVtLmluaXRDYWxsYmFjayh0aGlzLml0ZW0sIHRoaXMpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5pdGVtSW5pdENhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5pdGVtSW5pdENhbGxiYWNrKHRoaXMuaXRlbSwgdGhpcyk7XG4gICAgICB9XG4gICAgICB0aGlzLml0ZW1Jbml0Lm5leHQoeyBpdGVtOiB0aGlzLml0ZW0sIGl0ZW1Db21wb25lbnQ6IHRoaXMgfSk7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5zY3JvbGxUb05ld0l0ZW1zKSB7XG4gICAgICAgIHRoaXMuZWwuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAod2lkdGggIT09IHRoaXMud2lkdGggfHwgaGVpZ2h0ICE9PSB0aGlzLmhlaWdodCkge1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLml0ZW1SZXNpemVDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMuaXRlbVJlc2l6ZUNhbGxiYWNrKHRoaXMuaXRlbSwgdGhpcyk7XG4gICAgICB9XG4gICAgICB0aGlzLml0ZW1SZXNpemUubmV4dCh7IGl0ZW06IHRoaXMuaXRlbSwgaXRlbUNvbXBvbmVudDogdGhpcyB9KTtcbiAgICB9XG4gIH1cblxuICBpdGVtQ2hhbmdlZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLml0ZW1DaGFuZ2VDYWxsYmFjaykge1xuICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLml0ZW1DaGFuZ2VDYWxsYmFjayh0aGlzLml0ZW0sIHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLml0ZW1DaGFuZ2UubmV4dCh7IGl0ZW06IHRoaXMuaXRlbSwgaXRlbUNvbXBvbmVudDogdGhpcyB9KTtcbiAgfVxuXG4gIGNoZWNrSXRlbUNoYW5nZXMobmV3VmFsdWU6IEdyaWRzdGVySXRlbSwgb2xkVmFsdWU6IEdyaWRzdGVySXRlbSk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgIG5ld1ZhbHVlLnJvd3MgPT09IG9sZFZhbHVlLnJvd3MgJiZcbiAgICAgIG5ld1ZhbHVlLmNvbHMgPT09IG9sZFZhbHVlLmNvbHMgJiZcbiAgICAgIG5ld1ZhbHVlLnggPT09IG9sZFZhbHVlLnggJiZcbiAgICAgIG5ld1ZhbHVlLnkgPT09IG9sZFZhbHVlLnlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ3JpZHN0ZXIuY2hlY2tDb2xsaXNpb24odGhpcy4kaXRlbSkpIHtcbiAgICAgIHRoaXMuJGl0ZW0ueCA9IG9sZFZhbHVlLnggfHwgMDtcbiAgICAgIHRoaXMuJGl0ZW0ueSA9IG9sZFZhbHVlLnkgfHwgMDtcbiAgICAgIHRoaXMuJGl0ZW0uY29scyA9IG9sZFZhbHVlLmNvbHMgfHwgMTtcbiAgICAgIHRoaXMuJGl0ZW0ucm93cyA9IG9sZFZhbHVlLnJvd3MgfHwgMTtcbiAgICAgIHRoaXMuc2V0U2l6ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLml0ZW0uY29scyA9IHRoaXMuJGl0ZW0uY29scztcbiAgICAgIHRoaXMuaXRlbS5yb3dzID0gdGhpcy4kaXRlbS5yb3dzO1xuICAgICAgdGhpcy5pdGVtLnggPSB0aGlzLiRpdGVtLng7XG4gICAgICB0aGlzLml0ZW0ueSA9IHRoaXMuJGl0ZW0ueTtcbiAgICAgIHRoaXMuZ3JpZHN0ZXIuY2FsY3VsYXRlTGF5b3V0JC5uZXh0KCk7XG4gICAgICB0aGlzLml0ZW1DaGFuZ2VkKCk7XG4gICAgfVxuICB9XG5cbiAgY2FuQmVEcmFnZ2VkKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGdyaWREcmFnRW5hYmxlZCA9IHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZHJhZ2dhYmxlLmVuYWJsZWQ7XG4gICAgY29uc3QgaXRlbURyYWdFbmFibGVkID1cbiAgICAgIHRoaXMuJGl0ZW0uZHJhZ0VuYWJsZWQgPT09IHVuZGVmaW5lZFxuICAgICAgICA/IGdyaWREcmFnRW5hYmxlZFxuICAgICAgICA6IHRoaXMuJGl0ZW0uZHJhZ0VuYWJsZWQ7XG4gICAgcmV0dXJuICF0aGlzLmdyaWRzdGVyLm1vYmlsZSAmJiBncmlkRHJhZ0VuYWJsZWQgJiYgaXRlbURyYWdFbmFibGVkO1xuICB9XG5cbiAgY2FuQmVSZXNpemVkKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGdyaWRSZXNpemFibGUgPSB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLnJlc2l6YWJsZS5lbmFibGVkO1xuICAgIGNvbnN0IGl0ZW1SZXNpemFibGUgPVxuICAgICAgdGhpcy4kaXRlbS5yZXNpemVFbmFibGVkID09PSB1bmRlZmluZWRcbiAgICAgICAgPyBncmlkUmVzaXphYmxlXG4gICAgICAgIDogdGhpcy4kaXRlbS5yZXNpemVFbmFibGVkO1xuICAgIHJldHVybiAhdGhpcy5ncmlkc3Rlci5tb2JpbGUgJiYgZ3JpZFJlc2l6YWJsZSAmJiBpdGVtUmVzaXphYmxlO1xuICB9XG5cbiAgZ2V0UmVzaXphYmxlSGFuZGxlcygpIHtcbiAgICBjb25zdCBncmlkUmVzaXphYmxlSGFuZGxlcyA9IHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMucmVzaXphYmxlLmhhbmRsZXM7XG4gICAgY29uc3QgaXRlbVJlc2l6YWJsZUhhbmRsZXMgPSB0aGlzLiRpdGVtLnJlc2l6YWJsZUhhbmRsZXM7XG4gICAgLy8gdXNlIGdyaWQgc2V0dGluZ3MgaWYgbm8gc2V0dGluZ3MgYXJlIHByb3ZpZGVkIGZvciB0aGUgaXRlbS5cbiAgICBpZiAoaXRlbVJlc2l6YWJsZUhhbmRsZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGdyaWRSZXNpemFibGVIYW5kbGVzO1xuICAgIH1cbiAgICAvLyBlbHNlIG1lcmdlIHRoZSBzZXR0aW5nc1xuICAgIHJldHVybiB7XG4gICAgICAuLi5ncmlkUmVzaXphYmxlSGFuZGxlcyxcbiAgICAgIC4uLml0ZW1SZXNpemFibGVIYW5kbGVzXG4gICAgfTtcbiAgfVxuXG4gIGJyaW5nVG9Gcm9udChvZmZzZXQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChvZmZzZXQgJiYgb2Zmc2V0IDw9IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGF5ZXJJbmRleCA9IHRoaXMuZ2V0TGF5ZXJJbmRleCgpO1xuICAgIGNvbnN0IHRvcEluZGV4ID0gdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5tYXhMYXllckluZGV4O1xuICAgIGlmIChsYXllckluZGV4IDwgdG9wSW5kZXgpIHtcbiAgICAgIGNvbnN0IHRhcmdldEluZGV4ID0gb2Zmc2V0ID8gbGF5ZXJJbmRleCArIG9mZnNldCA6IHRvcEluZGV4O1xuICAgICAgdGhpcy5pdGVtLmxheWVySW5kZXggPSB0aGlzLiRpdGVtLmxheWVySW5kZXggPVxuICAgICAgICB0YXJnZXRJbmRleCA+IHRvcEluZGV4ID8gdG9wSW5kZXggOiB0YXJnZXRJbmRleDtcbiAgICB9XG4gIH1cblxuICBzZW5kVG9CYWNrKG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKG9mZnNldCAmJiBvZmZzZXQgPD0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXllckluZGV4ID0gdGhpcy5nZXRMYXllckluZGV4KCk7XG4gICAgaWYgKGxheWVySW5kZXggPiAwKSB7XG4gICAgICBjb25zdCB0YXJnZXRJbmRleCA9IG9mZnNldCA/IGxheWVySW5kZXggLSBvZmZzZXQgOiAwO1xuICAgICAgdGhpcy5pdGVtLmxheWVySW5kZXggPSB0aGlzLiRpdGVtLmxheWVySW5kZXggPVxuICAgICAgICB0YXJnZXRJbmRleCA8IDAgPyAwIDogdGFyZ2V0SW5kZXg7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRMYXllckluZGV4KCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuaXRlbS5sYXllckluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLml0ZW0ubGF5ZXJJbmRleDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGVmYXVsdExheWVySW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMuZGVmYXVsdExheWVySW5kZXg7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG59XG4iLCI8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/LnMgJiYgcmVzaXplLnJlc2l6ZUVuYWJsZWRcIlxuICBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLXNcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5lICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1lXCJcbj48L2Rpdj5cbjxkaXZcbiAgKG1vdXNlZG93bik9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICh0b3VjaHN0YXJ0KT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKm5nSWY9XCJyZXNpemUucmVzaXphYmxlSGFuZGxlcz8ubiAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtblwiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/LncgJiYgcmVzaXplLnJlc2l6ZUVuYWJsZWRcIlxuICBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLXdcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5zZSAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtc2VcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5uZSAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtbmVcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5zdyAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtc3dcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5udyAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtbndcIlxuPjwvZGl2PlxuIl19