import { Component, ElementRef, HostBinding, Inject, Input, NgZone, Output, Renderer2, ViewEncapsulation, EventEmitter } from '@angular/core';
import { GridsterDraggable } from './gridsterDraggable.service';
import { GridsterResizable } from './gridsterResizable.service';
import { GridsterUtils } from './gridsterUtils.service';
import { GridsterComponent } from './gridster.component';
import * as i0 from "@angular/core";
import * as i1 from "./gridster.component";
import * as i2 from "@angular/common";
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
GridsterItemComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterItemComponent, deps: [{ token: ElementRef }, { token: i1.GridsterComponent }, { token: Renderer2 }, { token: NgZone }], target: i0.ɵɵFactoryTarget.Component });
GridsterItemComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.6", type: GridsterItemComponent, selector: "gridster-item", inputs: { item: "item" }, outputs: { itemInit: "itemInit", itemChange: "itemChange", itemResize: "itemResize" }, host: { properties: { "style.z-index": "this.zIndex" } }, usesOnChanges: true, ngImport: i0, template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.6", ngImport: i0, type: GridsterItemComponent, decorators: [{
            type: Component,
            args: [{ selector: 'gridster-item', encapsulation: ViewEncapsulation.None, template: "<ng-content></ng-content>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.s && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-s\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.e && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-e\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.n && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-n\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.w && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-w\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.se && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-se\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.ne && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-ne\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.sw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-sw\"\n></div>\n<div\n  (mousedown)=\"resize.dragStartDelay($event)\"\n  (touchstart)=\"resize.dragStartDelay($event)\"\n  *ngIf=\"resize.resizableHandles?.nw && resize.resizeEnabled\"\n  class=\"gridster-item-resizable-handler handle-nw\"\n></div>\n", styles: ["gridster-item{box-sizing:border-box;z-index:1;position:absolute;overflow:hidden;transition:.3s;display:none;background:white;-webkit-user-select:text;user-select:text}gridster-item.gridster-item-moving{cursor:move}gridster-item.gridster-item-resizing,gridster-item.gridster-item-moving{transition:0s;z-index:2;box-shadow:0 0 5px 5px #0003,0 6px 10px #00000024,0 1px 18px #0000001f}.gridster-item-resizable-handler{position:absolute;z-index:2}.gridster-item-resizable-handler.handle-n{cursor:ns-resize;height:10px;right:0;top:0;left:0}.gridster-item-resizable-handler.handle-e{cursor:ew-resize;width:10px;bottom:0;right:0;top:0}.gridster-item-resizable-handler.handle-s{cursor:ns-resize;height:10px;right:0;bottom:0;left:0}.gridster-item-resizable-handler.handle-w{cursor:ew-resize;width:10px;left:0;top:0;bottom:0}.gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}.gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}.gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}.gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXJJdGVtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJJdGVtLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZ3JpZHN0ZXIyL3NyYy9saWIvZ3JpZHN0ZXJJdGVtLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsV0FBVyxFQUNYLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUlOLE1BQU0sRUFDTixTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLFlBQVksRUFDYixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFLeEQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7Ozs7QUFRekQsTUFBTSxPQUFPLHFCQUFxQjtJQWlDaEMsWUFDc0IsRUFBYyxFQUNsQyxRQUEyQixFQUNELFFBQW1CLEVBQ3JCLElBQVk7UUFEVixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JCLFNBQUksR0FBSixJQUFJLENBQVE7UUFqQzVCLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFHakMsQ0FBQztRQUNLLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFHbkMsQ0FBQztRQUNLLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFHbkMsQ0FBQztRQXdCSCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNYLElBQUksRUFBRSxDQUFDLENBQUM7WUFDUixJQUFJLEVB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SyxTQUFTLEVBQUU7WUFDdEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztTQUM3QjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO1lBQzFELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7U0FDakQ7UUFDRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7O2tIQW5QVSxxQkFBcUIsa0JBa0N0QixVQUFVLDhDQUVWLFNBQVMsYUFDVCxNQUFNO3NHQXJDTCxxQkFBcUIscVBDaENsQyxxMkRBaURBOzJGRGpCYSxxQkFBcUI7a0JBTmpDLFNBQVM7K0JBQ0UsZUFBZSxpQkFHVixpQkFBaUIsQ0FBQyxJQUFJOzswQkFvQ2xDLE1BQU07MkJBQUMsVUFBVTs7MEJBRWpCLE1BQU07MkJBQUMsU0FBUzs7MEJBQ2hCLE1BQU07MkJBQUMsTUFBTTs0Q0FsQ1AsSUFBSTtzQkFBWixLQUFLO2dCQUNJLFFBQVE7c0JBQWpCLE1BQU07Z0JBSUcsVUFBVTtzQkFBbkIsTUFBTTtnQkFJRyxVQUFVO3NCQUFuQixNQUFNO2dCQWlCSCxNQUFNO3NCQURULFdBQVc7dUJBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSG9zdEJpbmRpbmcsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBSZW5kZXJlcjIsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBFdmVudEVtaXR0ZXJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IEdyaWRzdGVyRHJhZ2dhYmxlIH0gZnJvbSAnLi9ncmlkc3RlckRyYWdnYWJsZS5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyUmVzaXphYmxlIH0gZnJvbSAnLi9ncmlkc3RlclJlc2l6YWJsZS5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyVXRpbHMgfSBmcm9tICcuL2dyaWRzdGVyVXRpbHMuc2VydmljZSc7XG5pbXBvcnQge1xuICBHcmlkc3Rlckl0ZW0sXG4gIEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZVxufSBmcm9tICcuL2dyaWRzdGVySXRlbS5pbnRlcmZhY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJDb21wb25lbnQgfSBmcm9tICcuL2dyaWRzdGVyLmNvbXBvbmVudCc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2dyaWRzdGVyLWl0ZW0nLFxuICB0ZW1wbGF0ZVVybDogJy4vZ3JpZHN0ZXJJdGVtLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9ncmlkc3Rlckl0ZW0uY3NzJ10sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmVcbn0pXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJJdGVtQ29tcG9uZW50XG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlXG57XG4gIEBJbnB1dCgpIGl0ZW06IEdyaWRzdGVySXRlbTtcbiAgQE91dHB1dCgpIGl0ZW1Jbml0ID0gbmV3IEV2ZW50RW1pdHRlcjx7XG4gICAgaXRlbTogR3JpZHN0ZXJJdGVtO1xuICAgIGl0ZW1Db21wb25lbnQ6IEdyaWRzdGVySXRlbUNvbXBvbmVudEludGVyZmFjZTtcbiAgfT4oKTtcbiAgQE91dHB1dCgpIGl0ZW1DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPHtcbiAgICBpdGVtOiBHcmlkc3Rlckl0ZW07XG4gICAgaXRlbUNvbXBvbmVudDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50SW50ZXJmYWNlO1xuICB9PigpO1xuICBAT3V0cHV0KCkgaXRlbVJlc2l6ZSA9IG5ldyBFdmVudEVtaXR0ZXI8e1xuICAgIGl0ZW06IEdyaWRzdGVySXRlbTtcbiAgICBpdGVtQ29tcG9uZW50OiBHcmlkc3Rlckl0ZW1Db21wb25lbnRJbnRlcmZhY2U7XG4gIH0+KCk7XG4gICRpdGVtOiBHcmlkc3Rlckl0ZW07XG4gIGVsOiBIVE1MRWxlbWVudDtcbiAgZ3JpZHN0ZXI6IEdyaWRzdGVyQ29tcG9uZW50O1xuICB0b3A6IG51bWJlcjtcbiAgbGVmdDogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgZHJhZzogR3JpZHN0ZXJEcmFnZ2FibGU7XG4gIHJlc2l6ZTogR3JpZHN0ZXJSZXNpemFibGU7XG4gIG5vdFBsYWNlZDogYm9vbGVhbjtcbiAgaW5pdDogYm9vbGVhbjtcblxuICBASG9zdEJpbmRpbmcoJ3N0eWxlLnotaW5kZXgnKVxuICBnZXQgekluZGV4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXJJbmRleCgpICsgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5iYXNlTGF5ZXJJbmRleDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRWxlbWVudFJlZikgZWw6IEVsZW1lbnRSZWYsXG4gICAgZ3JpZHN0ZXI6IEdyaWRzdGVyQ29tcG9uZW50LFxuICAgIEBJbmplY3QoUmVuZGVyZXIyKSBwdWJsaWMgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBASW5qZWN0KE5nWm9uZSkgcHJpdmF0ZSB6b25lOiBOZ1pvbmVcbiAgKSB7XG4gICAgdGhpcy5lbCA9IGVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy4kaXRlbSA9IHtcbiAgICAgIGNvbHM6IC0xLFxuICAgICAgcm93czogLTEsXG4gICAgICB4OiAtMSxcbiAgICAgIHk6IC0xXG4gICAgfTtcbiAgICB0aGlzLmdyaWRzdGVyID0gZ3JpZHN0ZXI7XG4gICAgdGhpcy5kcmFnID0gbmV3IEdyaWRzdGVyRHJhZ2dhYmxlKHRoaXMsIGdyaWRzdGVyLCB0aGlzLnpvbmUpO1xuICAgIHRoaXMucmVzaXplID0gbmV3IEdyaWRzdGVyUmVzaXphYmxlKHRoaXMsIGdyaWRzdGVyLCB0aGlzLnpvbmUpO1xuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkc3Rlci5hZGRJdGVtKHRoaXMpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLml0ZW0pIHtcbiAgICAgIHRoaXMudXBkYXRlT3B0aW9ucygpO1xuXG4gICAgICBpZiAoIXRoaXMuaW5pdCkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLmNhbGN1bGF0ZUxheW91dCQubmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlcy5pdGVtICYmIGNoYW5nZXMuaXRlbS5wcmV2aW91c1ZhbHVlKSB7XG4gICAgICB0aGlzLnNldFNpemUoKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVPcHRpb25zKCk6IHZvaWQge1xuICAgIHRoaXMuJGl0ZW0gPSBHcmlkc3RlclV0aWxzLm1lcmdlKHRoaXMuJGl0ZW0sIHRoaXMuaXRlbSwge1xuICAgICAgY29sczogdW5kZWZpbmVkLFxuICAgICAgcm93czogdW5kZWZpbmVkLFxuICAgICAgeDogdW5kZWZpbmVkLFxuICAgICAgeTogdW5kZWZpbmVkLFxuICAgICAgbGF5ZXJJbmRleDogdW5kZWZpbmVkLFxuICAgICAgZHJhZ0VuYWJsZWQ6IHVuZGVmaW5lZCxcbiAgICAgIHJlc2l6ZUVuYWJsZWQ6IHVuZGVmaW5lZCxcbiAgICAgIGNvbXBhY3RFbmFibGVkOiB1bmRlZmluZWQsXG4gICAgICBtYXhJdGVtUm93czogdW5kZWZpbmVkLFxuICAgICAgbWluSXRlbVJvd3M6IHVuZGVmaW5lZCxcbiAgICAgIG1heEl0ZW1Db2xzOiB1bmRlZmluZWQsXG4gICAgICBtaW5JdGVtQ29sczogdW5kZWZpbmVkLFxuICAgICAgbWF4SXRlbUFyZWE6IHVuZGVmaW5lZCxcbiAgICAgIG1pbkl0ZW1BcmVhOiB1bmRlZmluZWQsXG4gICAgICByZXNpemFibGVIYW5kbGVzOiB7XG4gICAgICAgIHM6IHVuZGVmaW5lZCxcbiAgICAgICAgZTogdW5kZWZpbmVkLFxuICAgICAgICBuOiB1bmRlZmluZWQsXG4gICAgICAgIHc6IHVuZGVmaW5lZCxcbiAgICAgICAgc2U6IHVuZGVmaW5lZCxcbiAgICAgICAgbmU6IHVuZGVmaW5lZCxcbiAgICAgICAgc3c6IHVuZGVmaW5lZCxcbiAgICAgICAgbnc6IHVuZGVmaW5lZFxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkc3Rlci5yZW1vdmVJdGVtKHRoaXMpO1xuICAgIHRoaXMuZHJhZy5kZXN0cm95KCk7XG4gICAgdGhpcy5yZXNpemUuZGVzdHJveSgpO1xuICAgIHRoaXMuZ3JpZHN0ZXIgPSB0aGlzLmRyYWcgPSB0aGlzLnJlc2l6ZSA9IG51bGwhO1xuICB9XG5cbiAgc2V0U2l6ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZWwsICdkaXNwbGF5JywgdGhpcy5ub3RQbGFjZWQgPyAnJyA6ICdibG9jaycpO1xuICAgIHRoaXMuZ3JpZHN0ZXIuZ3JpZFJlbmRlcmVyLnVwZGF0ZUl0ZW0odGhpcy5lbCwgdGhpcy4kaXRlbSwgdGhpcy5yZW5kZXJlcik7XG4gICAgdGhpcy51cGRhdGVJdGVtU2l6ZSgpO1xuICB9XG5cbiAgdXBkYXRlSXRlbVNpemUoKTogdm9pZCB7XG4gICAgY29uc3QgdG9wID0gdGhpcy4kaXRlbS55ICogdGhpcy5ncmlkc3Rlci5jdXJSb3dIZWlnaHQ7XG4gICAgY29uc3QgbGVmdCA9IHRoaXMuJGl0ZW0ueCAqIHRoaXMuZ3JpZHN0ZXIuY3VyQ29sV2lkdGg7XG4gICAgY29uc3Qgd2lkdGggPVxuICAgICAgdGhpcy4kaXRlbS5jb2xzICogdGhpcy5ncmlkc3Rlci5jdXJDb2xXaWR0aCAtXG4gICAgICB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLm1hcmdpbjtcbiAgICBjb25zdCBoZWlnaHQgPVxuICAgICAgdGhpcy4kaXRlbS5yb3dzICogdGhpcy5ncmlkc3Rlci5jdXJSb3dIZWlnaHQgLVxuICAgICAgdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5tYXJnaW47XG5cbiAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuXG4gICAgaWYgKCF0aGlzLmluaXQgJiYgd2lkdGggPiAwICYmIGhlaWdodCA+IDApIHtcbiAgICAgIHRoaXMuaW5pdCA9IHRydWU7XG4gICAgICBpZiAodGhpcy5pdGVtLmluaXRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLml0ZW0uaW5pdENhbGxiYWNrKHRoaXMuaXRlbSwgdGhpcyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLml0ZW1Jbml0Q2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLml0ZW1Jbml0Q2FsbGJhY2sodGhpcy5pdGVtLCB0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaXRlbUluaXQubmV4dCh7IGl0ZW06IHRoaXMuaXRlbSwgaXRlbUNvbXBvbmVudDogdGhpcyB9KTtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyLiRvcHRpb25zLnNjcm9sbFRvTmV3SXRlbXMpIHtcbiAgICAgICAgdGhpcy5lbC5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh3aWR0aCAhPT0gdGhpcy53aWR0aCB8fCBoZWlnaHQgIT09IHRoaXMuaGVpZ2h0KSB7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIGlmICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMuaXRlbVJlc2l6ZUNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5pdGVtUmVzaXplQ2FsbGJhY2sodGhpcy5pdGVtLCB0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaXRlbVJlc2l6ZS5uZXh0KHsgaXRlbTogdGhpcy5pdGVtLCBpdGVtQ29tcG9uZW50OiB0aGlzIH0pO1xuICAgIH1cbiAgfVxuXG4gIGl0ZW1DaGFuZ2VkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMuaXRlbUNoYW5nZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMuaXRlbUNoYW5nZUNhbGxiYWNrKHRoaXMuaXRlbSwgdGhpcyk7XG4gICAgfVxuICAgIHRoaXMuaXRlbUNoYW5nZS5uZXh0KHsgaXRlbTogdGhpcy5pdGVtLCBpdGVtQ29tcG9uZW50OiB0aGlzIH0pO1xuICB9XG5cbiAgY2hlY2tJdGVtQ2hhbmdlcyhuZXdWYWx1ZTogR3JpZHN0ZXJJdGVtLCBvbGRWYWx1ZTogR3JpZHN0ZXJJdGVtKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgbmV3VmFsdWUucm93cyA9PT0gb2xkVmFsdWUucm93cyAmJlxuICAgICAgbmV3VmFsdWUuY29scyA9PT0gb2xkVmFsdWUuY29scyAmJlxuICAgICAgbmV3VmFsdWUueCA9PT0gb2xkVmFsdWUueCAmJlxuICAgICAgbmV3VmFsdWUueSA9PT0gb2xkVmFsdWUueVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5ncmlkc3Rlci5jaGVja0NvbGxpc2lvbih0aGlzLiRpdGVtKSkge1xuICAgICAgdGhpcy4kaXRlbS54ID0gb2xkVmFsdWUueCB8fCAwO1xuICAgICAgdGhpcy4kaXRlbS55ID0gb2xkVmFsdWUueSB8fCAwO1xuICAgICAgdGhpcy4kaXRlbS5jb2xzID0gb2xkVmFsdWUuY29scyB8fCAxO1xuICAgICAgdGhpcy4kaXRlbS5yb3dzID0gb2xkVmFsdWUucm93cyB8fCAxO1xuICAgICAgdGhpcy5zZXRTaXplKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXRlbS5jb2xzID0gdGhpcy4kaXRlbS5jb2xzO1xuICAgICAgdGhpcy5pdGVtLnJvd3MgPSB0aGlzLiRpdGVtLnJvd3M7XG4gICAgICB0aGlzLml0ZW0ueCA9IHRoaXMuJGl0ZW0ueDtcbiAgICAgIHRoaXMuaXRlbS55ID0gdGhpcy4kaXRlbS55O1xuICAgICAgdGhpcy5ncmlkc3Rlci5jYWxjdWxhdGVMYXlvdXQkLm5leHQoKTtcbiAgICAgIHRoaXMuaXRlbUNoYW5nZWQoKTtcbiAgICB9XG4gIH1cblxuICBjYW5CZURyYWdnZWQoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZ3JpZERyYWdFbmFibGVkID0gdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kcmFnZ2FibGUuZW5hYmxlZDtcbiAgICBjb25zdCBpdGVtRHJhZ0VuYWJsZWQgPVxuICAgICAgdGhpcy4kaXRlbS5kcmFnRW5hYmxlZCA9PT0gdW5kZWZpbmVkXG4gICAgICAgID8gZ3JpZERyYWdFbmFibGVkXG4gICAgICAgIDogdGhpcy4kaXRlbS5kcmFnRW5hYmxlZDtcbiAgICByZXR1cm4gIXRoaXMuZ3JpZHN0ZXIubW9iaWxlICYmIGdyaWREcmFnRW5hYmxlZCAmJiBpdGVtRHJhZ0VuYWJsZWQ7XG4gIH1cblxuICBjYW5CZVJlc2l6ZWQoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZ3JpZFJlc2l6YWJsZSA9IHRoaXMuZ3JpZHN0ZXIuJG9wdGlvbnMucmVzaXphYmxlLmVuYWJsZWQ7XG4gICAgY29uc3QgaXRlbVJlc2l6YWJsZSA9XG4gICAgICB0aGlzLiRpdGVtLnJlc2l6ZUVuYWJsZWQgPT09IHVuZGVmaW5lZFxuICAgICAgICA/IGdyaWRSZXNpemFibGVcbiAgICAgICAgOiB0aGlzLiRpdGVtLnJlc2l6ZUVuYWJsZWQ7XG4gICAgcmV0dXJuICF0aGlzLmdyaWRzdGVyLm1vYmlsZSAmJiBncmlkUmVzaXphYmxlICYmIGl0ZW1SZXNpemFibGU7XG4gIH1cblxuICBnZXRSZXNpemFibGVIYW5kbGVzKCkge1xuICAgIGNvbnN0IGdyaWRSZXNpemFibGVIYW5kbGVzID0gdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5yZXNpemFibGUuaGFuZGxlcztcbiAgICBjb25zdCBpdGVtUmVzaXphYmxlSGFuZGxlcyA9IHRoaXMuJGl0ZW0ucmVzaXphYmxlSGFuZGxlcztcbiAgICAvLyB1c2UgZ3JpZCBzZXR0aW5ncyBpZiBubyBzZXR0aW5ncyBhcmUgcHJvdmlkZWQgZm9yIHRoZSBpdGVtLlxuICAgIGlmIChpdGVtUmVzaXphYmxlSGFuZGxlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZ3JpZFJlc2l6YWJsZUhhbmRsZXM7XG4gICAgfVxuICAgIC8vIGVsc2UgbWVyZ2UgdGhlIHNldHRpbmdzXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmdyaWRSZXNpemFibGVIYW5kbGVzLFxuICAgICAgLi4uaXRlbVJlc2l6YWJsZUhhbmRsZXNcbiAgICB9O1xuICB9XG5cbiAgYnJpbmdUb0Zyb250KG9mZnNldDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKG9mZnNldCAmJiBvZmZzZXQgPD0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXllckluZGV4ID0gdGhpcy5nZXRMYXllckluZGV4KCk7XG4gICAgY29uc3QgdG9wSW5kZXggPSB0aGlzLmdyaWRzdGVyLiRvcHRpb25zLm1heExheWVySW5kZXg7XG4gICAgaWYgKGxheWVySW5kZXggPCB0b3BJbmRleCkge1xuICAgICAgY29uc3QgdGFyZ2V0SW5kZXggPSBvZmZzZXQgPyBsYXllckluZGV4ICsgb2Zmc2V0IDogdG9wSW5kZXg7XG4gICAgICB0aGlzLml0ZW0ubGF5ZXJJbmRleCA9IHRoaXMuJGl0ZW0ubGF5ZXJJbmRleCA9XG4gICAgICAgIHRhcmdldEluZGV4ID4gdG9wSW5kZXggPyB0b3BJbmRleCA6IHRhcmdldEluZGV4O1xuICAgIH1cbiAgfVxuXG4gIHNlbmRUb0JhY2sob2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAob2Zmc2V0ICYmIG9mZnNldCA8PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxheWVySW5kZXggPSB0aGlzLmdldExheWVySW5kZXgoKTtcbiAgICBpZiAobGF5ZXJJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHRhcmdldEluZGV4ID0gb2Zmc2V0ID8gbGF5ZXJJbmRleCAtIG9mZnNldCA6IDA7XG4gICAgICB0aGlzLml0ZW0ubGF5ZXJJbmRleCA9IHRoaXMuJGl0ZW0ubGF5ZXJJbmRleCA9XG4gICAgICAgIHRhcmdldEluZGV4IDwgMCA/IDAgOiB0YXJnZXRJbmRleDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldExheWVySW5kZXgoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5pdGVtLmxheWVySW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXRlbS5sYXllckluZGV4O1xuICAgIH1cbiAgICBpZiAodGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kZWZhdWx0TGF5ZXJJbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5ncmlkc3Rlci4kb3B0aW9ucy5kZWZhdWx0TGF5ZXJJbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsIjxuZy1jb250ZW50PjwvbmctY29udGVudD5cbjxkaXZcbiAgKG1vdXNlZG93bik9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICh0b3VjaHN0YXJ0KT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKm5nSWY9XCJyZXNpemUucmVzaXphYmxlSGFuZGxlcz8ucyAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtc1wiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/LmUgJiYgcmVzaXplLnJlc2l6ZUVuYWJsZWRcIlxuICBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLWVcIlxuPjwvZGl2PlxuPGRpdlxuICAobW91c2Vkb3duKT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKHRvdWNoc3RhcnQpPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAqbmdJZj1cInJlc2l6ZS5yZXNpemFibGVIYW5kbGVzPy5uICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1uXCJcbj48L2Rpdj5cbjxkaXZcbiAgKG1vdXNlZG93bik9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICh0b3VjaHN0YXJ0KT1cInJlc2l6ZS5kcmFnU3RhcnREZWxheSgkZXZlbnQpXCJcbiAgKm5nSWY9XCJyZXNpemUucmVzaXphYmxlSGFuZGxlcz8udyAmJiByZXNpemUucmVzaXplRW5hYmxlZFwiXG4gIGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtd1wiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/LnNlICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1zZVwiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/Lm5lICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1uZVwiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/LnN3ICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1zd1wiXG4+PC9kaXY+XG48ZGl2XG4gIChtb3VzZWRvd24pPVwicmVzaXplLmRyYWdTdGFydERlbGF5KCRldmVudClcIlxuICAodG91Y2hzdGFydCk9XCJyZXNpemUuZHJhZ1N0YXJ0RGVsYXkoJGV2ZW50KVwiXG4gICpuZ0lmPVwicmVzaXplLnJlc2l6YWJsZUhhbmRsZXM/Lm53ICYmIHJlc2l6ZS5yZXNpemVFbmFibGVkXCJcbiAgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1ud1wiXG4+PC9kaXY+XG4iXX0=